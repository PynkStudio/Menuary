import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/database.types";
import { findTenantById } from "@/lib/tenant-registry";
import { isTwilioOutboundReady, sendTwilioTextMessage, sendTwilioTemplateMessage } from "@/lib/twilio/messages";

export type OutboundChannel = "whatsapp" | "sms";
export type OutboundKind = "payment_link" | "order_summary" | "menu_link" | "custom";

export type EnqueueOutboundMessageInput = {
  tenantId: string;
  kind: OutboundKind;
  channel: OutboundChannel;
  fallbackChannel?: OutboundChannel | null;
  recipientPhone: string;
  body: string;
  source?: string;
  orderId?: string | null;
  /** FK opzionale al channel_payment_requests che ha originato il messaggio. */
  channelPaymentRequestId?: string | null;
  metadata?: Record<string, Json>;
  scheduledAt?: Date | null;
  /** Se valorizzato e canale whatsapp → invio via Content API (template Meta) invece del testo libero. */
  contentSid?: string | null;
  contentVariables?: Record<string, string> | null;
  /** Override mittente (numero WA del tenant). Se assente usa il numero condiviso di piattaforma. */
  fromOverride?: string | null;
};

export type EnqueuedOutboundMessage = {
  id: string;
  status: string;
  channel: OutboundChannel;
  fallbackChannel: OutboundChannel | null;
};

function normalizePhone(raw: string): string {
  return raw.trim();
}

function platformLabelForTenant(tenantId: string): string {
  const tenant = findTenantById(tenantId);
  if (tenant?.vertical === "creative") return "Orpheo";
  return tenant?.vertical === "services" ? "Bizery" : "Menuary";
}

function tenantNameForMessage(tenantId: string): string {
  const tenant = findTenantById(tenantId);
  return tenant?.name?.trim() || tenantId.trim() || "Tenant";
}

function withSharedSenderPrefix(input: EnqueueOutboundMessageInput): string {
  const body = input.body.trim();
  const tenantName = tenantNameForMessage(input.tenantId);
  const platform = platformLabelForTenant(input.tenantId);
  const prefix = `Da ${tenantName} tramite ${platform}:`;
  if (body.startsWith(prefix)) return body.slice(0, 4000);
  return `${prefix}\n${body}`.slice(0, 4000);
}

export async function enqueueOutboundMessage(
  input: EnqueueOutboundMessageInput,
): Promise<EnqueuedOutboundMessage> {
  const phone = normalizePhone(input.recipientPhone);
  if (!phone) throw new Error("recipient_phone_required");
  if (!input.body?.trim()) throw new Error("body_required");
  const outboundBody = input.body.trim().slice(0, 4000);
  const twilioBody = input.channel === "whatsapp" ? withSharedSenderPrefix(input) : outboundBody;

  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");

  const { data, error } = await (db as unknown as {
    from: (t: "outbound_text_messages") => {
      insert: (row: Record<string, unknown>) => {
        select: (c: string) => {
          single: () => Promise<{
            data: {
              id: string;
              status: string;
              channel: OutboundChannel;
              fallback_channel: OutboundChannel | null;
            } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  })
    .from("outbound_text_messages")
    .insert({
      tenant_id: input.tenantId,
      kind: input.kind,
      channel: input.channel,
      fallback_channel: input.fallbackChannel ?? null,
      recipient_phone: phone,
      body: twilioBody,
      source: input.source ?? "system",
      order_id: input.orderId ?? null,
      channel_payment_request_id: input.channelPaymentRequestId ?? null,
      scheduled_at: (input.scheduledAt ?? new Date()).toISOString(),
      metadata: input.metadata ?? {},
    })
    .select("id,status,channel,fallback_channel")
    .single();

  if (error || !data) throw new Error(error?.message ?? "enqueue_failed");

  const useTemplate = Boolean(input.contentSid) && input.channel === "whatsapp";
  if (isTwilioOutboundReady(input.channel)) {
    try {
      const sent = useTemplate
        ? await sendTwilioTemplateMessage({
            channel: input.channel,
            to: phone,
            from: input.fromOverride ?? null,
            contentSid: input.contentSid as string,
            contentVariables: input.contentVariables ?? {},
          })
        : await sendTwilioTextMessage({
            channel: input.channel,
            to: phone,
            body: twilioBody,
            from: input.fromOverride ?? null,
          });
      await (db as unknown as {
        from: (t: "outbound_text_messages") => {
          update: (row: Record<string, unknown>) => {
            eq: (column: string, value: string) => Promise<unknown>;
          };
        };
      })
        .from("outbound_text_messages")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          metadata: {
            ...(input.metadata ?? {}),
            delivery_route: input.channel === "whatsapp" ? "twilio_whatsapp_shared" : "twilio_sms",
            sender: input.channel === "whatsapp" ? "menuary_twilio_whatsapp" : "twilio_sms",
            twilio: sent,
          },
        })
        .eq("id", data.id);
      return {
        id: data.id,
        status: "sent",
        channel: data.channel,
        fallbackChannel: data.fallback_channel,
      };
    } catch (sendError) {
      await (db as unknown as {
        from: (t: "outbound_text_messages") => {
          update: (row: Record<string, unknown>) => {
            eq: (column: string, value: string) => Promise<unknown>;
          };
        };
      })
        .from("outbound_text_messages")
        .update({
          status: "failed",
          last_error: sendError instanceof Error ? sendError.message : String(sendError),
          metadata: {
            ...(input.metadata ?? {}),
            delivery_route: input.channel === "whatsapp" ? "twilio_whatsapp_shared" : "twilio_sms",
            sender: input.channel === "whatsapp" ? "menuary_twilio_whatsapp" : "twilio_sms",
            twilio: {
              error: sendError instanceof Error ? sendError.message : String(sendError),
            },
          },
        })
        .eq("id", data.id);
    }
  } else {
    await (db as unknown as {
      from: (t: "outbound_text_messages") => {
        update: (row: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<unknown>;
        };
      };
    })
      .from("outbound_text_messages")
      .update({
        status: "failed",
        last_error: `${input.channel}_sender_not_configured`,
        metadata: {
          ...(input.metadata ?? {}),
          delivery_route: input.channel === "whatsapp" ? "twilio_whatsapp_shared" : "twilio_sms",
          sender_error: `${input.channel}_sender_not_configured`,
        },
      })
      .eq("id", data.id);
  }

  return {
    id: data.id,
    status: data.status,
    channel: data.channel,
    fallbackChannel: data.fallback_channel,
  };
}
