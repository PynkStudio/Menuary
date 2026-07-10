import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/database.types";
import { createCheckoutSession } from "@/lib/payments/stripe/checkout";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import { applicationFeeCents, type PaymentSource } from "@/lib/payments/stripe/fees";
import { getStripeSecretKey } from "@/lib/payments/stripe/config";
import { getOrderPublicTokenById } from "@/lib/orders/public-checkout";
import { tenantCheckoutUrl } from "@/lib/orders/checkout-url";
import { enqueueOutboundMessage, type OutboundChannel } from "@/lib/outbound/messages";
import { getAiPhoneSettings } from "@/lib/retell/settings";
import { findTenantById } from "@/lib/tenant-registry";
import { formatEuro } from "@/lib/price-utils";

export type PaymentLinkChannel = "retell" | "whatsapp" | "sms" | "manual";

export type CreateChannelPaymentRequestInput = {
  tenantId: string;
  orderId?: string | null;
  reservationId?: string | null;
  channel: PaymentLinkChannel;
  recipientPhone: string;
  amount: number;
  currency?: string;
  description: string;
  metadata?: Record<string, Json>;
  /**
   * Se false → il link inviato al cliente è solo il riepilogo ordine (pagina /checkout/[code]),
   * il pulsante "Paga" sulla pagina sarà nascosto perché l'ordine è "Pagamento al ritiro/consegna".
   * Quando false NON aggiorniamo `orders.payment_status` (resta come l'aveva impostato il chiamante).
   * Default: true (comportamento storico, link con pagamento).
   */
  paymentRequired?: boolean;
  /** "takeaway" = pagamento al ritiro, "delivery" = pagamento alla consegna. Usato per scegliere il template WA corretto e per le variabili del messaggio. */
  fulfillmentType?: "takeaway" | "delivery";
  /** Indirizzo di consegna (solo delivery). Passato come {{5}} nel template WA. */
  deliveryAddress?: string | null;
  /**
   * Quando true, pagamento online è disponibile ma NON obbligatorio (policy=both).
   * Il messaggio diventa "puoi pagare con carta sul link" invece di "paga per confermare".
   * Ignorato se paymentRequired=false.
   */
  onSiteAvailable?: boolean;
};

export type ChannelPaymentRequest = {
  id: string;
  paymentUrl: string | null;
  providerSessionId: string | null;
  status: string;
  messageStatus: string;
};

function serviceDb() {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");
  return db;
}

// TODO: baseUrl() è globale (menuary.it), non del tenant. Nessun chiamante oggi
// raggiunge createStripeDirect/createWithPlatform senza orderId (i flussi ordine
// reali passano da createCheckoutPageLink → tenantCheckoutUrl, corretto), quindi
// il redirect /pagamenti qui sotto è codice morto. Se in futuro si costruisce un
// flusso pagamento senza ordine (es. acconto prenotazione), il redirect Stripe
// DEVE puntare al dominio del tenant (vedi tenantCheckoutUrl in
// @/lib/orders/checkout-url), mai a menuary.it — e va creata la pagina di
// destinazione, che oggi non esiste.
function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://menuary.it"
  );
}

// Mappa il canale conversazionale alla "source" usata per la fee policy.
// Per ora coincide 1:1; lasciamo la funzione esplicita per chiarezza.
function sourceForChannel(channel: PaymentLinkChannel): PaymentSource {
  return channel;
}

type StripeAttempt = {
  providerSessionId: string | null;
  paymentUrl: string;
  stripeAccountId: string | null;
  paymentIntentId: string | null;
  applicationFeeCents: number;
  /** "checkout_page" = link alla pagina /checkout/[code]; "stripe_direct" = URL Stripe diretto (no order); "platform" = legacy chiave piattaforma; "pending" = placeholder. */
  mode: "checkout_page" | "stripe_direct" | "platform" | "pending";
};

/**
 * Per ordini collegati: produciamo un link alla pagina /checkout/[code]?t=[token]
 * dove il cliente vede riepilogo + informativa privacy (recording disclosure per
 * canali AI) e poi avvia il pagamento. Più professionale e GDPR-compliant rispetto
 * a inviare via WA/SMS un link Stripe nudo.
 */
async function createCheckoutPageLink(
  input: CreateChannelPaymentRequestInput,
): Promise<StripeAttempt | null> {
  if (!input.orderId) return null;
  const token = await getOrderPublicTokenById(input.orderId);
  if (!token) return null;
  const url = tenantCheckoutUrl(input.tenantId, token.code, token.token);
  return {
    providerSessionId: null,
    paymentUrl: url,
    stripeAccountId: null,
    paymentIntentId: null,
    applicationFeeCents: applicationFeeCents(
      Math.round(input.amount * 100),
      sourceForChannel(input.channel),
    ),
    mode: "checkout_page",
  };
}

/**
 * Per richieste pagamento SENZA un order_id (es. acconto prenotazione, link
 * generico admin): generiamo una Stripe Checkout Session diretta sull'account
 * del tenant. Nessuna pagina di riepilogo intermedia perché non c'è ordine da
 * mostrare.
 */
async function createStripeDirect(
  input: CreateChannelPaymentRequestInput,
): Promise<StripeAttempt | null> {
  const account = await getTenantPaymentAccount(input.tenantId);
  if (!account?.chargesEnabled) return null;

  const source = sourceForChannel(input.channel);
  const url = baseUrl();
  const session = await createCheckoutSession({
    tenantId: input.tenantId,
    source,
    currency: input.currency ?? "eur",
    items: [
      {
        name: input.description.slice(0, 250),
        amountCents: Math.round(input.amount * 100),
        quantity: 1,
      },
    ],
    paymentIntentDescription: input.description,
    successUrl: `${url}/pagamenti?status=success`,
    cancelUrl: `${url}/pagamenti?status=cancel`,
    metadata: {
      channel: input.channel,
      ...(input.reservationId ? { reservation_id: input.reservationId } : {}),
    },
  });

  return {
    providerSessionId: session.id,
    paymentUrl: session.url,
    stripeAccountId: session.stripeAccountId,
    paymentIntentId: session.paymentIntentId,
    applicationFeeCents: session.applicationFeeCents,
    mode: "stripe_direct",
  };
}

// Fallback storico: chiave piattaforma globale (nessuna app fee).
// Usato solo se il tenant non ha Stripe collegato E non c'è order_id.
async function createWithPlatform(
  input: CreateChannelPaymentRequestInput,
): Promise<StripeAttempt> {
  const secret = (() => {
    try {
      return getStripeSecretKey("tenant_connect");
    } catch {
      return null;
    }
  })();
  const url = baseUrl();
  if (!secret) {
    return {
      providerSessionId: null,
      paymentUrl: `${url}/pagamenti?pending=1`,
      stripeAccountId: null,
      paymentIntentId: null,
      applicationFeeCents: 0,
      mode: "pending",
    };
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${url}/pagamenti?status=success`);
  params.set("cancel_url", `${url}/pagamenti?status=cancel`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", (input.currency ?? "EUR").toLowerCase());
  params.set("line_items[0][price_data][unit_amount]", String(Math.round(input.amount * 100)));
  params.set("line_items[0][price_data][product_data][name]", input.description.slice(0, 250));
  params.set("metadata[tenant_id]", input.tenantId);
  if (input.orderId) params.set("metadata[order_id]", input.orderId);
  if (input.reservationId) params.set("metadata[reservation_id]", input.reservationId);
  params.set("customer_creation", "if_required");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const json = (await res.json().catch(() => null)) as
    | { id?: string; url?: string; error?: { message?: string } }
    | null;
  if (!res.ok || !json?.url) {
    throw new Error(json?.error?.message ?? "stripe_session_failed");
  }
  return {
    providerSessionId: json.id ?? null,
    paymentUrl: json.url,
    stripeAccountId: null,
    paymentIntentId: null,
    applicationFeeCents: applicationFeeCents(
      Math.round(input.amount * 100),
      sourceForChannel(input.channel),
    ),
    mode: "platform",
  };
}

export async function createChannelPaymentRequest(
  input: CreateChannelPaymentRequestInput,
): Promise<ChannelPaymentRequest> {
  if (!input.recipientPhone.trim()) throw new Error("recipient_phone_required");
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("invalid_amount");

  const paymentRequired = input.paymentRequired !== false;

  // Priorità:
  // 1. Se c'è un order_id → link a /checkout/[code] (riepilogo + privacy + eventuale pagamento).
  //    La Stripe Session sarà creata lazy quando il cliente clicca "Paga".
  //    Vale anche per ordini "pagamento al ritiro": stesso link, ma la pagina nasconde il bottone.
  // 2. Senza order_id e con pagamento richiesto: Stripe Checkout diretta sull'account tenant.
  // 3. Fallback piattaforma (legacy, tenant non collegato).
  const stripe =
    (await createCheckoutPageLink(input)) ??
    (paymentRequired ? await createStripeDirect(input) : null) ??
    (paymentRequired ? await createWithPlatform(input) : null) ??
    {
      providerSessionId: null,
      paymentUrl: `${baseUrl()}/pagamenti?pending=1`,
      stripeAccountId: null,
      paymentIntentId: null,
      applicationFeeCents: 0,
      mode: "pending" as const,
    };

  const db = serviceDb();
  const { data, error } = await (db as unknown as {
    from: (table: "channel_payment_requests") => {
      insert: (row: Record<string, unknown>) => {
        select: (columns: string) => {
          single: () => Promise<{
            data: {
              id: string;
              payment_url: string | null;
              provider_session_id: string | null;
              status: string;
              message_status: string;
            } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  })
    .from("channel_payment_requests")
    .insert({
      tenant_id: input.tenantId,
      order_id: input.orderId ?? null,
      reservation_id: input.reservationId ?? null,
      channel: input.channel,
      recipient_phone: input.recipientPhone.trim(),
      amount: input.amount,
      currency: input.currency ?? "EUR",
      provider: "stripe",
      provider_session_id: stripe.providerSessionId,
      payment_url: stripe.paymentUrl,
      stripe_account_id: stripe.stripeAccountId,
      stripe_payment_intent_id: stripe.paymentIntentId,
      application_fee_amount_cents: stripe.applicationFeeCents,
      status: "pending",
      // Messaging provider not wired yet: queued means SMS/WA sender can pick this up.
      message_status: "queued",
      metadata: {
        description: input.description,
        mode: stripe.mode,
        paymentRequired,
        ...(input.metadata ?? {}),
      },
    })
    .select("id,payment_url,provider_session_id,status,message_status")
    .single();

  if (error || !data) throw new Error(error?.message ?? "payment_request_failed");

  // Enqueue nella coda unificata. Il worker outbound legge da qui (e da menu_link)
  // e gestisce primary → fallback. channel_payment_requests.message_status resta
  // come "intent" iniziale ma la verità operativa è in outbound_text_messages.
  if (stripe.paymentUrl) {
    try {
      const aiSettings = await getAiPhoneSettings(input.tenantId);
      const primaryChannel: OutboundChannel =
        input.channel === "sms" || input.channel === "whatsapp"
          ? input.channel
          : aiSettings.paymentControls.defaultChannel;
      // Fallback: se il chiamante ha forzato un canale specifico (manual/retell)
      // usiamo il fallback configurato; altrimenti il complementare al primario.
      const fallbackChannel: OutboundChannel | null =
        aiSettings.paymentControls.fallbackChannel ??
        (primaryChannel === "whatsapp" ? "sms" : "whatsapp");

      const kind = input.paymentRequired === false ? "order_summary" : "payment_link";
      const greeting = input.paymentRequired === false
        ? `Totale da pagare: ${formatEuro(input.amount)}. Metodo predefinito: contanti alla consegna/ritiro. Apri il link entro pochi minuti per controllare l'ordine o cambiare metodo di pagamento: ${stripe.paymentUrl}`
        : input.onSiteAvailable
          ? `Puoi pagare l'ordine con carta cliccando sul link qui sotto: ${stripe.paymentUrl}`
          : `Clicca sul link per procedere al pagamento e confermare l'ordine: ${stripe.paymentUrl}`;

      // Su WhatsApp i messaggi business-initiated richiedono un template Meta approvato.
      // Template per metodo di pagamento e tipo di consegna:
      //   online           → TWILIO_WA_ORDER_PAYMENT_SID
      //   on_site takeaway → TWILIO_WA_ORDER_TAKEAWAY_SID  (fallback: TWILIO_WA_ORDER_ONSITE_SID)
      //   on_site delivery → TWILIO_WA_ORDER_DELIVERY_SID  (fallback: TWILIO_WA_ORDER_ONSITE_SID)
      // Variabili: {{1}}=nome locale, {{2}}=codice ordine, {{3}}=token bottone,
      //            {{4}}=importo (es. "€18,50"), {{5}}=indirizzo consegna (solo delivery).
      const tok = input.orderId ? await getOrderPublicTokenById(input.orderId) : null;
      const tenantName = findTenantById(input.tenantId)?.name ?? input.tenantId;
      const isOnSite = input.paymentRequired === false;
      const isOptional = !isOnSite && Boolean(input.onSiteAvailable);
      const isDelivery = input.fulfillmentType === "delivery";
      const waContentSid = isOnSite
        ? isDelivery
          ? (process.env.TWILIO_WA_ORDER_DELIVERY_SID ?? process.env.TWILIO_WA_ORDER_ONSITE_SID)
          : (process.env.TWILIO_WA_ORDER_TAKEAWAY_SID ?? process.env.TWILIO_WA_ORDER_ONSITE_SID)
        : isOptional
          ? (process.env.TWILIO_WA_ORDER_OPTIONAL_SID ?? process.env.TWILIO_WA_ORDER_PAYMENT_SID)
          : process.env.TWILIO_WA_ORDER_PAYMENT_SID;
      const waContentVariables = tok
        ? {
            "1": tenantName,
            "2": tok.code,
            "3": tok.token,
            "4": formatEuro(input.amount),
            ...(isDelivery && input.deliveryAddress ? { "5": input.deliveryAddress } : {}),
          }
        : null;

      await enqueueOutboundMessage({
        tenantId: input.tenantId,
        kind,
        channel: primaryChannel,
        fallbackChannel,
        recipientPhone: input.recipientPhone,
        body: `${input.description}\n${greeting}`,
        source: input.channel === "retell" ? "retell" : input.channel === "whatsapp" ? "whatsapp" : "system",
        orderId: input.orderId ?? null,
        channelPaymentRequestId: data.id,
        contentSid: primaryChannel === "whatsapp" ? (waContentSid ?? null) : null,
        contentVariables: primaryChannel === "whatsapp" ? waContentVariables : null,
        metadata: {
          payment_url: stripe.paymentUrl,
          payment_required: input.paymentRequired !== false,
          mode: stripe.mode,
        },
      });
    } catch (enqueueErr) {
      // Non blocchiamo la creazione dell'ordine se l'enqueue fallisce: il payment_request
      // è già salvato. Worker / admin possono ritentare leggendo righe orfane (payment_request
      // senza outbound_text_messages corrispondente).
      console.error("[channel-payment-links] enqueue_failed", enqueueErr instanceof Error ? enqueueErr.message : String(enqueueErr));
    }
  }

  if (input.orderId) {
    const orderUpdate: Record<string, unknown> = {
      payment_link_url: stripe.paymentUrl,
    };
    if (paymentRequired) {
      // Solo se il pagamento è richiesto online aggiorniamo payment_status=pending
      // e popoliamo i campi Stripe sull'ordine. Per ordini "pagamento al ritiro"
      // l'ordine resta come l'aveva impostato il chiamante (es. not_required).
      orderUpdate.payment_status = "pending";
      orderUpdate.payment_provider = "stripe";
      orderUpdate.stripe_checkout_session_id = stripe.providerSessionId;
      orderUpdate.stripe_account_id = stripe.stripeAccountId;
      orderUpdate.application_fee_amount_cents = stripe.applicationFeeCents;
    }
    await (db as unknown as {
      from: (table: "orders") => {
        update: (row: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    })
      .from("orders")
      .update(orderUpdate)
      .eq("id", input.orderId);
  }

  return {
    id: data.id,
    paymentUrl: data.payment_url,
    providerSessionId: data.provider_session_id,
    status: data.status,
    messageStatus: data.message_status,
  };
}
