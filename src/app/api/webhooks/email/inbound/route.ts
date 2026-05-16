import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  type ResendInboundPayload,
  type ResendInboundHeader,
  parseEmailAddress,
  detectBrandFromRecipients,
} from "@/lib/email/inbound-types";
import {
  type ResendTrackingPayload,
  detectBrandFromSender,
  trackingEventToStatus,
  ALL_TRACKING_EVENTS,
} from "@/lib/email/tracking-types";

/**
 * POST /api/webhooks/email/inbound
 *
 * Gestisce due categorie di eventi Resend tramite lo stesso endpoint:
 *
 * 1. email.received  — email in arrivo su @menuary.it / @bizery.it
 *    → salva in `inbound_emails`
 *
 * 2. email.sent | email.delivered | email.delivery_delayed |
 *    email.bounced | email.complained | email.opened | email.clicked
 *    → salva in `email_tracking_events`
 *    → aggiorna `status` in `sent_emails` per delivered/bounced/complained
 *
 * Configurazione Resend:
 *   Dashboard → Webhooks → stesso URL per tutti gli eventi:
 *     https://admin.menuary.it/api/webhooks/email/inbound
 *
 * ENV: RESEND_WEBHOOK_SECRET (whsec_...)
 */

// ─── Verifica firma svix ──────────────────────────────────────────────────────

function verifySvixSignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string,
): boolean {
  try {
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const computed = createHmac("sha256", secretBytes).update(signedContent).digest("base64");
    const signatures = svixSignature.split(" ").map((s) => s.replace(/^v1,/, ""));
    return signatures.some((sig) => {
      try {
        return timingSafeEqual(Buffer.from(sig, "base64"), Buffer.from(computed, "base64"));
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

// ─── Helpers inbound ─────────────────────────────────────────────────────────

function extractInboundPayload(obj: Record<string, unknown>): ResendInboundPayload | null {
  if (obj.type === "email.received" && obj.data && typeof obj.data === "object") {
    return obj.data as ResendInboundPayload;
  }
  if (typeof obj.from === "string") return obj as unknown as ResendInboundPayload;
  return null;
}

function normalizeHeaders(raw: unknown): ResendInboundHeader[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ResendInboundHeader[];
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, string>).map(([name, value]) => ({ name, value }));
  }
  return [];
}

function extractMessageId(headers: ResendInboundHeader[]): string | null {
  return headers.find((h) => h.name.toLowerCase() === "message-id")?.value ?? null;
}

// ─── Handler inbound email ────────────────────────────────────────────────────

async function handleInbound(
  payload: ResendInboundPayload,
  svc: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
): Promise<NextResponse> {
  const toAddresses = Array.isArray(payload.to) ? payload.to : [payload.to].filter(Boolean);
  if (!payload.from || toAddresses.length === 0) {
    return NextResponse.json({ error: "Campi from/to mancanti." }, { status: 400 });
  }

  const brand    = detectBrandFromRecipients(toAddresses);
  const { name: fromName, address: fromAddress } = parseEmailAddress(payload.from);
  const headers  = normalizeHeaders(payload.headers);
  const messageId = extractMessageId(headers);

  const { error } = await svc.from("inbound_emails").insert({
    message_id:   messageId,
    from_address: fromAddress,
    from_name:    fromName,
    to_addresses: toAddresses,
    subject:      payload.subject ?? "(nessun oggetto)",
    text_body:    payload.text ?? null,
    html_body:    payload.html ?? null,
    headers:      headers as unknown as never,
    attachments:  (payload.attachments ?? []) as unknown as never,
    brand,
  });

  if (error) {
    console.error("[webhook:inbound] Errore inserimento:", error.message);
    return NextResponse.json({ error: "Errore salvataggio." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, type: "inbound", brand });
}

// ─── Handler tracking events ──────────────────────────────────────────────────

async function handleTracking(
  event: ResendTrackingPayload,
  svc: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
): Promise<NextResponse> {
  const { email_id, from, to, subject, click, bounce, opened_at } = event.data;
  const toAddress = Array.isArray(to) ? to[0] : to;
  const brand = detectBrandFromSender(from ?? "");

  // Metadati specifici per tipo di evento
  const metadata: Record<string, unknown> = {};
  if (click)     metadata.click = click;
  if (bounce)    metadata.bounce = bounce;
  if (opened_at) metadata.opened_at = opened_at;

  // Salva evento tracking
  const { error: evErr } = await svc.from("email_tracking_events").insert({
    resend_email_id: email_id,
    event_type:      event.type,
    from_address:    from ?? null,
    to_address:      toAddress ?? null,
    subject:         subject ?? null,
    brand,
    metadata:        metadata as never,
  });

  if (evErr) {
    console.error("[webhook:tracking] Errore tracking event:", evErr.message);
  }

  // Aggiorna status in sent_emails se applicabile
  const newStatus = trackingEventToStatus(event.type);
  if (newStatus && email_id) {
    await svc
      .from("sent_emails")
      .update({ status: newStatus })
      .eq("resend_message_id", email_id);
  }

  return NextResponse.json({ ok: true, type: "tracking", event: event.type });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verifica firma svix (opzionale in dev, obbligatoria in prod)
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const svixId        = req.headers.get("svix-id") ?? "";
    const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
    const svixSignature = req.headers.get("svix-signature") ?? "";

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Header svix mancanti." }, { status: 400 });
    }

    if (Math.abs(Date.now() / 1000 - parseInt(svixTimestamp, 10)) > 300) {
      return NextResponse.json({ error: "Timestamp scaduto." }, { status: 400 });
    }

    if (!verifySvixSignature(rawBody, svixId, svixTimestamp, svixSignature, webhookSecret)) {
      return NextResponse.json({ error: "Firma non valida." }, { status: 401 });
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON non valido." }, { status: 400 });
  }

  const obj = parsed as Record<string, unknown>;
  const eventType = obj.type as string | undefined;

  const svc = createSupabaseServiceClient();
  if (!svc) {
    console.warn("[webhook] Supabase service client non disponibile.");
    return NextResponse.json({ ok: true, stored: false });
  }

  // Email in arrivo
  if (!eventType || eventType === "email.received") {
    const inboundPayload = extractInboundPayload(obj);
    if (!inboundPayload) {
      return NextResponse.json({ error: "Payload non riconosciuto." }, { status: 400 });
    }
    return handleInbound(inboundPayload, svc);
  }

  // Evento di tracking outbound
  if ((ALL_TRACKING_EVENTS as string[]).includes(eventType)) {
    return handleTracking(parsed as ResendTrackingPayload, svc);
  }

  // Evento sconosciuto — accettiamo senza errore
  return NextResponse.json({ ok: true, ignored: true, eventType });
}
