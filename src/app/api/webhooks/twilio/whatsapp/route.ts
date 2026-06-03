import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { handleTenantSupportWhatsappMessage } from "@/lib/tenant-support/whatsapp-service";
import { normalizeE164Address, twilioBasicAuthHeader } from "@/lib/twilio/config";
import { twimlResponse } from "@/lib/twilio/twiml";

export const runtime = "nodejs";

type TwilioWebhookMode = "customer" | "tenant-support";

type TwilioWhatsappWebhookPayload = {
  accountSid: string | null;
  from: string;
  to: string;
  body: string;
  messageSid: string | null;
  mediaUrls: string[];
  raw: Record<string, string>;
};

function formValue(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function formRecord(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function webhookMode(req: NextRequest): TwilioWebhookMode {
  return req.nextUrl.searchParams.get("mode") === "tenant-support" ? "tenant-support" : "customer";
}

function webhookUrlForSignature(req: NextRequest): string {
  return process.env.TWILIO_WEBHOOK_URL || req.url;
}

function isAuthorizedTwilioWebhook(req: NextRequest, params: Record<string, string>): boolean {
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const authToken = process.env.TWILIO_WEBHOOK_AUTH_TOKEN;
  if (authToken && signature) {
    return twilio.validateRequest(authToken, signature, webhookUrlForSignature(req), params);
  }

  const sharedSecret = process.env.TWILIO_WEBHOOK_SECRET || process.env.WHATSAPP_WEB_BRIDGE_SECRET;
  if (sharedSecret) {
    return req.nextUrl.searchParams.get("secret") === sharedSecret;
  }

  return process.env.NODE_ENV !== "production";
}

function parseTwilioWhatsappPayload(form: FormData): TwilioWhatsappWebhookPayload {
  const mediaCount = Math.max(0, Number.parseInt(formValue(form, "NumMedia") || "0", 10) || 0);
  const mediaUrls = Array.from({ length: mediaCount })
    .map((_, index) => formValue(form, `MediaUrl${index}`))
    .filter(Boolean);

  return {
    accountSid: formValue(form, "AccountSid") || null,
    from: normalizeE164Address(formValue(form, "From")),
    to: formValue(form, "To"),
    body: formValue(form, "Body").trim(),
    messageSid: formValue(form, "MessageSid") || formValue(form, "SmsMessageSid") || null,
    mediaUrls,
    raw: formRecord(form),
  };
}

async function twilioMediaToDataUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      authorization: twilioBasicAuthHeader(),
    },
  });
  if (!response.ok) throw new Error(`twilio_media_fetch_failed:${response.status}`);
  const mime = response.headers.get("content-type")?.split(";")[0] || "application/octet-stream";
  const bytes = Buffer.from(await response.arrayBuffer());
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function handleTenantSupport(payload: TwilioWhatsappWebhookPayload) {
  const firstMediaUrl = payload.mediaUrls[0] ?? null;
  const imageUrl = firstMediaUrl ? await twilioMediaToDataUrl(firstMediaUrl).catch(() => firstMediaUrl) : null;
  const text = payload.body || (imageUrl ? "carica elementi menu da questa foto" : "");
  if (!payload.from || !text) return twimlResponse(["Messaggio ricevuto, ma non ho trovato testo da elaborare."]);

  const result = await handleTenantSupportWhatsappMessage({
    from: payload.from,
    text,
    imageUrl,
    messageId: payload.messageSid,
    payload: payload.raw,
  });
  return twimlResponse(result.replies);
}

async function handleCustomerAssistant(req: NextRequest, payload: TwilioWhatsappWebhookPayload) {
  const tenantId = req.nextUrl.searchParams.get("tenant_id") || req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) return twimlResponse(["Canale WhatsApp non configurato: manca il tenant."]);
  if (!payload.from || !payload.body) return twimlResponse(["Messaggio ricevuto. Puoi scrivermi la tua richiesta?"]);

  const url = new URL("/api/whatsapp/inbound", req.nextUrl.origin);
  url.searchParams.set("tenant_id", tenantId);
  const locationId = req.nextUrl.searchParams.get("location_id") || req.nextUrl.searchParams.get("locationId");
  if (locationId) url.searchParams.set("location_id", locationId);

  const headers: HeadersInit = { "content-type": "application/json" };
  const bridgeSecret = process.env.WHATSAPP_WEB_BRIDGE_SECRET;
  if (bridgeSecret) headers["x-whatsapp-web-secret"] = bridgeSecret;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "incoming_message",
      tenantId,
      locationId,
      from: payload.from,
      text: payload.body,
      messageId: payload.messageSid ?? undefined,
    }),
  });

  const json = await response.json().catch(() => null) as { replies?: string[]; error?: string } | null;
  if (!response.ok) {
    const error = json?.error ?? "whatsapp_customer_assistant_failed";
    console.error("[twilio-whatsapp] customer assistant failed", { status: response.status, error });
    return twimlResponse(["In questo momento non riesco a elaborare la richiesta. Riprova tra poco."]);
  }

  return twimlResponse(Array.isArray(json?.replies) ? json.replies : []);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const params = formRecord(form);
  if (!isAuthorizedTwilioWebhook(req, params)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = parseTwilioWhatsappPayload(form);
  try {
    if (webhookMode(req) === "tenant-support") {
      return await handleTenantSupport(payload);
    }
    return await handleCustomerAssistant(req, payload);
  } catch (error) {
    console.error("[twilio-whatsapp] webhook failed", error instanceof Error ? error.message : String(error));
    return twimlResponse(["In questo momento WhatsApp non e disponibile. Riprova tra poco."]);
  }
}
