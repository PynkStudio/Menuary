import { NextResponse } from "next/server";
import { requireSiteadmin } from "@/lib/pynkstudio/crm-admin";
import { recordCrmTouch } from "@/lib/pynkstudio/crm";
import { outreachDb, sendOutreachStep } from "@/lib/menuary-outreach/server";
import type { OutreachCampaignStatus, OutreachLeadStatus } from "@/lib/menuary-outreach/types";

export const dynamic = "force-dynamic";

const TERMINAL = new Set<OutreachLeadStatus>(["replied", "booked", "won", "lost", "unsubscribed", "bounced"]);

export async function GET(request: Request) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = outreachDb();
  if (!db) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const selectedId = new URL(request.url).searchParams.get("campaign");
  const { data: campaigns, error } = await db.from("menuary_outreach_campaigns").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "migration_required" }, { status: 503 });
  const campaign = campaigns?.find((item) => item.id === selectedId) ?? campaigns?.[0] ?? null;
  if (!campaign) return NextResponse.json({ campaign: null, campaigns: [], steps: [], leads: [], stats: emptyStats() });
  const [{ data: steps }, { data: leads }, { data: bookingEvents }] = await Promise.all([
    db.from("menuary_outreach_steps").select("*").eq("campaign_id", campaign.id).order("position"),
    db.from("menuary_outreach_leads").select("*").eq("campaign_id", campaign.id).order("created_at", { ascending: false }).limit(500),
    db.from("menuary_outreach_events").select("lead_id").eq("event_type", "booking_clicked").limit(5000),
  ]);
  const rows = leads ?? [];
  return NextResponse.json({
    campaign,
    campaigns: campaigns ?? [],
    steps: steps ?? [],
    leads: rows,
    stats: {
      total: rows.length,
      active: rows.filter((lead) => lead.status === "active" || lead.status === "ready").length,
      sent: rows.filter((lead) => lead.sent_count > 0).length,
      landingViews: rows.filter((lead) => lead.landing_viewed_at).length,
      videoClicks: rows.filter((lead) => lead.video_clicked_at).length,
      bookingClicks: new Set((bookingEvents ?? []).map((event) => event.lead_id)).size,
      replies: rows.filter((lead) => lead.status === "replied").length,
      booked: rows.filter((lead) => lead.booked_at || lead.status === "booked").length,
      won: rows.filter((lead) => lead.status === "won").length,
      unsubscribed: rows.filter((lead) => lead.status === "unsubscribed").length,
    },
  });
}

function emptyStats() {
  return { total: 0, active: 0, sent: 0, landingViews: 0, videoClicks: 0, bookingClicks: 0, replies: 0, booked: 0, won: 0, unsubscribed: 0 };
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = outreachDb();
  if (!db) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  const action = text(body.action, 40);

  if (action === "create_lead") {
    const email = text(body.email, 200).toLowerCase();
    const contactName = text(body.contact_name, 120);
    const restaurantName = text(body.restaurant_name, 160);
    const campaignId = text(body.campaign_id, 80);
    if (!campaignId || !contactName || !restaurantName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    const crm = await recordCrmTouch(db as never, {
      kind: "form",
      source: "menuary-outreach",
      name: contactName,
      email,
      phone: text(body.phone, 40),
      company: restaurantName,
      industry: "Ristorazione",
      interests: ["Menuary", "Sito ristorante", "Menu digitale"],
      title: "Aggiunto al funnel outbound Menuary",
    });
    const { data, error } = await db.from("menuary_outreach_leads").insert({
      campaign_id: campaignId,
      crm_contact_id: crm?.id ?? null,
      contact_name: contactName,
      restaurant_name: restaurantName,
      email,
      phone: text(body.phone, 40) || null,
      city: text(body.city, 120) || null,
      website_url: text(body.website_url, 500) || null,
      image_url: text(body.image_url, 500) || null,
      observation: text(body.observation, 1000) || null,
      headline: text(body.headline, 240) || null,
      primary_pain: text(body.primary_pain, 500) || null,
    }).select("*").single();
    if (error?.code === "23505") return NextResponse.json({ error: "lead_exists" }, { status: 409 });
    if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
    return NextResponse.json({ lead: data }, { status: 201 });
  }

  if (action === "send_next") {
    const result = await sendOutreachStep(text(body.lead_id, 80));
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  }

  if (action === "update_status") {
    const leadId = text(body.lead_id, 80);
    const status = text(body.status, 30) as OutreachLeadStatus;
    const allowed: OutreachLeadStatus[] = ["ready", "active", "replied", "booked", "won", "lost", "paused", "bounced"];
    if (!allowed.includes(status)) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    const now = new Date().toISOString();
    const patch = {
      status,
      next_send_at: TERMINAL.has(status) ? null : status === "active" ? now : null,
      booked_at: status === "booked" ? now : undefined,
      updated_at: now,
    };
    await db.from("menuary_outreach_leads").update(patch).eq("id", leadId);
    await db.from("menuary_outreach_events").insert({ lead_id: leadId, event_type: status === "replied" ? "replied" : status === "booked" ? "booked" : "status_changed", metadata: { status } });
    return NextResponse.json({ ok: true });
  }

  if (action === "save_campaign") {
    const id = text(body.id, 80);
    const requestedStatus = text(body.status, 20) as OutreachCampaignStatus;
    const status: OutreachCampaignStatus = ["draft", "active", "paused", "completed"].includes(requestedStatus)
      ? requestedStatus
      : "draft";
    await db.from("menuary_outreach_campaigns").update({
      name: text(body.name, 160),
      status,
      video_url: text(body.video_url, 500) || null,
      booking_url: text(body.booking_url, 500),
      sender_name: text(body.sender_name, 120),
      reply_to: text(body.reply_to, 200).toLowerCase(),
      daily_limit: Math.min(200, Math.max(1, Number(body.daily_limit) || 20)),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "save_step") {
    await db.from("menuary_outreach_steps").update({
      name: text(body.name, 160),
      delay_days: Math.min(60, Math.max(0, Number(body.delay_days) || 0)),
      subject: text(body.subject, 240),
      body_text: text(body.body_text, 8000),
      active: body.active !== false,
      updated_at: new Date().toISOString(),
    }).eq("id", text(body.id, 80));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
