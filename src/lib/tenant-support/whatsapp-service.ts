import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPauseUntil, upsertAiPhoneSettings } from "@/lib/retell/settings";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { normalizeWhatsappPhone } from "@/lib/tenant-support/admin-contacts";
import type { Database, Json } from "@/lib/database.types";
import {
  extractMenuItemsFromImage,
  normalizeExtractedMenuPhotoResult,
  slugifyMenuCode,
  type ExtractedMenuPhotoResult,
} from "@/lib/menu-photo-import";
import { createReservationBlock } from "@/lib/reservations/blocks";

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
  | "reservation_summary"
  | "open_orders"
  | "sales_summary"
  | "top_selling_items"
  | "set_item_availability"
  | "set_item_price"
  | "close_reservation_window"
  | "answer"
  | "unsupported";

type AiWhatsappAnalysis = {
  intent: AiWhatsappIntent;
  confidence: number;
  reply: string;
  ticketSubject: string;
  ticketBody: string;
  reason: string;
  date: string;
  startTime: string;
  endTime: string;
  itemName: string;
  available: boolean;
  price: number;
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
  required: [
    "intent", "confidence", "reply", "ticketSubject", "ticketBody", "reason",
    "date", "startTime", "endTime", "itemName", "available", "price",
  ],
  properties: {
    intent: {
      type: "string",
      enum: [
        "pause_new_orders_today",
        "resume_new_orders",
        "open_support_ticket",
        "import_menu_photo",
        "reservation_summary",
        "open_orders",
        "sales_summary",
        "top_selling_items",
        "set_item_availability",
        "set_item_price",
        "close_reservation_window",
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
    date: { type: "string" },
    startTime: { type: "string" },
    endTime: { type: "string" },
    itemName: { type: "string" },
    available: { type: "boolean" },
    price: { type: "number" },
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
    "reservation_summary",
    "open_orders",
    "sales_summary",
    "top_selling_items",
    "set_item_availability",
    "set_item_price",
    "close_reservation_window",
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
    date: typeof parsed.date === "string" ? parsed.date.trim().slice(0, 10) : "",
    startTime: typeof parsed.startTime === "string" ? parsed.startTime.trim().slice(0, 5) : "",
    endTime: typeof parsed.endTime === "string" ? parsed.endTime.trim().slice(0, 5) : "",
    itemName: typeof parsed.itemName === "string" ? parsed.itemName.trim().slice(0, 120) : "",
    available: parsed.available === true,
    price: typeof parsed.price === "number" && Number.isFinite(parsed.price) ? parsed.price : 0,
  };
}

function analyzeWhatsappIntentLocally(text: string): AiWhatsappAnalysis | null {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();
  const times = [...lower.matchAll(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g)]
    .map((match) => `${match[1].padStart(2, "0")}:${match[2]}`);
  const explicitDate = lower.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1] ?? "";
  const date = explicitDate || (lower.includes("domani") ? italianDate(1) : italianDate());
  const base = {
    confidence: 0.92,
    reply: "",
    ticketSubject: "",
    ticketBody: "",
    reason: "deterministic_match",
    date,
    startTime: times[0] ?? "",
    endTime: times[1] ?? "",
    itemName: "",
    available: false,
    price: 0,
  };
  if (/\b(quant[ei]|elenca|mostra|vedi|riepilog).*(coperti|prenotazion)/i.test(normalized)) {
    return { ...base, intent: "reservation_summary" };
  }
  if (/\b(ordini?)\b.*\b(aperti|attivi|in corso|da preparare)\b|\b(quali|quanti).+ordini\b/i.test(normalized)) {
    return { ...base, intent: "open_orders" };
  }
  if (/\b(incass|vendite|fatturato)\b/i.test(normalized)) {
    return { ...base, intent: "sales_summary" };
  }
  if (/\b(piatt|prodott).+\b(pi[uù] vendut|vendut[oi] di pi[uù]|classifica)\b/i.test(normalized)) {
    return { ...base, intent: "top_selling_items" };
  }
  const availability = normalized.match(/(?:metti|segna|rendi)\s+(.+?)\s+(non disponibile|esaurit[oa]|disponibile)\b/i);
  if (availability) {
    const available = availability[2].toLowerCase() === "disponibile";
    return { ...base, intent: "set_item_availability", itemName: availability[1].trim(), available };
  }
  const price = normalized.match(/(?:prezzo (?:di|del(?:la)?)|imposta|metti)\s+(.+?)\s+(?:a|ad)\s*(?:€|euro)?\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (price) {
    return {
      ...base,
      intent: "set_item_price",
      itemName: price[1].trim(),
      price: Number(price[2].replace(",", ".")),
    };
  }
  if (/\b(chiudi|blocca|sospendi)\b.*\b(prenotazion\w*|fascia)\b/i.test(normalized) && times.length >= 2) {
    return { ...base, intent: "close_reservation_window" };
  }
  return null;
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
              "Puoi anche: riepilogare prenotazioni e coperti per una data/fascia; elencare ordini aperti; riepilogare vendite e piatti più venduti; cambiare disponibilità di un piatto; proporre un cambio prezzo; proporre la chiusura di una fascia prenotazioni.",
              "Per date relative usa la data corrente italiana fornita nel payload. Per gli intent non pertinenti lascia date/orari/itemName vuoti, available false e price 0.",
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
              currentDateTime: new Date().toLocaleString("sv-SE", { timeZone: "Europe/Rome" }),
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

async function getLatestProposedSensitiveAction(
  svc: Db,
  conversationId: string,
): Promise<{ id: string; action_type: string; parameters: Json } | null> {
  const { data } = await (svc as unknown as {
    from: (table: "tenant_customer_service_actions") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            in: (column: string, values: string[]) => {
              order: (column: string, opts: { ascending: boolean }) => {
                limit: (count: number) => {
                  maybeSingle: () => Promise<{ data: { id: string; action_type: string; parameters: Json } | null }>;
                };
              };
            };
          };
        };
      };
    };
  }).from("tenant_customer_service_actions")
    .select("id,action_type,parameters")
    .eq("conversation_id", conversationId)
    .eq("status", "proposed")
    .in("action_type", ["set_item_price", "close_reservation_window"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

function jsonObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, Json | undefined>
    : {};
}

function italianDate(offsetDays = 0): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + offsetDays);
  return formatter.format(now);
}

async function applySensitiveAction(
  svc: Db,
  action: { id: string; action_type: string; parameters: Json },
  tenantId: string,
  phone: string,
) {
  const params = jsonObject(action.parameters);
  if (action.action_type === "set_item_price") {
    const itemId = typeof params.itemId === "string" ? params.itemId : "";
    const price = typeof params.price === "number" ? params.price : 0;
    if (!itemId || price <= 0) throw new Error("invalid_price_change");
    const { data: item } = await svc
      .from("menu_items")
      .select("id,name,price_kind")
      .eq("id", itemId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!item || item.price_kind !== "single") throw new Error("price_change_requires_panel");
    const { error } = await svc
      .from("menu_items")
      .update({ price: { kind: "single", value: price }, updated_at: new Date().toISOString() })
      .eq("id", itemId)
      .eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    await markActionApplied(svc, action.id);
    return `Fatto: il prezzo di ${item.name} è ora €${price.toFixed(2).replace(".", ",")}.`;
  }
  if (action.action_type === "close_reservation_window") {
    const date = typeof params.date === "string" ? params.date : "";
    const startTime = typeof params.startTime === "string" ? params.startTime : "";
    const endTime = typeof params.endTime === "string" ? params.endTime : "";
    await createReservationBlock(svc, {
      tenantId,
      date,
      startTime,
      endTime,
      source: "owner_whatsapp",
      phone,
      reason: "Fascia chiusa dal titolare via WhatsApp",
    });
    await markActionApplied(svc, action.id);
    return `Fatto: nuove prenotazioni chiuse il ${date} dalle ${startTime} alle ${endTime}.`;
  }
  throw new Error("unsupported_sensitive_action");
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
  }) ?? analyzeWhatsappIntentLocally(text);
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

  if (analysis.intent === "reservation_summary") {
    if (!hasPermission(contact, "manageSettings")) {
      return { replies: ["Questo numero non può leggere le prenotazioni del locale."], action: { type: analysis.intent, status: "rejected" } };
    }
    const date = /^\d{4}-\d{2}-\d{2}$/.test(analysis.date) ? analysis.date : italianDate();
    let query = svc
      .from("reservation_requests")
      .select("customer_name,covers,reservation_time,status")
      .eq("tenant_id", tenantId)
      .eq("reservation_date", date)
      .not("status", "in", "(rejected,cancelled)")
      .order("reservation_time", { ascending: true });
    if (analysis.startTime) query = query.gte("reservation_time", analysis.startTime);
    if (analysis.endTime) query = query.lt("reservation_time", analysis.endTime);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const covers = (data ?? []).reduce((sum, row) => sum + row.covers, 0);
    const details = (data ?? []).slice(0, 12).map((row) => `${row.reservation_time.slice(0, 5)} · ${row.customer_name} · ${row.covers}`).join("\n");
    return {
      replies: [data?.length ? `Il ${date} risultano ${data.length} prenotazioni, ${covers} coperti.\n\n${details}` : `Il ${date} non risultano prenotazioni nella fascia richiesta.`],
      action: { type: analysis.intent, status: "applied" },
    };
  }

  if (analysis.intent === "open_orders") {
    if (!hasPermission(contact, "manageSettings")) {
      return { replies: ["Questo numero non può leggere gli ordini del locale."], action: { type: analysis.intent, status: "rejected" } };
    }
    const { data, error } = await svc
      .from("orders")
      .select("code,total,status,source,created_at")
      .eq("tenant_id", tenantId)
      .not("status", "in", "(consegnato,annullato,expired)")
      .order("created_at", { ascending: true })
      .limit(20);
    if (error) throw new Error(error.message);
    const details = (data ?? []).map((order) => `${order.code} · ${order.status} · €${Number(order.total).toFixed(2).replace(".", ",")}`).join("\n");
    return {
      replies: [data?.length ? `Ci sono ${data.length} ordini aperti.\n\n${details}` : "Non risultano ordini aperti."],
      action: { type: analysis.intent, status: "applied" },
    };
  }

  if (analysis.intent === "sales_summary" || analysis.intent === "top_selling_items") {
    if (!hasPermission(contact, "manageSettings")) {
      return { replies: ["Questo numero non può leggere vendite e incassi."], action: { type: analysis.intent, status: "rejected" } };
    }
    const date = /^\d{4}-\d{2}-\d{2}$/.test(analysis.date) ? analysis.date : italianDate();
    const { data: orders, error } = await svc
      .from("orders")
      .select("id,total,status")
      .eq("tenant_id", tenantId)
      .gte("created_at", `${date}T00:00:00`)
      .lt("created_at", `${date}T23:59:59.999`)
      .not("status", "in", "(annullato,expired)");
    if (error) throw new Error(error.message);
    if (analysis.intent === "sales_summary") {
      const total = (orders ?? []).reduce((sum, order) => sum + Number(order.total || 0), 0);
      return {
        replies: [`Il ${date} risultano ${orders?.length ?? 0} ordini per €${total.toFixed(2).replace(".", ",")} di vendite registrate.`],
        action: { type: analysis.intent, status: "applied" },
      };
    }
    const orderIds = (orders ?? []).map((order) => order.id);
    const { data: lines } = orderIds.length
      ? await svc.from("order_lines").select("name,qty").in("order_id", orderIds)
      : { data: [] as Array<{ name: string; qty: number }> };
    const totals = new Map<string, number>();
    for (const line of lines ?? []) totals.set(line.name, (totals.get(line.name) ?? 0) + line.qty);
    const top = [...totals].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      replies: [top.length ? `Piatti più venduti il ${date}:\n${top.map(([name, qty], index) => `${index + 1}. ${name} · ${qty}`).join("\n")}` : `Non ci sono vendite prodotto registrate il ${date}.`],
      action: { type: analysis.intent, status: "applied" },
    };
  }

  if (analysis.intent === "set_item_availability") {
    if (!hasPermission(contact, "manageMenu")) {
      return { replies: ["Questo numero non può modificare il menu."], action: { type: analysis.intent, status: "rejected" } };
    }
    const { data: items } = await svc
      .from("menu_items")
      .select("id,name")
      .eq("tenant_id", tenantId)
      .ilike("name", `%${analysis.itemName}%`)
      .limit(2);
    if (!items?.length) return { replies: [`Non trovo “${analysis.itemName}” nel menu.`], action: { type: analysis.intent, status: "rejected" } };
    if (items.length > 1) return { replies: [`Ho trovato più piatti simili: ${items.map((item) => item.name).join(", ")}. Scrivi il nome completo.`], action: { type: analysis.intent, status: "proposed" } };
    const { error } = await svc.from("menu_items")
      .update({ available: analysis.available, updated_at: new Date().toISOString() })
      .eq("id", items[0].id)
      .eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    return {
      replies: [`Fatto: ${items[0].name} è ${analysis.available ? "di nuovo disponibile" : "non disponibile"} su tutti i canali collegati.`],
      action: { type: analysis.intent, status: "applied" },
    };
  }

  if (analysis.intent === "set_item_price" || analysis.intent === "close_reservation_window") {
    const permission = analysis.intent === "set_item_price" ? "manageMenu" : "manageHours";
    if (!hasPermission(contact, permission)) {
      return { replies: ["Questo numero non ha il permesso necessario per proporre la modifica."], action: { type: analysis.intent, status: "rejected" } };
    }
    let parameters: Record<string, unknown>;
    let summary: string;
    if (analysis.intent === "set_item_price") {
      const { data: items } = await svc.from("menu_items")
        .select("id,name,price_kind")
        .eq("tenant_id", tenantId)
        .ilike("name", `%${analysis.itemName}%`)
        .limit(2);
      if (items?.length !== 1 || items[0].price_kind !== "single" || analysis.price <= 0) {
        return { replies: ["Non posso preparare il cambio prezzo: indica il nome esatto di un piatto a prezzo singolo e il nuovo importo."], action: { type: analysis.intent, status: "rejected" } };
      }
      parameters = { itemId: items[0].id, itemName: items[0].name, price: analysis.price };
      summary = `Vuoi impostare ${items[0].name} a €${analysis.price.toFixed(2).replace(".", ",")}? Rispondi “confermo” per applicare.`;
    } else {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(analysis.date) ? analysis.date : italianDate();
      if (!/^\d{2}:\d{2}$/.test(analysis.startTime) || !/^\d{2}:\d{2}$/.test(analysis.endTime) || analysis.startTime >= analysis.endTime) {
        return { replies: ["Indica data, ora di inizio e ora di fine della fascia da chiudere."], action: { type: analysis.intent, status: "rejected" } };
      }
      parameters = { date, startTime: analysis.startTime, endTime: analysis.endTime };
      summary = `Vuoi chiudere le nuove prenotazioni il ${date} dalle ${analysis.startTime} alle ${analysis.endTime}? Rispondi “confermo” per applicare.`;
    }
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: analysis.intent,
      status: "proposed",
      parameters,
    });
    return { replies: [summary], action: { type: analysis.intent, status: "proposed" } };
  }

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

  const pendingSensitive = await getLatestProposedSensitiveAction(svc, conversation.id);
  if (pendingSensitive && YES_RE.test(text.trim())) {
    const permission = pendingSensitive.action_type === "set_item_price" ? "manageMenu" : "manageHours";
    if (!hasPermission(contact, permission)) {
      await insertAction(svc, {
        conversationId: conversation.id,
        tenantId,
        phone,
        inputText: text,
        actionType: pendingSensitive.action_type,
        status: "rejected",
        parameters: { proposedActionId: pendingSensitive.id },
        error: `missing_permission:${permission}`,
      });
      return {
        replies: ["Il permesso per applicare questa modifica non è più disponibile."],
        action: { type: pendingSensitive.action_type, status: "rejected" },
      };
    }
    const reply = await applySensitiveAction(svc, pendingSensitive, tenantId, phone);
    await insertAction(svc, {
      conversationId: conversation.id,
      tenantId,
      phone,
      inputText: text,
      actionType: pendingSensitive.action_type,
      status: "applied",
      parameters: { proposedActionId: pendingSensitive.id },
    });
    return {
      replies: [reply],
      action: { type: pendingSensitive.action_type, status: "applied" },
    };
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
