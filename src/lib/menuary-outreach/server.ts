import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/sender";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { outreachEmailHtml, outreachLandingUrl, renderOutreachCopy } from "./copy";
import type { OutreachCampaign, OutreachDatabase, OutreachLead } from "./types";

export function outreachDb(): SupabaseClient<OutreachDatabase> | null {
  return createSupabaseServiceClient() as unknown as SupabaseClient<OutreachDatabase> | null;
}

function nextDate(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export async function sendOutreachStep(leadId: string): Promise<{ ok: boolean; error?: string }> {
  const db = outreachDb();
  if (!db) return { ok: false, error: "supabase_unconfigured" };
  const { data: lead } = await db.from("menuary_outreach_leads").select("*").eq("id", leadId).maybeSingle();
  if (!lead || ["replied", "booked", "won", "lost", "unsubscribed", "bounced"].includes(lead.status)) {
    return { ok: false, error: "lead_not_sendable" };
  }
  const [{ data: campaign }, { data: steps }] = await Promise.all([
    db.from("menuary_outreach_campaigns").select("*").eq("id", lead.campaign_id).maybeSingle(),
    db.from("menuary_outreach_steps").select("*").eq("campaign_id", lead.campaign_id).eq("active", true).order("position"),
  ]);
  if (!campaign) return { ok: false, error: "campaign_not_found" };
  const step = (steps ?? []).find((item) => item.position > lead.current_step);
  if (!step) {
    await db.from("menuary_outreach_leads").update({ status: "paused", next_send_at: null }).eq("id", lead.id);
    return { ok: false, error: "sequence_complete" };
  }

  const result = await sendEmail({
    to: lead.email,
    subject: renderOutreachCopy(step.subject, campaign, lead),
    html: outreachEmailHtml(campaign, lead, step),
    replyTo: campaign.reply_to,
    headers: {
      "List-Unsubscribe": `<${outreachLandingUrl(lead.public_token).replace(`/presentazione/${lead.public_token}`, `/api/menuary/outreach/${lead.public_token}/unsubscribe`)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  if (!result.ok) {
    await db.from("menuary_outreach_events").insert({ lead_id: lead.id, event_type: "email_failed", step_position: step.position, metadata: { error: result.error } });
    return { ok: false, error: result.error };
  }

  const following = (steps ?? []).find((item) => item.position > step.position);
  await Promise.all([
    db.from("menuary_outreach_leads").update({
      status: following ? "active" : "paused",
      current_step: step.position,
      sent_count: lead.sent_count + 1,
      last_sent_at: new Date().toISOString(),
      next_send_at: following ? nextDate(following.delay_days) : null,
      updated_at: new Date().toISOString(),
    }).eq("id", lead.id),
    db.from("menuary_outreach_events").insert({
      lead_id: lead.id,
      event_type: "email_sent",
      step_position: step.position,
      provider_message_id: result.messageId,
      metadata: {},
    }),
  ]);
  return { ok: true };
}

export async function recordOutreachEvent(
  lead: OutreachLead,
  eventType: string,
  patch: Partial<OutreachLead> = {},
) {
  const db = outreachDb();
  if (!db) return;
  await Promise.all([
    db.from("menuary_outreach_events").insert({ lead_id: lead.id, event_type: eventType, metadata: {} }),
    Object.keys(patch).length
      ? db.from("menuary_outreach_leads").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", lead.id)
      : Promise.resolve(),
  ]);
}

export async function loadPublicOutreach(token: string): Promise<{ campaign: OutreachCampaign; lead: OutreachLead } | null> {
  const db = outreachDb();
  if (!db) return null;
  const { data: lead } = await db.from("menuary_outreach_leads").select("*").eq("public_token", token).maybeSingle();
  if (!lead || lead.status === "unsubscribed") return null;
  const { data: campaign } = await db.from("menuary_outreach_campaigns").select("*").eq("id", lead.campaign_id).maybeSingle();
  return campaign ? { campaign, lead } : null;
}
