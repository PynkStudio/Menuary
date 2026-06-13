// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

type Message = {
  id: string;
  tenant_id: string;
  kind: "campaign" | "automation";
  status: string;
  trigger_key: string | null;
  delay_minutes: number;
  subject: string;
  preheader: string | null;
  body_html: string;
  from_name: string | null;
  reply_to: string | null;
};

type Subscriber = {
  id: string;
  tenant_id: string;
  email: string;
  name: string | null;
  status: string;
  unsubscribe_token: string;
};

type Tenant = {
  id: string;
  name: string;
  vertical: "food" | "services" | "creative";
};

type TriggerEvent = {
  id: string;
  tenant_id: string;
  trigger_key: string;
  subscriber_id: string | null;
  recipient_email: string | null;
  created_at: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const PUBLIC_ORIGIN = (Deno.env.get("NEWSLETTER_PUBLIC_ORIGIN") ?? "https://menuary.it").replace(/\/$/, "");

const BRAND_BY_VERTICAL = {
  food: {
    name: "Menuary",
    domain: "menuary.it",
    fromEmail: "noreply@menuary.it",
    primary: "#B8332E",
    bg: "#FFF4E6",
    text: "#141010",
    muted: "#7A6060",
  },
  services: {
    name: "Bizery",
    domain: "bizery.it",
    fromEmail: "noreply@bizery.it",
    primary: "#2563EB",
    bg: "#F0F5FF",
    text: "#0F172A",
    muted: "#64748B",
  },
  creative: {
    name: "Orpheo",
    domain: "weuseorpheo.com",
    fromEmail: "noreply@weuseorpheo.com",
    primary: "#7C3AED",
    bg: "#FBFAF7",
    text: "#17111F",
    muted: "#6B5E75",
  },
} as const;

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sanitizeHtml(value: string) {
  return value
    .replace(/<(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function merge(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => values[key] ?? "");
}

function buildHtml(params: {
  tenant: Tenant;
  message: Message;
  subscriber: Subscriber;
  unsubscribeUrl: string;
}) {
  const brand = BRAND_BY_VERTICAL[params.tenant.vertical] ?? BRAND_BY_VERTICAL.food;
  const values = {
    name: params.subscriber.name ?? "",
    first_name: params.subscriber.name?.split(/\s+/)[0] ?? "",
    email: params.subscriber.email,
    unsubscribe_url: params.unsubscribeUrl,
    current_year: String(new Date().getFullYear()),
  };
  const subject = merge(params.message.subject, values);
  const body = merge(sanitizeHtml(params.message.body_html), values);
  const preheader = params.message.preheader
    ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden">${escapeHtml(merge(params.message.preheader, values))}</span>`
    : "";
  const senderName = params.message.from_name?.trim() || params.tenant.name || brand.name;

  return {
    subject,
    from: `${senderName} <${brand.fromEmail}>`,
    html: `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:${brand.bg};font-family:Arial,sans-serif">
${preheader}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${brand.bg}">
<tr><td align="center" style="padding:48px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:${brand.primary};padding:28px 40px;text-align:center;color:#fff;font-size:26px;font-weight:800">${escapeHtml(senderName)}</td></tr>
<tr><td style="padding:40px;color:${brand.text}">
<h1 style="margin:0 0 18px;font-size:22px">${escapeHtml(subject)}</h1>
<div style="font-size:15px;line-height:1.7;color:${brand.muted}">${body}</div>
</td></tr>
<tr><td style="padding:24px 40px;border-top:1px solid #eef0f2;text-align:center;color:${brand.muted};font-size:11px">
&copy; ${new Date().getFullYear()} ${escapeHtml(senderName)} ·
<a href="https://${brand.domain}" style="color:${brand.primary}">${brand.domain}</a><br>
<a href="${params.unsubscribeUrl}" style="color:${brand.muted}">Cancella iscrizione</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  };
}

async function sendDelivery(
  supabase: ReturnType<typeof createClient>,
  tenant: Tenant,
  message: Message,
  subscriber: Subscriber,
  triggerEventId: string | null,
) {
  if (subscriber.status !== "active") return { sent: false, skipped: true };

  const { data: delivery, error: deliveryError } = await supabase
    .from("tenant_newsletter_deliveries")
    .insert({
      tenant_id: message.tenant_id,
      message_id: message.id,
      subscriber_id: subscriber.id,
      trigger_event_id: triggerEventId,
      recipient_email: subscriber.email,
    })
    .select("id")
    .single();

  if (deliveryError) {
    if (deliveryError.code === "23505") return { sent: false, skipped: true };
    throw deliveryError;
  }

  const unsubscribeUrl = `${PUBLIC_ORIGIN}/api/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;
  const rendered = buildHtml({ tenant, message, subscriber, unsubscribeUrl });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: rendered.from,
      to: [subscriber.email],
      subject: rendered.subject,
      html: rendered.html,
      ...(message.reply_to ? { reply_to: message.reply_to } : {}),
    }),
  });
  const now = new Date().toISOString();

  if (!response.ok) {
    const error = await response.text();
    await supabase
      .from("tenant_newsletter_deliveries")
      .update({ status: "failed", failed_at: now, error_message: error.slice(0, 2000) })
      .eq("id", delivery.id);
    return { sent: false, skipped: false };
  }

  const result = await response.json() as { id?: string };
  await supabase
    .from("tenant_newsletter_deliveries")
    .update({ status: "sent", sent_at: now, provider_message_id: result.id ?? null })
    .eq("id", delivery.id);
  return { sent: true, skipped: false };
}

async function loadTenant(supabase: ReturnType<typeof createClient>, tenantId: string) {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, vertical")
    .eq("id", tenantId)
    .single();
  if (error) throw error;
  return data as Tenant;
}

async function dispatchCampaign(
  supabase: ReturnType<typeof createClient>,
  messageId: string,
) {
  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("tenant_newsletter_messages")
    .update({ status: "sending", updated_at: now })
    .eq("id", messageId)
    .eq("status", "scheduled")
    .select("*")
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) return { sent: 0, skipped: 1 };

  const message = claimed as Message;
  const [tenant, subscribersResult] = await Promise.all([
    loadTenant(supabase, message.tenant_id),
    supabase
      .from("tenant_newsletter_subscribers")
      .select("*")
      .eq("tenant_id", message.tenant_id)
      .eq("status", "active"),
  ]);
  if (subscribersResult.error) throw subscribersResult.error;

  let sent = 0;
  let skipped = 0;
  for (const subscriber of (subscribersResult.data ?? []) as Subscriber[]) {
    const result = await sendDelivery(supabase, tenant, message, subscriber, null);
    if (result.sent) sent += 1;
    if (result.skipped) skipped += 1;
  }

  await supabase
    .from("tenant_newsletter_messages")
    .update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", message.id);
  return { sent, skipped };
}

async function loadEventSubscribers(
  supabase: ReturnType<typeof createClient>,
  event: TriggerEvent,
) {
  if (event.subscriber_id) {
    const { data } = await supabase
      .from("tenant_newsletter_subscribers")
      .select("*")
      .eq("id", event.subscriber_id)
      .maybeSingle();
    return data ? [data as Subscriber] : [];
  }
  if (event.recipient_email) {
    const { data } = await supabase
      .from("tenant_newsletter_subscribers")
      .select("*")
      .eq("tenant_id", event.tenant_id)
      .ilike("email", event.recipient_email)
      .maybeSingle();
    return data ? [data as Subscriber] : [];
  }
  const { data, error } = await supabase
    .from("tenant_newsletter_subscribers")
    .select("*")
    .eq("tenant_id", event.tenant_id)
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []) as Subscriber[];
}

async function processTrigger(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
) {
  const { data: claimed, error: claimError } = await supabase
    .from("tenant_newsletter_trigger_events")
    .update({ status: "processing" })
    .eq("id", eventId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) return { sent: 0, skipped: 1 };

  const event = claimed as TriggerEvent;
  try {
    const [{ data: automations, error: automationsError }, subscribers, tenant] = await Promise.all([
      supabase
        .from("tenant_newsletter_messages")
        .select("*")
        .eq("tenant_id", event.tenant_id)
        .eq("kind", "automation")
        .eq("status", "active")
        .eq("trigger_key", event.trigger_key),
      loadEventSubscribers(supabase, event),
      loadTenant(supabase, event.tenant_id),
    ]);
    if (automationsError) throw automationsError;

    let sent = 0;
    let skipped = 0;
    let nextAvailableAt: number | null = null;
    for (const automationRow of automations ?? []) {
      const automation = automationRow as Message;
      const dueAt = new Date(event.created_at).getTime() + automation.delay_minutes * 60000;
      if (dueAt > Date.now()) {
        nextAvailableAt = nextAvailableAt === null ? dueAt : Math.min(nextAvailableAt, dueAt);
        continue;
      }
      for (const subscriber of subscribers) {
        const result = await sendDelivery(supabase, tenant, automation, subscriber, event.id);
        if (result.sent) sent += 1;
        if (result.skipped) skipped += 1;
      }
    }

    await supabase
      .from("tenant_newsletter_trigger_events")
      .update(nextAvailableAt === null
        ? { status: "processed", processed_at: new Date().toISOString() }
        : { status: "pending", available_at: new Date(nextAvailableAt).toISOString() })
      .eq("id", event.id);
    return { sent, skipped };
  } catch (error) {
    await supabase
      .from("tenant_newsletter_trigger_events")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : String(error),
      })
      .eq("id", event.id);
    throw error;
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
    return json({ error: "Missing Supabase or Resend secrets" }, 503);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date().toISOString();
  const [{ data: campaigns, error: campaignError }, { data: events, error: eventError }] = await Promise.all([
    supabase
      .from("tenant_newsletter_messages")
      .select("id")
      .eq("kind", "campaign")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .limit(10),
    supabase
      .from("tenant_newsletter_trigger_events")
      .select("id")
      .eq("status", "pending")
      .lte("available_at", now)
      .order("created_at")
      .limit(50),
  ]);
  if (campaignError || eventError) {
    return json({ error: campaignError?.message ?? eventError?.message ?? "Queue read failed" }, 500);
  }

  let campaignsSent = 0;
  let automationsSent = 0;
  const errors: string[] = [];
  for (const campaign of campaigns ?? []) {
    try {
      campaignsSent += (await dispatchCampaign(supabase, campaign.id)).sent;
    } catch (error) {
      errors.push(`campaign:${campaign.id}:${error instanceof Error ? error.message : String(error)}`);
    }
  }
  for (const event of events ?? []) {
    try {
      automationsSent += (await processTrigger(supabase, event.id)).sent;
    } catch (error) {
      errors.push(`event:${event.id}:${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return json({ ok: errors.length === 0, campaignsSent, automationsSent, errors });
});
