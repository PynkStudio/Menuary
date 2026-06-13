/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { buildMarketingEmail } from "@/lib/email/templates/marketing";
import { resolveSender, sendEmail } from "@/lib/email/sender";
import { findTenantById } from "@/lib/tenant-registry";
import type {
  NewsletterDashboardData,
  NewsletterDelivery,
  NewsletterMessage,
  NewsletterSubscriber,
  NewsletterUnsubscribe,
} from "@/lib/newsletter/types";

type LooseClient = {
  from(table: string): any;
};

function db(): LooseClient {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("Supabase service role non configurato.");
  return client as unknown as LooseClient;
}

function subscriberFromRow(row: any): NewsletterSubscriber {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.name,
    locale: row.locale,
    source: row.source,
    status: row.status,
    tags: row.tags ?? [],
    consentAt: row.consent_at,
    unsubscribedAt: row.unsubscribed_at,
    createdAt: row.created_at,
  };
}

function messageFromRow(row: any): NewsletterMessage {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    kind: row.kind,
    name: row.name,
    status: row.status,
    triggerKey: row.trigger_key,
    delayMinutes: row.delay_minutes,
    subject: row.subject,
    preheader: row.preheader,
    bodyHtml: row.body_html,
    fromName: row.from_name,
    replyTo: row.reply_to,
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getNewsletterDashboard(tenantId: string): Promise<NewsletterDashboardData> {
  const client = db();
  const [subscribersResult, messagesResult, deliveriesResult, unsubscribesResult] = await Promise.all([
    client.from("tenant_newsletter_subscribers").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    client.from("tenant_newsletter_messages").select("*").eq("tenant_id", tenantId).order("updated_at", { ascending: false }),
    client.from("tenant_newsletter_deliveries").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(500),
    client.from("tenant_newsletter_unsubscribe_feedback").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(200),
  ]);

  const error = subscribersResult.error ?? messagesResult.error ?? deliveriesResult.error ?? unsubscribesResult.error;
  if (error) throw new Error(error.message);

  const subscribers: NewsletterSubscriber[] = (subscribersResult.data ?? []).map(subscriberFromRow);
  const messages: NewsletterMessage[] = (messagesResult.data ?? []).map(messageFromRow);
  const deliveries: NewsletterDelivery[] = (deliveriesResult.data ?? []).map((row: any) => ({
    id: row.id,
    messageId: row.message_id,
    recipientEmail: row.recipient_email,
    status: row.status,
    openCount: row.open_count,
    clickCount: row.click_count,
    lastClickedUrl: row.last_clicked_url,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  }));
  const unsubscribes: NewsletterUnsubscribe[] = (unsubscribesResult.data ?? []).map((row: any) => ({
    id: row.id,
    email: row.email,
    reasonCode: row.reason_code,
    reasonText: row.reason_text,
    createdAt: row.created_at,
  }));
  const sent = deliveries.filter((item) => !["queued", "failed", "skipped"].includes(item.status)).length;
  const delivered = deliveries.filter((item) => ["delivered", "opened", "clicked"].includes(item.status)).length;
  const uniqueOpens = deliveries.filter((item) => item.openCount > 0).length;
  const uniqueClicks = deliveries.filter((item) => item.clickCount > 0).length;

  return {
    subscribers,
    messages,
    deliveries,
    unsubscribes,
    metrics: {
      activeSubscribers: subscribers.filter((item) => item.status === "active").length,
      unsubscribed: subscribers.filter((item) => item.status === "unsubscribed").length,
      sent,
      delivered,
      uniqueOpens,
      uniqueClicks,
      openRate: delivered ? Math.round((uniqueOpens / delivered) * 1000) / 10 : 0,
      clickRate: delivered ? Math.round((uniqueClicks / delivered) * 1000) / 10 : 0,
    },
  };
}

export function sanitizeNewsletterHtml(value: string) {
  return value
    .replace(/<(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "");
}

function renderMergeTags(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => values[key] ?? "");
}

function publicOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://menuary.it";
}

async function sendDelivery(params: {
  message: NewsletterMessage;
  subscriber: NewsletterSubscriber;
  triggerEventId?: string | null;
}) {
  const client = db();
  const tenant = findTenantById(params.message.tenantId);
  if (!tenant) throw new Error("Tenant non trovato.");
  if (params.subscriber.status !== "active") return { sent: false, skipped: true };

  const { data: rawSubscriber, error: subscriberError } = await client
    .from("tenant_newsletter_subscribers")
    .select("unsubscribe_token")
    .eq("id", params.subscriber.id)
    .single();
  if (subscriberError) throw new Error(subscriberError.message);

  const unsubscribeUrl = `${publicOrigin()}/api/newsletter/unsubscribe?token=${rawSubscriber.unsubscribe_token}`;
  const values = {
    name: params.subscriber.name ?? "",
    first_name: params.subscriber.name?.split(/\s+/)[0] ?? "",
    email: params.subscriber.email,
    unsubscribe_url: unsubscribeUrl,
    current_year: String(new Date().getFullYear()),
  };
  const subject = renderMergeTags(params.message.subject, values);
  const body = renderMergeTags(sanitizeNewsletterHtml(params.message.bodyHtml), values);
  const sender = resolveSender(params.message.tenantId);
  const html = buildMarketingEmail({
    brand: { ...sender.brand, name: params.message.fromName || tenant.name },
    title: subject,
    preheader: params.message.preheader ? renderMergeTags(params.message.preheader, values) : undefined,
    body,
    unsubscribeUrl,
  });

  const { data: delivery, error: deliveryError } = await client
    .from("tenant_newsletter_deliveries")
    .insert({
      tenant_id: params.message.tenantId,
      message_id: params.message.id,
      subscriber_id: params.subscriber.id,
      trigger_event_id: params.triggerEventId ?? null,
      recipient_email: params.subscriber.email,
    })
    .select("id")
    .single();
  if (deliveryError) {
    if (deliveryError.code === "23505") return { sent: false, skipped: true };
    throw new Error(deliveryError.message);
  }

  const result = await sendEmail({
    to: params.subscriber.email,
    subject,
    html,
    tenantId: params.message.tenantId,
    fromOverride: `${params.message.fromName || tenant.name} <${sender.brand.fromEmail}>`,
    replyTo: params.message.replyTo ?? undefined,
  });
  const now = new Date().toISOString();
  await client
    .from("tenant_newsletter_deliveries")
    .update(result.ok
      ? { status: "sent", provider_message_id: result.messageId, sent_at: now }
      : { status: "failed", error_message: result.error, failed_at: now })
    .eq("id", delivery.id);
  return { sent: result.ok, skipped: false };
}

export async function dispatchCampaign(messageId: string) {
  const client = db();
  const { data: rawMessage, error } = await client.from("tenant_newsletter_messages").select("*").eq("id", messageId).single();
  if (error) throw new Error(error.message);
  const message = messageFromRow(rawMessage);
  if (message.kind !== "campaign") throw new Error("Il messaggio non è una campagna.");

  await client.from("tenant_newsletter_messages").update({ status: "sending", updated_at: new Date().toISOString() }).eq("id", messageId);
  const { data: rows, error: subscribersError } = await client
    .from("tenant_newsletter_subscribers")
    .select("*")
    .eq("tenant_id", message.tenantId)
    .eq("status", "active");
  if (subscribersError) throw new Error(subscribersError.message);

  let sent = 0;
  let skipped = 0;
  for (const row of rows ?? []) {
    const result = await sendDelivery({ message, subscriber: subscriberFromRow(row) });
    if (result.sent) sent += 1;
    if (result.skipped) skipped += 1;
  }
  await client.from("tenant_newsletter_messages").update({
    status: "sent",
    sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", messageId);
  return { sent, skipped };
}

export async function enqueueNewsletterTrigger(params: {
  tenantId: string;
  triggerKey: string;
  subscriberId?: string | null;
  recipientEmail?: string | null;
  payload?: Record<string, unknown>;
}) {
  const client = db();
  const { error } = await client.from("tenant_newsletter_trigger_events").insert({
    tenant_id: params.tenantId,
    trigger_key: params.triggerKey,
    subscriber_id: params.subscriberId ?? null,
    recipient_email: params.recipientEmail ?? null,
    payload: params.payload ?? {},
  });
  if (error) throw new Error(error.message);
}
