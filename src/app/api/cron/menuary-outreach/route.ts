import { NextResponse } from "next/server";
import { outreachDb, sendOutreachStep } from "@/lib/menuary-outreach/server";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = outreachDb();
  if (!db) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const { data: campaigns } = await db.from("menuary_outreach_campaigns").select("*").eq("status", "active");
  const results: Array<{ campaignId: string; attempted: number; sent: number }> = [];
  for (const campaign of campaigns ?? []) {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count = 0 } = await db.from("menuary_outreach_events").select("id", { count: "exact", head: true }).eq("event_type", "email_sent").gte("created_at", since.toISOString());
    const capacity = Math.max(0, campaign.daily_limit - (count ?? 0));
    const { data: due } = await db.from("menuary_outreach_leads").select("id").eq("campaign_id", campaign.id).eq("status", "active").lte("next_send_at", new Date().toISOString()).limit(capacity);
    let sent = 0;
    for (const lead of due ?? []) if ((await sendOutreachStep(lead.id)).ok) sent++;
    results.push({ campaignId: campaign.id, attempted: due?.length ?? 0, sent });
  }
  return NextResponse.json({ ok: true, results });
}
