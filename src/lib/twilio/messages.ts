import "server-only";

import {
  configuredTwilioFrom,
  createTwilioClient,
  isTwilioApiConfigured,
  normalizeE164Address,
  normalizeTwilioWhatsappAddress,
  type TwilioChannel,
} from "@/lib/twilio/config";

export type SendTwilioTextMessageInput = {
  channel: TwilioChannel;
  to: string;
  body: string;
  from?: string | null;
};

export type SendTwilioTextMessageResult = {
  provider: "twilio";
  sid: string;
  status: string;
  channel: TwilioChannel;
};

export function isTwilioOutboundReady(channel: TwilioChannel): boolean {
  return isTwilioApiConfigured() && Boolean(configuredTwilioFrom(channel));
}

export async function sendTwilioTextMessage(
  input: SendTwilioTextMessageInput,
): Promise<SendTwilioTextMessageResult> {
  const from = input.channel === "whatsapp"
    ? normalizeTwilioWhatsappAddress(input.from ?? configuredTwilioFrom("whatsapp"))
    : normalizeE164Address(input.from ?? configuredTwilioFrom("sms"));
  const to = input.channel === "whatsapp"
    ? normalizeTwilioWhatsappAddress(input.to)
    : normalizeE164Address(input.to);

  if (!from) throw new Error(`twilio_${input.channel}_from_unconfigured`);
  if (!to) throw new Error("twilio_recipient_required");
  if (!input.body.trim()) throw new Error("twilio_body_required");

  const client = createTwilioClient();
  const message = await client.messages.create({
    from,
    to,
    body: input.body.trim().slice(0, 4000),
  });

  return {
    provider: "twilio",
    sid: message.sid,
    status: message.status,
    channel: input.channel,
  };
}

export type SendTwilioTemplateMessageInput = {
  channel: TwilioChannel;
  to: string;
  contentSid: string;
  contentVariables: Record<string, string>;
  from?: string | null;
};

/**
 * Invio via Twilio Content API (template approvati Meta). Necessario per i
 * messaggi WhatsApp business-initiated (fuori dalla finestra 24h), dove il
 * testo libero verrebbe rifiutato.
 */
export async function sendTwilioTemplateMessage(
  input: SendTwilioTemplateMessageInput,
): Promise<SendTwilioTextMessageResult> {
  const from = input.channel === "whatsapp"
    ? normalizeTwilioWhatsappAddress(input.from ?? configuredTwilioFrom("whatsapp"))
    : normalizeE164Address(input.from ?? configuredTwilioFrom("sms"));
  const to = input.channel === "whatsapp"
    ? normalizeTwilioWhatsappAddress(input.to)
    : normalizeE164Address(input.to);

  if (!from) throw new Error(`twilio_${input.channel}_from_unconfigured`);
  if (!to) throw new Error("twilio_recipient_required");
  if (!input.contentSid) throw new Error("twilio_content_sid_required");

  const client = createTwilioClient();
  const message = await client.messages.create({
    from,
    to,
    contentSid: input.contentSid,
    contentVariables: JSON.stringify(input.contentVariables),
  });

  return {
    provider: "twilio",
    sid: message.sid,
    status: message.status,
    channel: input.channel,
  };
}
