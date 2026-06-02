import { NextRequest, NextResponse } from "next/server";
import {
  buildRetellInboundContext,
  createRetellOrder,
  createRetellReservation,
  getRetellAvailability,
  type RetellInboundContext,
  type CreateRetellOrderInput,
  type CreateRetellReservationInput,
  type RetellAvailabilityInput,
} from "@/lib/retell/inbound-orchestrator";
import { isAuthorizedWhatsappWebBridgeRequest } from "@/lib/whatsapp/web-bridge-auth";
import { findTenantById } from "@/lib/tenant-registry";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import { buildAiPaymentInstruction, type AiPaymentInstruction } from "@/lib/payments/ai-payment-instruction";

type WhatsappActionBody =
  | ({ action: "context" } & { tenantId?: string; tenant_id?: string; locationId?: string | null; location_id?: string | null })
  | ({ action: "incoming_message"; tenantId?: string; tenant_id?: string; from: string; text: string; messageId?: string })
  | ({ action: "availability" } & RetellAvailabilityInput)
  | ({ action: "create_reservation" } & CreateRetellReservationInput)
  | ({ action: "create_order" } & CreateRetellOrderInput);

type WhatsappOrderDraft = {
  locationId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  pickupTime?: string | null;
  desiredTime?: string | null;
  notes?: string | null;
  fulfillmentType: "takeaway" | "delivery";
  delivery?: {
    address: string;
    doorbell?: string | null;
    floor?: string | null;
    notes?: string | null;
  } | null;
  requestPayment?: boolean;
  /** Scelta del cliente raccolta dall'assistente WA quando la policy è "both". */
  paymentMethodChoice?: "online" | "on_site" | null;
  lines: {
    itemCode: string;
    quantity: number;
    note: string | null;
    addedExtraCodes: string[];
    removedIngredients: string[];
  }[];
};
type WhatsappReservationDraft = {
  locationId?: string | null;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  covers: number;
  serviceCode?: string | null;
  notes?: string | null;
};

type WhatsappAiIntent =
  | "answer"
  | "order"
  | "reservation"
  | "handoff"
  | "unsupported";

type WhatsappAiAnalysis = {
  intent: WhatsappAiIntent;
  confidence: number;
  reply: string;
  missingFields: string[];
  readyToCreate: boolean;
  confirmed: boolean;
  requestPayment: boolean;
  order: WhatsappOrderDraft | null;
  reservation: WhatsappReservationDraft | null;
  reason: string;
};

type PendingWhatsappConversation = {
  tenantId: string;
  locationId: string | null;
  intent: "order" | "reservation";
  draft: WhatsappOrderDraft | WhatsappReservationDraft;
  awaitingConfirmation: boolean;
  updatedAt: number;
};

const pendingConversations = new Map<string, PendingWhatsappConversation>();
const PENDING_TTL_MS = 45 * 60 * 1000;
const AI_CONFIDENCE_THRESHOLD = 0.66;
const CONFIRM_RE = /^(si|sì|ok|confermo|conferma|procedi|va bene|perfetto|esatto)\b/i;
const CANCEL_RE = /^(annulla|cancella|lascia stare|no|stop)\b/i;

const WHATSAPP_AI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "intent",
    "confidence",
    "reply",
    "missingFields",
    "readyToCreate",
    "confirmed",
    "requestPayment",
    "order",
    "reservation",
    "reason",
  ],
  properties: {
    intent: {
      type: "string",
      enum: ["answer", "order", "reservation", "handoff", "unsupported"],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reply: { type: "string" },
    missingFields: {
      type: "array",
      items: { type: "string" },
    },
    readyToCreate: { type: "boolean" },
    confirmed: { type: "boolean" },
    requestPayment: { type: "boolean" },
    order: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "locationId",
            "customerName",
            "customerPhone",
            "pickupTime",
            "desiredTime",
            "notes",
            "fulfillmentType",
            "delivery",
            "requestPayment",
            "paymentMethodChoice",
            "lines",
          ],
          properties: {
            locationId: { anyOf: [{ type: "string" }, { type: "null" }] },
            customerName: { anyOf: [{ type: "string" }, { type: "null" }] },
            customerPhone: { anyOf: [{ type: "string" }, { type: "null" }] },
            pickupTime: { anyOf: [{ type: "string" }, { type: "null" }] },
            desiredTime: { anyOf: [{ type: "string" }, { type: "null" }] },
            notes: { anyOf: [{ type: "string" }, { type: "null" }] },
            fulfillmentType: { type: "string", enum: ["takeaway", "delivery"] },
            delivery: {
              anyOf: [
                { type: "null" },
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["address", "doorbell", "floor", "notes"],
                  properties: {
                    address: { type: "string" },
                    doorbell: { anyOf: [{ type: "string" }, { type: "null" }] },
                    floor: { anyOf: [{ type: "string" }, { type: "null" }] },
                    notes: { anyOf: [{ type: "string" }, { type: "null" }] },
                  },
                },
              ],
            },
            requestPayment: { type: "boolean" },
            paymentMethodChoice: {
              anyOf: [
                { type: "null" },
                { type: "string", enum: ["online", "on_site"] },
              ],
            },
            lines: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["itemCode", "quantity", "note", "addedExtraCodes", "removedIngredients"],
                properties: {
                  itemCode: { type: "string" },
                  quantity: { type: "number" },
                  note: { anyOf: [{ type: "string" }, { type: "null" }] },
                  addedExtraCodes: {
                    type: "array",
                    items: { type: "string" },
                  },
                  removedIngredients: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
      ],
    },
    reservation: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["locationId", "customerName", "customerPhone", "date", "time", "covers", "serviceCode", "notes"],
          properties: {
            locationId: { anyOf: [{ type: "string" }, { type: "null" }] },
            customerName: { type: "string" },
            customerPhone: { type: "string" },
            date: { type: "string" },
            time: { type: "string" },
            covers: { type: "number" },
            serviceCode: { anyOf: [{ type: "string" }, { type: "null" }] },
            notes: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
        },
      ],
    },
    reason: { type: "string" },
  },
};

function tenantFrom(req: NextRequest, body?: WhatsappActionBody | null): string {
  return (
    req.nextUrl.searchParams.get("tenant_id") ||
    req.nextUrl.searchParams.get("tenantId") ||
    (body && "tenantId" in body ? body.tenantId : undefined) ||
    (body && "tenant_id" in body ? body.tenant_id : undefined) ||
    ""
  );
}

function locationFrom(req: NextRequest, body?: WhatsappActionBody | null): string | null {
  return (
    req.nextUrl.searchParams.get("location_id") ||
    req.nextUrl.searchParams.get("locationId") ||
    (body && "locationId" in body ? body.locationId ?? null : null) ||
    (body && "location_id" in body ? body.location_id ?? null : null)
  );
}

function conversationKey(tenantId: string, from: string) {
  return `${tenantId}:${from.replace(/\D/g, "") || from}`;
}

function cleanPendingConversations() {
  const now = Date.now();
  for (const [key, value] of pendingConversations) {
    if (now - value.updatedAt > PENDING_TTL_MS) pendingConversations.delete(key);
  }
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
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeOrderDraft(value: unknown): WhatsappOrderDraft | null {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  if (!raw || !Array.isArray(raw.lines)) return null;
  return {
    locationId: normalizeString(raw.locationId),
    customerName: normalizeString(raw.customerName),
    customerPhone: normalizeString(raw.customerPhone),
    pickupTime: normalizeString(raw.pickupTime),
    desiredTime: normalizeString(raw.desiredTime),
    notes: normalizeString(raw.notes),
    fulfillmentType: raw.fulfillmentType === "delivery" ? "delivery" : "takeaway",
    delivery: raw.delivery && typeof raw.delivery === "object" && !Array.isArray(raw.delivery)
      ? {
          address: normalizeString((raw.delivery as Record<string, unknown>).address) ?? "",
          doorbell: normalizeString((raw.delivery as Record<string, unknown>).doorbell),
          floor: normalizeString((raw.delivery as Record<string, unknown>).floor),
          notes: normalizeString((raw.delivery as Record<string, unknown>).notes),
        }
      : null,
    requestPayment: raw.requestPayment === true,
    paymentMethodChoice:
      raw.paymentMethodChoice === "online" || raw.paymentMethodChoice === "on_site"
        ? raw.paymentMethodChoice
        : null,
    lines: raw.lines
      .map((line) => {
        const row = line && typeof line === "object" && !Array.isArray(line) ? line as Record<string, unknown> : null;
        const itemCode = normalizeString(row?.itemCode);
        if (!row || !itemCode) return null;
        return {
          itemCode,
          quantity: Math.max(1, Math.floor(typeof row.quantity === "number" ? row.quantity : 1)),
          note: normalizeString(row.note),
          addedExtraCodes: Array.isArray(row.addedExtraCodes)
            ? row.addedExtraCodes.map(normalizeString).filter((code): code is string => Boolean(code))
            : [],
          removedIngredients: Array.isArray(row.removedIngredients)
            ? row.removedIngredients.map(normalizeString).filter((name): name is string => Boolean(name))
            : [],
        };
      })
      .filter((line): line is WhatsappOrderDraft["lines"][number] => Boolean(line)),
  };
}

function normalizeReservationDraft(value: unknown): WhatsappReservationDraft | null {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  if (!raw) return null;
  const customerName = normalizeString(raw.customerName);
  const customerPhone = normalizeString(raw.customerPhone);
  const date = normalizeString(raw.date);
  const time = normalizeString(raw.time);
  if (!customerName || !customerPhone || !date || !time) {
    return {
      locationId: normalizeString(raw.locationId),
      customerName: customerName ?? "",
      customerPhone: customerPhone ?? "",
      date: date ?? "",
      time: time ?? "",
      covers: Math.max(1, Math.floor(typeof raw.covers === "number" ? raw.covers : 1)),
      serviceCode: normalizeString(raw.serviceCode),
      notes: normalizeString(raw.notes),
    };
  }
  return {
    locationId: normalizeString(raw.locationId),
    customerName,
    customerPhone,
    date,
    time,
    covers: Math.max(1, Math.floor(typeof raw.covers === "number" ? raw.covers : 1)),
    serviceCode: normalizeString(raw.serviceCode),
    notes: normalizeString(raw.notes),
  };
}

function normalizeAiAnalysis(value: unknown): WhatsappAiAnalysis | null {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<WhatsappAiAnalysis> : null;
  const intents: WhatsappAiIntent[] = ["answer", "order", "reservation", "handoff", "unsupported"];
  if (!raw?.intent || !intents.includes(raw.intent)) return null;
  return {
    intent: raw.intent,
    confidence: typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
      ? Math.max(0, Math.min(1, raw.confidence))
      : 0,
    reply: typeof raw.reply === "string" ? raw.reply.trim().slice(0, 1400) : "",
    missingFields: Array.isArray(raw.missingFields)
      ? raw.missingFields.map(normalizeString).filter((field): field is string => Boolean(field)).slice(0, 12)
      : [],
    readyToCreate: raw.readyToCreate === true,
    confirmed: raw.confirmed === true,
    requestPayment: raw.requestPayment === true,
    order: normalizeOrderDraft(raw.order),
    reservation: normalizeReservationDraft(raw.reservation),
    reason: typeof raw.reason === "string" ? raw.reason.trim().slice(0, 800) : "",
  };
}

function compactContextForAi(context: RetellInboundContext) {
  return {
    tenant: context.tenant,
    capabilities: context.capabilities,
    assistantSettings: context.assistantSettings,
    locations: context.locations,
    menuTimezone: context.menu.timezone,
    activeMenuLists: context.menu.activeLists,
    menu: context.menu.categories.map((category) => ({
      code: category.code,
      title: category.title,
      items: category.items.map((item) => ({
        code: item.code,
        name: item.name,
        description: item.description,
        available: item.available,
        bookable: item.bookable,
        durationMinutes: item.durationMinutes,
        price: item.price,
        tags: item.tags,
        allergens: item.allergens,
        modifications: item.modifications,
      })),
    })),
    instructions: context.retellInstructions,
  };
}

function hasOrderMinimumFields(order: WhatsappOrderDraft | null): order is WhatsappOrderDraft {
  if (!order || order.lines.length === 0) return false;
  if (order.fulfillmentType === "delivery" && !order.delivery?.address.trim()) return false;
  return Boolean(order.customerPhone?.trim() && (order.pickupTime || order.desiredTime));
}

function hasReservationMinimumFields(reservation: WhatsappReservationDraft | null): reservation is WhatsappReservationDraft {
  return Boolean(
    reservation?.customerName.trim() &&
    reservation.customerPhone.trim() &&
    reservation.date.trim() &&
    reservation.time.trim() &&
    reservation.covers > 0,
  );
}

function summarizeOrder(order: WhatsappOrderDraft) {
  const lines = order.lines.map((line) => {
    const extras = line.addedExtraCodes.length ? ` + ${line.addedExtraCodes.join(", ")}` : "";
    const removed = line.removedIngredients.length ? ` senza ${line.removedIngredients.join(", ")}` : "";
    const note = line.note ? ` (${line.note})` : "";
    return `${line.quantity}x ${line.itemCode}${extras}${removed}${note}`;
  });
  return [
    `Ordine ${order.fulfillmentType === "delivery" ? "delivery" : "asporto"}: ${lines.join("; ")}`,
    order.desiredTime || order.pickupTime ? `Orario: ${order.desiredTime ?? order.pickupTime}` : null,
    order.delivery?.address ? `Indirizzo: ${order.delivery.address}` : null,
    order.customerName ? `Nome: ${order.customerName}` : null,
    order.customerPhone ? `Telefono: ${order.customerPhone}` : null,
  ].filter(Boolean).join("\n");
}

function summarizeReservation(reservation: WhatsappReservationDraft) {
  return [
    `Prenotazione per ${reservation.covers} persone`,
    `Data e ora: ${reservation.date} ${reservation.time}`,
    `Nome: ${reservation.customerName}`,
    `Telefono: ${reservation.customerPhone}`,
    reservation.notes ? `Note: ${reservation.notes}` : null,
  ].filter(Boolean).join("\n");
}

function userFacingOrderError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith("missing_items:")) {
    return "Non trovo uno o piu prodotti nel menu attivo. Puoi indicarmi il prodotto esatto dal menu?";
  }
  if (message.startsWith("item_unavailable:")) {
    return "Uno dei prodotti richiesti non risulta disponibile ora. Vuoi scegliere un'alternativa dal menu?";
  }
  if (message.startsWith("missing_extra:")) {
    return "Una modifica richiesta non e tra gli extra configurati. Posso segnalarla come nota per il locale, oppure scegliamo un extra disponibile.";
  }
  if (message === "orders_not_accepting") return "In questo momento il locale non sta accettando nuovi ordini da WhatsApp.";
  if (message === "delivery_address_required") return "Per il delivery mi serve l'indirizzo di consegna.";
  if (message === "payment_phone_required") return "Per inviare il link di pagamento mi serve un numero di telefono valido.";
  return "Non sono riuscito a creare l'ordine. Posso passare la richiesta al locale per una verifica manuale.";
}

function userFacingReservationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "reservations_not_accepting") return "In questo momento il locale non sta accettando nuove prenotazioni da WhatsApp.";
  return "Non sono riuscito a registrare la prenotazione. Posso passare la richiesta al locale per una verifica manuale.";
}

async function computeWhatsappPaymentInstruction(
  context: RetellInboundContext,
): Promise<AiPaymentInstruction> {
  const tenantProfile = findTenantById(context.tenant.id);
  const stripeAccount = tenantProfile?.features.payments
    ? await getTenantPaymentAccount(context.tenant.id).catch(() => null)
    : null;
  return buildAiPaymentInstruction({
    paymentsModuleEnabled: Boolean(tenantProfile?.features.payments),
    stripeReady: Boolean(stripeAccount?.chargesEnabled),
    policy: context.assistantSettings.paymentControls.acceptedMethods,
    vertical: context.tenant.vertical === "services" ? "services" : "food",
  });
}

async function analyzeIncomingWhatsappMessage(params: {
  context: RetellInboundContext;
  from: string;
  text: string;
  pending: PendingWhatsappConversation | null;
}): Promise<WhatsappAiAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const paymentInstruction = await computeWhatsappPaymentInstruction(params.context);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_WHATSAPP_MODEL || "gpt-5-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "Sei l'assistente WhatsApp del locale. Rispondi in italiano, in modo breve e operativo.",
                "Usa esclusivamente menu, prezzi, sedi, orari, extra e regole nel contesto. Non inventare prodotti, prezzi, disponibilita o policy.",
                "Per gli ordini: crea righe solo con itemCode esistenti e disponibili. Se il cliente chiede 'americana con peperoni', itemCode deve essere la pizza/prodotto Americana se presente; peperoni va in addedExtraCodes se esiste tra le modifiche consentite, altrimenti va nella note della riga come richiesta da confermare.",
                "Se un prodotto non e a menu o non e disponibile, chiedi alternativa o proponi prodotti simili presenti. Non creare ordine con prodotto mancante.",
                "Per delivery raccogli indirizzo. Per ogni ordine raccogli almeno telefono e orario desiderato/asporto; nome se disponibile.",
                `Politica pagamento: ${paymentInstruction.text}`,
                paymentInstruction.shouldAsk
                  ? "Quando la politica richiede di chiedere la preferenza, popola order.paymentMethodChoice con 'online' o 'on_site' solo dopo che il cliente ha effettivamente scelto. Se ancora non ha scelto, lascia paymentMethodChoice a null e nella reply chiedi la preferenza."
                  : `Quando crei l'ordine imposta order.paymentMethodChoice a '${paymentInstruction.onlineAvailable ? "online" : "on_site"}' senza chiedere conferma al cliente.`,
                "Per prenotazioni raccogli data, ora, numero persone, nome e telefono. Se manca qualcosa, chiedi solo i campi mancanti.",
                "Se readyToCreate e true, il draft deve contenere tutti i dati minimi. Se confirmBeforeWrite e true e l'utente non ha confermato, readyToCreate puo essere true ma confirmed deve restare false e la reply deve chiedere conferma riepilogando.",
                "Per elementi che richiedono approvazione del locale, spiega che bisogna attendere conferma e che verra comunicata appena disponibile.",
                "Se il messaggio conferma un pending draft, imposta confirmed true e conserva il draft aggiornato.",
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
                now: new Date().toISOString(),
                from: params.from,
                message: params.text,
                pending: params.pending,
                context: compactContextForAi(params.context),
                paymentPolicy: {
                  text: paymentInstruction.text,
                  onlineAvailable: paymentInstruction.onlineAvailable,
                  onSiteAvailable: paymentInstruction.onSiteAvailable,
                  shouldAsk: paymentInstruction.shouldAsk,
                },
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "whatsapp_customer_intent",
          strict: true,
          schema: WHATSAPP_AI_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[whatsapp-inbound] openai analysis failed", {
      status: response.status,
      error: errorBody.slice(0, 240),
    });
    return null;
  }

  const text = parseOpenAIResponseText(await response.json());
  if (!text) return null;
  try {
    return normalizeAiAnalysis(JSON.parse(text));
  } catch (error) {
    console.error("[whatsapp-inbound] openai analysis parse failed", error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function executeWhatsappOrder(params: {
  tenantId: string;
  from: string;
  draft: WhatsappOrderDraft;
}) {
  const order = await createRetellOrder({
    ...params.draft,
    tenantId: params.tenantId,
    customerPhone: params.draft.customerPhone || params.from,
    source: "whatsapp",
    paymentChannel: "whatsapp",
    requestPayment: params.draft.requestPayment,
    paymentMethodChoice: params.draft.paymentMethodChoice ?? undefined,
  });
  const paymentUrl = order.payment?.paymentUrl;
  const paidOnline = order.paymentMethod === "online";
  const paymentLine = paymentUrl
    ? paidOnline
      ? `\nPaga ora: ${paymentUrl}`
      : `\nRiepilogo ordine: ${paymentUrl}`
    : "";
  return {
    ok: true,
    order,
    reply: `Ordine ricevuto (${order.code}). Totale: €${Number(order.total).toFixed(2).replace(".", ",")}.\nIl locale deve confermare l'ordine: ti scriveremo appena viene accettato.${paymentLine}`,
  };
}

async function executeWhatsappReservation(params: {
  tenantId: string;
  from: string;
  draft: WhatsappReservationDraft;
}) {
  const availability = await getRetellAvailability({
    tenantId: params.tenantId,
    locationId: params.draft.locationId,
    date: params.draft.date,
    covers: params.draft.covers,
    serviceCode: params.draft.serviceCode,
  });
  const requested = availability.slots.find((slot) => slot.time === params.draft.time);
  if (!requested?.available) {
    const alternatives = availability.slots
      .filter((slot) => slot.available)
      .slice(0, 5)
      .map((slot) => slot.time);
    return {
      ok: false,
      reservation: null,
      reply: alternatives.length
        ? `Per ${params.draft.date} alle ${params.draft.time} non vedo disponibilita. Posso proporti: ${alternatives.join(", ")}.`
        : `Per ${params.draft.date} non vedo disponibilita prenotabili. Posso chiedere al locale di verificare manualmente.`,
    };
  }

  const reservation = await createRetellReservation({
    ...params.draft,
    tenantId: params.tenantId,
    customerPhone: params.draft.customerPhone || params.from,
    source: "whatsapp",
  });
  return {
    ok: true,
    reservation,
    reply: `Richiesta prenotazione ricevuta. Riferimento: ${reservation.id}.\nIl locale deve confermare: ti comunicheremo l'esito appena disponibile.`,
  };
}

async function handleIncomingWhatsappMessage(req: NextRequest, body: Extract<WhatsappActionBody, { action: "incoming_message" }>) {
  cleanPendingConversations();
  const tenantId = tenantFrom(req, body);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const context = await buildRetellInboundContext(tenantId, { locationId: locationFrom(req, body), channel: "whatsapp" });
  if (!context.tenant.aiWhatsappEnabled) {
    return NextResponse.json({ error: "ai_whatsapp_not_enabled", context }, { status: 403 });
  }
  if (!context.capabilities.canAnswerQuestions) {
    return NextResponse.json({ ok: true, replies: ["In questo momento il canale WhatsApp del locale non e attivo."] });
  }

  const key = conversationKey(tenantId, body.from);
  const pending = pendingConversations.get(key) ?? null;
  if (pending && CANCEL_RE.test(body.text.trim())) {
    pendingConversations.delete(key);
    return NextResponse.json({ ok: true, replies: ["Va bene, ho annullato la bozza."] });
  }

  const analysis = await analyzeIncomingWhatsappMessage({
    context,
    from: body.from,
    text: body.text,
    pending,
  });

  if (!analysis || analysis.confidence < AI_CONFIDENCE_THRESHOLD) {
    return NextResponse.json({
      ok: true,
      replies: ["Non sono sicuro di aver capito. Vuoi fare un ordine, una prenotazione o chiedere informazioni sul locale?"],
    });
  }

  if (analysis.intent === "order") {
    const draft = analysis.order;
    if (!hasOrderMinimumFields(draft) || analysis.missingFields.length > 0) {
      if (draft) {
        pendingConversations.set(key, {
          tenantId,
          locationId: draft.locationId ?? locationFrom(req, body),
          intent: "order",
          draft,
          awaitingConfirmation: false,
          updatedAt: Date.now(),
        });
      }
      return NextResponse.json({ ok: true, replies: [analysis.reply || `Mi mancano: ${analysis.missingFields.join(", ")}.`] });
    }

    const shouldConfirm = context.assistantSettings.confirmBeforeWrite && !analysis.confirmed && !CONFIRM_RE.test(body.text.trim());
    if (shouldConfirm) {
      pendingConversations.set(key, {
        tenantId,
        locationId: draft.locationId ?? locationFrom(req, body),
        intent: "order",
        draft,
        awaitingConfirmation: true,
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        ok: true,
        replies: [analysis.reply || `Confermi questo ordine?\n${summarizeOrder(draft)}`],
      });
    }

    try {
      const result = await executeWhatsappOrder({ tenantId, from: body.from, draft });
      pendingConversations.delete(key);
      return NextResponse.json({ ok: true, replies: [result.reply], order: result.order });
    } catch (error) {
      return NextResponse.json({ ok: true, replies: [userFacingOrderError(error)] });
    }
  }

  if (analysis.intent === "reservation") {
    const draft = analysis.reservation;
    if (!hasReservationMinimumFields(draft) || analysis.missingFields.length > 0) {
      if (draft) {
        pendingConversations.set(key, {
          tenantId,
          locationId: draft.locationId ?? locationFrom(req, body),
          intent: "reservation",
          draft,
          awaitingConfirmation: false,
          updatedAt: Date.now(),
        });
      }
      return NextResponse.json({ ok: true, replies: [analysis.reply || `Mi mancano: ${analysis.missingFields.join(", ")}.`] });
    }

    const availability = await getRetellAvailability({
      tenantId,
      locationId: draft.locationId,
      date: draft.date,
      covers: draft.covers,
      serviceCode: draft.serviceCode,
    });
    const requested = availability.slots.find((slot) => slot.time === draft.time);
    if (!requested?.available) {
      const alternatives = availability.slots.filter((slot) => slot.available).slice(0, 5).map((slot) => slot.time);
      pendingConversations.set(key, {
        tenantId,
        locationId: draft.locationId ?? locationFrom(req, body),
        intent: "reservation",
        draft,
        awaitingConfirmation: false,
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        ok: true,
        replies: [
          alternatives.length
            ? `Per ${draft.date} alle ${draft.time} non vedo disponibilita. Posso proporti: ${alternatives.join(", ")}.`
            : `Per ${draft.date} non vedo disponibilita prenotabili. Vuoi che chieda al locale una verifica manuale?`,
        ],
        availability,
      });
    }

    const shouldConfirm = context.assistantSettings.confirmBeforeWrite && !analysis.confirmed && !CONFIRM_RE.test(body.text.trim());
    if (shouldConfirm) {
      pendingConversations.set(key, {
        tenantId,
        locationId: draft.locationId ?? locationFrom(req, body),
        intent: "reservation",
        draft,
        awaitingConfirmation: true,
        updatedAt: Date.now(),
      });
      return NextResponse.json({
        ok: true,
        replies: [analysis.reply || `Confermi questa prenotazione?\n${summarizeReservation(draft)}`],
        availability,
      });
    }

    try {
      const result = await executeWhatsappReservation({ tenantId, from: body.from, draft });
      pendingConversations.delete(key);
      return NextResponse.json({ ok: true, replies: [result.reply], reservation: result.reservation, availability });
    } catch (error) {
      return NextResponse.json({ ok: true, replies: [userFacingReservationError(error)] });
    }
  }

  if (analysis.intent === "handoff") {
    return NextResponse.json({
      ok: true,
      replies: [analysis.reply || "Passo la richiesta al locale: ti risponderanno appena possibile."],
    });
  }

  return NextResponse.json({
    ok: true,
    replies: [analysis.reply || "Posso aiutarti con ordini, prenotazioni e informazioni sul locale."],
  });
}

async function contextResponse(req: NextRequest, body?: WhatsappActionBody | null) {
  const tenantId = tenantFrom(req, body);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });
  const context = await buildRetellInboundContext(tenantId, {
    locationId: locationFrom(req, body),
    includeUnavailable: req.nextUrl.searchParams.get("include_unavailable") === "true",
    channel: "whatsapp",
  });
  if (!context.tenant.aiWhatsappEnabled) {
    return NextResponse.json({ error: "ai_whatsapp_not_enabled", context }, { status: 403 });
  }
  return NextResponse.json(context);
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedWhatsappWebBridgeRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return await contextResponse(req);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "whatsapp_context_failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedWhatsappWebBridgeRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as WhatsappActionBody | null;
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  try {
    if (body.action === "context") return await contextResponse(req, body);

    if (body.action === "incoming_message") {
      return await handleIncomingWhatsappMessage(req, body);
    }

    if (body.action === "availability") {
      const result = await getRetellAvailability(body);
      return NextResponse.json({ ok: true, availability: result });
    }

    if (body.action === "create_reservation") {
      const result = await createRetellReservation({ ...body, source: "whatsapp" });
      return NextResponse.json({ ok: true, reservation: result });
    }

    if (body.action === "create_order") {
      const result = await createRetellOrder({
        ...body,
        source: "whatsapp",
        paymentChannel: body.paymentChannel ?? "whatsapp",
      });
      return NextResponse.json({ ok: true, order: result });
    }

    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "whatsapp_action_failed" },
      { status: 500 },
    );
  }
}
