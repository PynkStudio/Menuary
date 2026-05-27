import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPauseUntil, upsertAiPhoneSettings } from "@/lib/retell/settings";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { normalizeWhatsappPhone } from "@/lib/tenant-support/admin-contacts";
import type { Database, Json } from "@/lib/supabase/types";
import {
  extractMenuItemsFromImage,
  normalizeExtractedMenuPhotoResult,
  slugifyMenuCode,
  type ExtractedMenuPhotoResult,
} from "@/lib/menu-photo-import";

type Db = SupabaseClient<Database>;

type ContactRow = {
  id: string;
  tenant_id: string;
  phone_e164: string;
  display_name: string | null;
  contact_kind: "tenantadmin" | "employee";
  permissions: Json;
};

type TenantRow = {
  id: string;
  name: string;
};

type ConversationRow = {
  id: string;
  tenant_id: string | null;
  sender_phone_e164: string;
  state: "active" | "pending_tenant_selection" | "pending_ticket_confirmation" | "ticket_opened" | "closed";
  pending_ticket_subject: string | null;
  pending_ticket_body: string | null;
};

type AiWhatsappIntent =
  | "pause_new_orders_today"
  | "resume_new_orders"
  | "open_support_ticket"
  | "import_menu_photo"
  | "answer"
  | "unsupported";

type AiWhatsappAnalysis = {
  intent: AiWhatsappIntent;
  confidence: number;
  reply: string;
  ticketSubject: string;
  ticketBody: string;
  reason: string;
};

export type TenantSupportWhatsappInput = {
  from: string;
  text: string;
  imageUrl?: string | null;
  messageId?: string | null;
  payload?: unknown;
};

export type TenantSupportWhatsappResult = {
  ok: true;
  conversationId?: string;
  tenantId?: string | null;
  replies: string[];
  action?: {
    type: string;
    status: "applied" | "unsupported" | "failed" | "proposed" | "rejected";
  };
};

const UNSUPPORTED_DESTRUCTIVE_RE =
  /\b(cancell|elimina|rimuovi|distruggi|resetta).*\b(ristorante|locale|tenant|menu|men[uù]\s+intero|account)\b/i;
const PAUSE_ORDERS_TODAY_RE =
  /\b(sospendi|blocca|ferma|stoppa|disattiva)\b.*\b(ordini|ordinazioni)\b.*\b(oggi|giornata|stasera|turno)\b/i;
const RESUME_ORDERS_RE =
  /\b(riattiva|riprendi|accetta|sblocca)\b.*\b(ordini|ordinazioni)\b/i;
const OPEN_TICKET_RE =
  /\b(apri|crea|manda|invia)\b.*\b(ticket|assistenza|supporto)\b/i;
const YES_RE = /^(si|sì|ok|confermo|procedi|apri ticket|va bene)\b/i;
const IMPORT_MENU_PHOTO_RE =
  /\b(carica|importa|aggiungi|inserisci|aggiorna)\b.*\b(menu|men[uù]|piatti|prodotti|articoli|voci|listino|appunti)\b/i;
const PHOTO_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const AI_INTENT_CONFIDENCE_THRESHOLD = 0.72;
const AI_WHATSAPP_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["intent", "confidence", "reply", "ticketSubject", "ticketBody", "reason"],
  properties: {
    intent: {
      type: "string",
      enum: [
        "pause_new_orders_today",
        "resume_new_orders",
        "open_support_ticket",
        "import_menu_photo",
        "answer",
        "unsupported",
      ],
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
    reply: { type: "string" },
    ticketSubject: { type: "string" },
    ticketBody: { type: "string" },
    reason: { type: "string" },
  },
};

type TenantSupportPermission =
  | "manageMenu"
  | "manageSettings"
  | "manageHours"
  | "createSupportTickets";

function db(): Db {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client;
}

function asJson(value: unknown): Json {
  return value as Json;
}

function hasPermission(contact: ContactRow, permission: TenantSupportPermission): boolean {
  if (contact.contact_kind === "tenantadmin") return true;
  const permissions = contact.permissions && typeof contact.permissions === "object" && !Array.isArray(contact.permissions)
    ? contact.permissions as Record<string, unknown>
    : {};
  return permissions[permission] === true;
}

async function insertMessage(
  svc: Db,
  params: {
    conversationId: string;
    tenantId: string | null;
    direction: "inbound" | "outbound";
    phone: string;
    body: string;
    messageId?: string | null;
    payload?: unknown;
  },
) {
  await (svc as unknown as {
    from: (table: "tenant_customer_service_messages") => {
      insert: (row: Record<string, unknown>) => Promise<unknown>;
    };
  }).from("tenant_customer_service_messages").insert({
    conversation_id: params.conversationId,
    tenant_id: params.tenantId,
    direction: params.direction,
    sender_phone_e164: params.phone,
    message_id: params.messageId ?? null,
    body: params.body,
    payload: asJson(params.payload ?? {}),
  });
}

async function getContactsForPhone(svc: Db, phone: string): Promise<Array<ContactRow & { tenant: TenantRow | null }>> {
  const query = (svc as unknown as {
    from: (table: "tenant_customer_service_contacts") => {
      select: (columns: string) => {
        eq: (column: string, value: string | boolean) => {
          eq: (column: string, value: string | boolean) => {
            order: (column: string, opts?: { ascending?: boolean }) => Promise<{ data: Array<ContactRow & { tenants: TenantRow | null }> | null }>;
          };
        };
      };
    };
  })
    .from("tenant_customer_service_contacts")
    .select("id,tenant_id,phone_e164,display_name,contact_kind,permissions,tenants(id,name)")
    .eq("phone_e164", phone)
    .eq("enabled", true)
    .order("tenant_id", { ascending: true });

  const { data } = await query;

  return (data ?? []).map((row: ContactRow & { tenants: TenantRow | null }) => ({
    ...row,
    tenant: row.tenants,
  }));
}

async function getActiveConversation(svc: Db, phone: string): Promise<ConversationRow | null> {
  const { data } = await (svc as unknown as {
    from: (table: "tenant_customer_service_conversations") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          neq: (column: string, value: string) => {
            order: (column: string, opts?: { ascending?: boolean }) => {
              limit: (count: number) => {
                maybeSingle: () => Promise<{ data: ConversationRow | null }>;
              };
            };
          };
        };
      };
    };
  })
    .from("tenant_customer_service_conversations")
    .select("id,tenant_id,sender_phone_e164,state,pending_ticket_subject,pending_ticket_body")
    .eq("sender_phone_e164", phone)
    .neq("state", "closed")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function createConversation(svc: Db, phone: string, tenantId: string | null, state: ConversationRow["state"]) {
  const { data, error } = await (svc as unknown as {
    from: (table: "tenant_customer_service_conversations") => {
      insert: (row: Record<string, unknown>) => {
        select: (columns: string) => {
          single: () => Promise<{ data: ConversationRow | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("tenant_customer_service_conversations")
    .insert({
      sender_phone_e164: phone,
      tenant_id: tenantId,
      state,
    })
    .select("id,tenant_id,sender_phone_e164,state,pending_ticket_subject,pending_ticket_body")
    .single();
  if (error || !data) throw new Error(error?.message ?? "conversation_create_failed");
  return data;
}

async function patchConversation(
  svc: Db,
  conversationId: string,
  patch: Partial<Pick<ConversationRow, "tenant_id" | "state" | "pending_ticket_subject" | "pending_ticket_body">>,
) {
  await (svc as unknown as {
    from: (table: "tenant_customer_service_conversations") => {
      update: (row: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<unknown>;
      };
    };
  })
    .from("tenant_customer_service_conversations")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
}

function tenantDisclosure(contacts: Array<ContactRow & { tenant: TenantRow | null }>): string {
  const rows = contacts
    .map((contact, index) => `${index + 1}. ${contact.tenant?.name ?? contact.tenant_id} (${contact.tenant_id})`)
    .join("\n");
  return `Questo numero e associato a piu locali. Per quale locale vuoi parlare?\n${rows}\n\nRispondi con il numero o con il nome del locale.`;
}

function resolveTenantSelection(text: string, contacts: Array<ContactRow & { tenant: TenantRow | null }>): string | null {
  const normalized = text.trim().toLowerCase();
  const asNumber = Number.parseInt(normalized, 10);
  if (Number.isInteger(asNumber) && asNumber > 0 && asNumber <= contacts.length) {
    return contacts[asNumber - 1]?.tenant_id ?? null;
  }
  const match = contacts.find((contact) => {
    const tenantName = contact.tenant?.name?.toLowerCase() ?? "";
    return contact.tenant_id.toLowerCase() === normalized || tenantName.includes(normalized) || normalized.includes(tenantName);
  });
  return match?.tenant_id ?? null;
}

function contactForTenant(
  contacts: Array<ContactRow & { tenant: TenantRow | null }>,
  tenantId: string | null,
): (ContactRow & { tenant: TenantRow | null }) | null {
  if (!tenantId) return null;
  return contacts.find((contact) => contact.tenant_id === tenantId) ?? null;
}

function parseOpenAIResponseText(payload: unknown): string {
  const response = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };
  if (typeof response.output_text === "string") return response.output_text;
  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return "";
}

function normalizeAiWhatsappAnalysis(value: unknown): AiWhatsappAnalysis | null {
  const parsed = value as Partial<AiWhatsappAnalysis>;
  const allowedIntents: AiWhatsappIntent[] = [
    "pause_new_orders_today",
    "resume_new_orders",
    "open_support_ticket",
    "import_menu_photo",
    "answer",
    "unsupported",
  ];
  if (!parsed.intent || !allowedIntents.includes(parsed.intent)) return null;
  const confidence = typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
    ? Math.max(0, Math.min(1, parsed.confidence))
    : 0;
  return {
    intent: parsed.intent,
    confidence,
    reply: typeof parsed.reply === "string" ? parsed.reply.trim().slice(0, 1200) : "",
    ticketSubject: typeof parsed.ticketSubject === "string" ? parsed.ticketSubject.trim().slice(0, 90) : "",
    ticketBody: typeof parsed.ticketBody === "string" ? parsed.ticketBody.trim().slice(0, 3000) : "",
    reason: typeof parsed.reason === "string" ? parsed.reason.trim().slice(0, 600) : "",
  };
}

async function analyzeWhatsappIntentWithAi(params: {
  tenantName: string;
  contactKind: ContactRow["contact_kind"];
  permissions: ContactRow["permissions"];
  text: string;
  hasImage: boolean;
}): Promise<AiWhatsappAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const body = {
    model: process.env.OPENAI_WHATSAPP_MODEL || "gpt-5-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              "Sei l'assistente operativo WhatsApp per i gestori di locali su Menuary.",
              "Classifica il messaggio in uno degli intent consentiti e genera una risposta breve in italiano.",
              "Non promettere azioni non elencate. Non modificare dati distruttivi. Non inventare stato, prenotazioni, ordini o informazioni non presenti nel messaggio.",
              "Usa open_support_ticket quando serve intervento umano, quando la richiesta e vaga ma operativa, o quando l'utente chiede qualcosa fuori dalle azioni disponibili.",
              "Usa answer solo per chiarimenti semplici sul funzionamento del canale WhatsApp o per chiedere una precisazione.",
              "Usa import_menu_photo solo se l'utente vuole caricare/importare/aggiornare voci menu da una foto o appunti allegati.",
              "Le azioni disponibili sono: sospendere nuovi ordini fino a fine giornata, riattivare nuovi ordini, aprire ticket supporto, importare menu da foto, rispondere/chiedere chiarimenti.",
            ].join("\n"),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              tenantName: params.tenantName,
              contactKind: params.contactKind,
              permissions: params.permissions,
              hasImage: params.hasImage,
              message: params.text,
            }),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "whatsapp_tenant_support_intent",
        strict: true,
        schema: AI_WHATSAPP_ANALYSIS_SCHEMA,
      },
    },
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[tenant-support-whatsapp] openai intent analysis failed", {
      status: response.status,
      error: errorBody.slice(0, 240),
    });
    return null;
  }

  const text = parseOpenAIResponseText(await response.json());
  if (!text) return null;
  try {
    return normalizeAiWhatsappAnalysis(JSON.parse(text));
  } catch (error) {
    console.error("[tenant-support-whatsapp] openai intent parse failed", error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function insertAction(
  svc: Db,
  params: {
    conversationId: string;
    tenantId: string | null;
    phone: string;
    inputText: string;
    actionType: string;
    status: "applied" | "unsupported" | "failed" | "proposed" | "rejected";
    parameters?: unknown;
    result?: unknown;
    error?: string;
  },
) {
  await (svc as unknown as {
    from: (table: "tenant_customer_service_actions") => {
      insert: (row: Record<string, unknown>) => Promise<unknown>;
    };
  }).from("tenant_customer_service_actions").insert({
    conversation_id: params.conversationId,
    tenant_id: params.tenantId,
    action_type: params.actionType,
    status: params.status,
    requested_by_phone_e164: params.phone,
    input_text: params.inputText,
    parameters: asJson(params.parameters ?? {}),
    result: asJson(params.result ?? {}),
    error: params.error ?? null,
    applied_at: params.status === "applied" ? new Date().toISOString() : null,
  });
}

async function getLatestProposedMenuImport(
  svc: Db,
  conversationId: string,
): Promise<{ id: string; result: Json } | null> {
  const { data } = await (svc as unknown as {
    from: (table: "tenant_customer_service_actions") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            eq: (column: string, value: string) => {
              order: (column: string, opts?: { ascending?: boolean }) => {
                limit: (count: number) => {
                  maybeSingle: () => Promise<{ data: { id: string; result: Json } | null }>;
                };
              };
            };
          };
        };
      };
    };
  })
    .from("tenant_customer_service_actions")
    .select("id,result")
    .eq("conversation_id", conversationId)
    .eq("action_type", "import_menu_photo")
    .eq("status", "proposed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function markActionApplied(svc: Db, actionId: string) {
  await (svc as unknown as {
    from: (table: "tenant_customer_service_actions") => {
      update: (row: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<unknown>;
      };
    };
  })
    .from("tenant_customer_service_actions")
    .update({ status: "applied", applied_at: new Date().toISOString() })
    .eq("id", actionId);
}

async function remoteImageToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:image/")) return url;
  if (!/^https?:\/\//i.test(url)) throw new Error("image_url_must_be_absolute");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`image_fetch_failed:${response.status}`);
  const mime = response.headers.get("content-type")?.split(";")[0] ?? "";
  if (!PHOTO_MIME.includes(mime)) throw new Error("invalid_image_type");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_PHOTO_SIZE) throw new Error("image_too_large");
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function formatImportPreview(result: ExtractedMenuPhotoResult): string {
  if (result.items.length === 0) {
    return "Ho analizzato la foto ma non ho trovato voci menu caricabili. Puoi inviare una foto piu leggibile o aprire un ticket.";
  }
  const lines = result.items.slice(0, 12).map((item, index) => {
    const price = item.price == null ? "prezzo da verificare" : `€${item.price.toFixed(2).replace(".", ",")}`;
    const photo = item.needsPhoto ? "foto consigliata" : "foto opzionale";
    return `${index + 1}. ${item.name} - ${item.categoryName} - ${price} - ${photo}`;
  });
  const extra = result.items.length > 12 ? `\n...altre ${result.items.length - 12} voci nella bozza.` : "";
  const warnings = result.warnings.length > 0 ? `\n\nNote: ${result.warnings.join(" ")}` : "";
  return `Ho preparato questa anteprima. Rispondi "confermo" per caricare le voci, oppure invia correzioni e apro un ticket.\n\n${lines.join("\n")}${extra}${warnings}\n\nLe foto dei singoli articoli sono opzionali: se previste, caricale poi dal pannello sull'articolo.`;
}

async function ensureCategory(
  svc: Db,
  tenantId: string,
  categoryName: string,
): Promise<string> {
  const code = slugifyMenuCode(categoryName);
  const existing = await (svc as unknown as {
    from: (table: "menu_categories") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: { id: string } | null }>;
          };
        };
      };
    };
  })
    .from("menu_categories")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("code", code)
    .maybeSingle();
  if (existing.data?.id) return existing.data.id;

  const latest = await (svc as unknown as {
    from: (table: "menu_categories") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, opts?: { ascending?: boolean }) => {
            limit: (count: number) => Promise<{ data: Array<{ position: number }> | null }>;
          };
        };
      };
    };
  })
    .from("menu_categories")
    .select("position")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: false })
    .limit(1);
  const position = (latest.data?.[0]?.position ?? 0) + 1;

  const inserted = await (svc as unknown as {
    from: (table: "menu_categories") => {
      insert: (row: Record<string, unknown>) => {
        select: (columns: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("menu_categories")
    .insert({ tenant_id: tenantId, code, title: categoryName, position })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) throw new Error(inserted.error?.message ?? "menu_category_create_failed");
  return inserted.data.id;
}

async function applyMenuPhotoImport(
  svc: Db,
  tenantId: string,
  result: ExtractedMenuPhotoResult,
): Promise<{ created: number }> {
  let created = 0;
  const categoryIds = new Map<string, string>();
  for (const item of result.items) {
    const categoryKey = item.categoryName.trim() || "Senza categoria";
    const categoryId = categoryIds.get(categoryKey) ?? (await ensureCategory(svc, tenantId, categoryKey));
    categoryIds.set(categoryKey, categoryId);
    const code = `${slugifyMenuCode(item.name)}-${Date.now().toString(36)}-${created}`;
    const price = item.price ?? 0;
    const { error } = await (svc as unknown as {
      from: (table: "menu_items") => {
        insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      };
    })
      .from("menu_items")
      .insert({
        tenant_id: tenantId,
        category_id: categoryId,
        code,
        name: item.name,
        description: item.description || null,
        price_kind: "single",
        price: { kind: "single", value: price },
        tags: item.tags,
        available: true,
        position: 9999,
      });
    if (error) throw new Error(error.message);
    created += 1;
  }
  return { created };
}

async function createSupportTicket(
  svc: Db,
  params: {
    tenantId: string | null;
    phone: string;
    subject: string;
    body: string;
    conversationId: string;
  },
) {
  const { data, error } = await (svc as unknown as {
    from: (table: "support_tickets") => {
      insert: (row: Record<string, unknown>) => {
        select: (columns: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("support_tickets")
    .insert({
      tenant_id: params.tenantId,
      requester_phone_e164: params.phone,
      subject: params.subject,
      body: params.body,
      metadata: asJson({ conversationId: params.conversationId }),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "ticket_create_failed");
  await (svc as unknown as {
    from: (table: "support_ticket_messages") => {
      insert: (row: Record<string, unknown>) => Promise<unknown>;
    };
  }).from("support_ticket_messages").insert({
    ticket_id: data.id,
    direction: "inbound",
    channel: "whatsapp",
    from_address: params.phone,
    body: params.body,
    metadata: asJson({ conversationId: params.conversationId }),
  });
  return data.id;
}

function ticketDraftFromText(text: string) {
  const clean = text.trim();
  const withoutCommand = clean.replace(OPEN_TICKET_RE, "").trim();
  return {
    subject: withoutCommand.slice(0, 90) || "Richiesta assistenza da WhatsApp",
    body: clean,
  };
}

async function proposeMenuPhotoImport(
  svc: Db,
  params: {
    conversation: ConversationRow;
    tenantId: string;
    phone: string;
    text: string;
    imageUrl: string;
  },
): Promise<Pick<TenantSupportWhatsappResult, "replies" | "action">> {
  const imageDataUrl = await remoteImageToDataUrl(params.imageUrl);
  const result = await extractMenuItemsFromImage({
    imageDataUrl,
    locale: "it",
    context: "Import menu da WhatsApp support tenant",
  });
  await insertAction(svc, {
    conversationId: params.conversation.id,
    tenantId: params.tenantId,
    phone: params.phone,
    inputText: params.text,
    actionType: "import_menu_photo",
    status: "proposed",
    parameters: { imageProvided: true },
    result,
  });
  return {
    replies: [formatImportPreview(result)],
    action: { type: "import_menu_photo", status: "proposed" },
  };
}

async function handleAiRoutedIntent(
  svc: Db,
  conversation: ConversationRow,
  contact: ContactRow & { tenant: TenantRow | null },
  phone: string,
  text: string,
  imageUrl: string | null | undefined,
): Promise<Pick<TenantSupportWhatsappResult, "replies" | "action"> | null> {
  const tenantId = conversation.tenant_id;
  if (!tenantId) return null;

  const analysis = await analyzeWhatsappIntentWithAi({
    tenantName: contact.tenant?.name ?? tenantId,
    contactKind: contact.contact_kind,
    permissions: contact.permissions,
    text,
    hasImage: Boolean(imageUrl),
  });
  if (!analysis || analysis.confidence < AI_INTENT_CONFIDENCE_THRESHOLD) return null;

  await insertAction(svc, {
    conversationId: conversation.id,
    tenantId,
    phone,
    inputText: text,
    actionType: `ai_intent_${analysis.intent}`,
    status: "proposed",
    parameters: analysis,
  });

  if (analysis.intent === "pause_new_orders_today") {
    if (!hasPermission(contact, "manageSettings")) {
      return {
        replies: ["Questo numero non ha l'autorizzazione per gestire le impostazioni del locale via WhatsApp. Chiedi al superadmin di abilitarla."],
        action: { type: "pause_new_orders_today", status: "rejected" },
      };
    }
    const settings = await upsertAiPhoneSettings(tenantId, {
      quickSettings: { acceptNewOrders: buildPauseUntil("day-end") },
    });
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: "pause_new_orders_today",
      status: "applied",
      parameters: { routedBy: "openai", confidence: analysis.confidence },
      result: { disabledUntil: settings.quickSettings.acceptNewOrders.disabledUntil },
    });
    return {
      replies: [analysis.reply || "Fatto: ho sospeso i nuovi ordini WhatsApp e chiamate IA fino a fine giornata."],
      action: { type: "pause_new_orders_today", status: "applied" },
    };
  }

  if (analysis.intent === "resume_new_orders") {
    if (!hasPermission(contact, "manageSettings")) {
      return {
        replies: ["Questo numero non ha l'autorizzazione per gestire le impostazioni del locale via WhatsApp. Chiedi al superadmin di abilitarla."],
        action: { type: "resume_new_orders", status: "rejected" },
      };
    }
    await upsertAiPhoneSettings(tenantId, {
      quickSettings: { acceptNewOrders: buildPauseUntil("accept") },
    });
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: "resume_new_orders",
      status: "applied",
      parameters: { routedBy: "openai", confidence: analysis.confidence },
    });
    return {
      replies: [analysis.reply || "Fatto: i nuovi ordini WhatsApp e chiamate IA sono di nuovo attivi."],
      action: { type: "resume_new_orders", status: "applied" },
    };
  }

  if (analysis.intent === "import_menu_photo") {
    if (!imageUrl) {
      return {
        replies: [analysis.reply || "Mandami una foto del menu o degli appunti insieme alla richiesta di caricare le voci."],
        action: { type: "import_menu_photo", status: "proposed" },
      };
    }
    if (!hasPermission(contact, "manageMenu")) {
      return {
        replies: ["Questo numero non ha l'autorizzazione per modificare il menu via WhatsApp. Chiedi al superadmin di abilitarla."],
        action: { type: "import_menu_photo", status: "rejected" },
      };
    }
    return proposeMenuPhotoImport(svc, {
      conversation,
      tenantId,
      phone,
      text,
      imageUrl,
    });
  }

  if (analysis.intent === "open_support_ticket") {
    if (!hasPermission(contact, "createSupportTickets")) {
      return {
        replies: ["Questo numero non ha l'autorizzazione per aprire ticket via WhatsApp. Chiedi al superadmin di abilitarla."],
        action: { type: "open_support_ticket", status: "rejected" },
      };
    }
    const fallbackDraft = ticketDraftFromText(text);
    const ticketId = await createSupportTicket(svc, {
      tenantId,
      phone,
      subject: analysis.ticketSubject || fallbackDraft.subject,
      body: analysis.ticketBody || fallbackDraft.body,
      conversationId: conversation.id,
    });
    await patchConversation(svc, conversation.id, { state: "ticket_opened" });
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: "open_support_ticket",
      status: "applied",
      parameters: { routedBy: "openai", confidence: analysis.confidence },
      result: { ticketId },
    });
    return {
      replies: [analysis.reply || `Ho aperto un ticket per l'assistenza. Riferimento: ${ticketId}.`],
      action: { type: "open_support_ticket", status: "applied" },
    };
  }

  if (analysis.intent === "answer" && analysis.reply) {
    return {
      replies: [analysis.reply],
      action: { type: "ai_answer", status: "applied" },
    };
  }

  return null;
}

async function handleIntent(
  svc: Db,
  conversation: ConversationRow,
  contact: ContactRow & { tenant: TenantRow | null },
  phone: string,
  text: string,
  imageUrl?: string | null,
): Promise<Pick<TenantSupportWhatsappResult, "replies" | "action">> {
  const tenantId = conversation.tenant_id;
  if (!tenantId) {
    return { replies: ["Prima devo sapere per quale locale vuoi parlare."] };
  }

  const pendingImport = await getLatestProposedMenuImport(svc, conversation.id);
  if (pendingImport && YES_RE.test(text.trim())) {
    if (!hasPermission(contact, "manageMenu")) {
      await insertAction(svc, {
        conversationId: conversation.id,
        tenantId,
        phone,
        inputText: text,
        actionType: "import_menu_photo",
        status: "rejected",
        parameters: { proposedActionId: pendingImport.id },
        error: "missing_permission:manageMenu",
      });
      return {
        replies: ["Questo numero non ha l'autorizzazione per modificare il menu via WhatsApp. Chiedi al superadmin di abilitarla."],
        action: { type: "import_menu_photo", status: "rejected" },
      };
    }
    const result = normalizeExtractedMenuPhotoResult(pendingImport.result);
    const applied = await applyMenuPhotoImport(svc, tenantId, result);
    await markActionApplied(svc, pendingImport.id);
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: "import_menu_photo",
      status: "applied",
      parameters: { proposedActionId: pendingImport.id },
      result: applied,
    });
    return {
      replies: [`Fatto: ho caricato ${applied.created} voci nel menu. Le foto dei singoli articoli restano opzionali e puoi aggiungerle dal pannello.`],
      action: { type: "import_menu_photo", status: "applied" },
    };
  }

  if (imageUrl && IMPORT_MENU_PHOTO_RE.test(text)) {
    if (!hasPermission(contact, "manageMenu")) {
      await insertAction(svc, {
        conversationId: conversation.id,
        tenantId,
        phone,
        inputText: text,
        actionType: "import_menu_photo",
        status: "rejected",
        error: "missing_permission:manageMenu",
      });
      return {
        replies: ["Questo numero non ha l'autorizzazione per modificare il menu via WhatsApp. Chiedi al superadmin di abilitarla."],
        action: { type: "import_menu_photo", status: "rejected" },
      };
    }
    return proposeMenuPhotoImport(svc, {
      conversation,
      tenantId,
      phone,
      text,
      imageUrl,
    });
  }

  if (IMPORT_MENU_PHOTO_RE.test(text) && !imageUrl) {
    return {
      replies: ["Mandami una foto del menu o degli appunti insieme alla richiesta di caricare le voci. Ti rispondero con un'anteprima da approvare."],
      action: { type: "import_menu_photo", status: "proposed" },
    };
  }

  if (conversation.state === "pending_ticket_confirmation" && YES_RE.test(text.trim())) {
    if (!hasPermission(contact, "createSupportTickets")) {
      await insertAction(svc, {
        conversationId: conversation.id,
        tenantId,
        phone,
        inputText: text,
        actionType: "open_support_ticket",
        status: "rejected",
        error: "missing_permission:createSupportTickets",
      });
      return {
        replies: ["Questo numero non ha l'autorizzazione per aprire ticket via WhatsApp. Chiedi al superadmin di abilitarla."],
        action: { type: "open_support_ticket", status: "rejected" },
      };
    }
    const ticketId = await createSupportTicket(svc, {
      tenantId,
      phone,
      subject: conversation.pending_ticket_subject ?? "Richiesta assistenza da WhatsApp",
      body: conversation.pending_ticket_body ?? text,
      conversationId: conversation.id,
    });
    await patchConversation(svc, conversation.id, {
      state: "ticket_opened",
      pending_ticket_subject: null,
      pending_ticket_body: null,
    });
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: "open_support_ticket",
      status: "applied",
      result: { ticketId },
    });
    return {
      replies: [`Ticket aperto. Riferimento: ${ticketId}.`],
      action: { type: "open_support_ticket", status: "applied" },
    };
  }

  if (PAUSE_ORDERS_TODAY_RE.test(text)) {
    if (!hasPermission(contact, "manageSettings")) {
      await insertAction(svc, {
        conversationId: conversation.id,
        tenantId,
        phone,
        inputText: text,
        actionType: "pause_new_orders_today",
        status: "rejected",
        error: "missing_permission:manageSettings",
      });
      return {
        replies: ["Questo numero non ha l'autorizzazione per gestire le impostazioni del locale via WhatsApp. Chiedi al superadmin di abilitarla."],
        action: { type: "pause_new_orders_today", status: "rejected" },
      };
    }
    const settings = await upsertAiPhoneSettings(tenantId, {
      quickSettings: { acceptNewOrders: buildPauseUntil("day-end") },
    });
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: "pause_new_orders_today",
      status: "applied",
      result: { disabledUntil: settings.quickSettings.acceptNewOrders.disabledUntil },
    });
    return {
      replies: [
        "Fatto: ho sospeso i nuovi ordini WhatsApp e chiamate IA fino a fine giornata. Puoi scrivere \"riattiva ordini\" per riaprirli.",
      ],
      action: { type: "pause_new_orders_today", status: "applied" },
    };
  }

  if (RESUME_ORDERS_RE.test(text)) {
    if (!hasPermission(contact, "manageSettings")) {
      await insertAction(svc, {
        conversationId: conversation.id,
        tenantId,
        phone,
        inputText: text,
        actionType: "resume_new_orders",
        status: "rejected",
        error: "missing_permission:manageSettings",
      });
      return {
        replies: ["Questo numero non ha l'autorizzazione per gestire le impostazioni del locale via WhatsApp. Chiedi al superadmin di abilitarla."],
        action: { type: "resume_new_orders", status: "rejected" },
      };
    }
    await upsertAiPhoneSettings(tenantId, {
      quickSettings: { acceptNewOrders: buildPauseUntil("accept") },
    });
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: "resume_new_orders",
      status: "applied",
    });
    return {
      replies: ["Fatto: i nuovi ordini WhatsApp e chiamate IA sono di nuovo attivi."],
      action: { type: "resume_new_orders", status: "applied" },
    };
  }

  if (OPEN_TICKET_RE.test(text)) {
    if (!hasPermission(contact, "createSupportTickets")) {
      await insertAction(svc, {
        conversationId: conversation.id,
        tenantId,
        phone,
        inputText: text,
        actionType: "open_support_ticket",
        status: "rejected",
        error: "missing_permission:createSupportTickets",
      });
      return {
        replies: ["Questo numero non ha l'autorizzazione per aprire ticket via WhatsApp. Chiedi al superadmin di abilitarla."],
        action: { type: "open_support_ticket", status: "rejected" },
      };
    }
    const draft = ticketDraftFromText(text);
    const ticketId = await createSupportTicket(svc, {
      tenantId,
      phone,
      subject: draft.subject,
      body: draft.body,
      conversationId: conversation.id,
    });
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: "open_support_ticket",
      status: "applied",
      result: { ticketId },
    });
    return {
      replies: [`Ticket aperto. Riferimento: ${ticketId}.`],
      action: { type: "open_support_ticket", status: "applied" },
    };
  }

  if (UNSUPPORTED_DESTRUCTIVE_RE.test(text)) {
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: "unsupported_destructive_request",
      status: "rejected",
      error: "destructive_action_not_allowed",
    });
    return {
      replies: [
        "Non posso eseguire azioni distruttive o non presenti nel pannello gestione. Posso aprire un ticket con l'assistenza se vuoi procedere con una verifica manuale.",
      ],
      action: { type: "unsupported_destructive_request", status: "unsupported" },
    };
  }

  const aiHandled = await handleAiRoutedIntent(svc, conversation, contact, phone, text, imageUrl);
  if (aiHandled) return aiHandled;

  if (!hasPermission(contact, "createSupportTickets")) {
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: "unsupported_or_unclear_request",
      status: "rejected",
      error: "missing_permission:createSupportTickets",
    });
    return {
      replies: ["Non posso eseguire questa richiesta e questo numero non ha l'autorizzazione per aprire ticket via WhatsApp. Chiedi al superadmin di abilitarla."],
      action: { type: "unsupported_or_unclear_request", status: "rejected" },
    };
  }

  const draft = ticketDraftFromText(text);
  const ticketId = await createSupportTicket(svc, {
    tenantId,
    phone,
    subject: draft.subject,
    body: draft.body,
    conversationId: conversation.id,
  });
  await patchConversation(svc, conversation.id, { state: "ticket_opened" });
  await insertAction(svc, {
    conversationId: conversation.id,
    tenantId,
    phone,
    inputText: text,
    actionType: "open_support_ticket",
    status: "applied",
    result: { ticketId, reason: "unsupported_or_unclear_request" },
  });
  return {
    replies: [`Questa richiesta richiede assistenza manuale: ho aperto un ticket. Riferimento: ${ticketId}.`],
    action: { type: "open_support_ticket", status: "applied" },
  };
}

export async function handleTenantSupportWhatsappMessage(
  input: TenantSupportWhatsappInput,
): Promise<TenantSupportWhatsappResult> {
  const svc = db();
  const phone = normalizeWhatsappPhone(input.from);
  const text = input.text.trim();
  const contacts = await getContactsForPhone(svc, phone);

  if (contacts.length === 0) {
    return {
      ok: true,
      tenantId: null,
      replies: [
        "Non riconosco questo numero come contatto autorizzato per un locale Menuary. Scrivi all'assistenza per abilitarlo.",
      ],
    };
  }

  let conversation = await getActiveConversation(svc, phone);
  if (!conversation) {
    conversation = await createConversation(
      svc,
      phone,
      contacts.length === 1 ? contacts[0].tenant_id : null,
      contacts.length === 1 ? "active" : "pending_tenant_selection",
    );
  }

  await insertMessage(svc, {
    conversationId: conversation.id,
    tenantId: conversation.tenant_id,
    direction: "inbound",
    phone,
    body: text,
    messageId: input.messageId,
    payload: input.payload,
  });

  if (contacts.length > 1 && conversation.state === "pending_tenant_selection") {
    const selectedTenantId = resolveTenantSelection(text, contacts);
    if (!selectedTenantId) {
      const reply = tenantDisclosure(contacts);
      await insertMessage(svc, {
        conversationId: conversation.id,
        tenantId: null,
        direction: "outbound",
        phone,
        body: reply,
      });
      return {
        ok: true,
        conversationId: conversation.id,
        tenantId: null,
        replies: [reply],
      };
    }
    await patchConversation(svc, conversation.id, { tenant_id: selectedTenantId, state: "active" });
    conversation = { ...conversation, tenant_id: selectedTenantId, state: "active" };
  }

  const activeContact = contactForTenant(contacts, conversation.tenant_id);
  if (!activeContact) {
    const reply = "Questo numero non risulta autorizzato per il locale selezionato.";
    await insertMessage(svc, {
      conversationId: conversation.id,
      tenantId: conversation.tenant_id,
      direction: "outbound",
      phone,
      body: reply,
    });
    return {
      ok: true,
      conversationId: conversation.id,
      tenantId: conversation.tenant_id,
      replies: [reply],
    };
  }

  const handled = await handleIntent(svc, conversation, activeContact, phone, text, input.imageUrl);
  await Promise.all(handled.replies.map((reply) => insertMessage(svc, {
    conversationId: conversation.id,
    tenantId: conversation.tenant_id,
    direction: "outbound",
    phone,
    body: reply,
  })));

  return {
    ok: true,
    conversationId: conversation.id,
    tenantId: conversation.tenant_id,
    replies: handled.replies,
    action: handled.action,
  };
}
