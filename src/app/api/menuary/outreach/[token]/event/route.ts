import { NextResponse } from "next/server";
import { outreachDb, recordOutreachEvent } from "@/lib/menuary-outreach/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = outreachDb();
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: lead } = await db.from("menuary_outreach_leads").select("*").eq("public_token", token).maybeSingle();
  if (!lead) return NextResponse.json({ ok: false }, { status: 404 });
  const body = await request.json().catch(() => ({})) as { event?: string };
  if (body.event === "landing_viewed" && !lead.landing_viewed_at) {
    await recordOutreachEvent(lead, "landing_viewed", { landing_viewed_at: new Date().toISOString(), clicked_at: lead.clicked_at ?? new Date().toISOString() });
  } else if (body.event === "video_clicked" && !lead.video_clicked_at) {
    await recordOutreachEvent(lead, "video_clicked", { video_clicked_at: new Date().toISOString() });
  }
  return NextResponse.json({ ok: true });
}
