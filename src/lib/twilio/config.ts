import "server-only";

import twilio from "twilio";

export type TwilioChannel = "whatsapp" | "sms";

export function normalizeTwilioWhatsappAddress(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `whatsapp:+${digits}` : "";
}

export function normalizeE164Address(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("whatsapp:")) return normalizeE164Address(trimmed.slice("whatsapp:".length));
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function configuredTwilioFrom(channel: TwilioChannel): string {
  if (channel === "whatsapp") {
    return normalizeTwilioWhatsappAddress(process.env.TWILIO_WHATSAPP_FROM ?? "");
  }
  return normalizeE164Address(process.env.TWILIO_SMS_FROM ?? process.env.TWILIO_PHONE_NUMBER ?? "");
}

export function isTwilioApiConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_API_KEY &&
      process.env.TWILIO_API_SECRET,
  );
}

export function createTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  if (!accountSid || !apiKey || !apiSecret) {
    throw new Error("twilio_api_unconfigured");
  }
  return twilio(apiKey, apiSecret, { accountSid });
}

export function twilioBasicAuthHeader(): string {
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("twilio_api_unconfigured");
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}
