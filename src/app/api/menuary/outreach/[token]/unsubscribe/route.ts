import { NextResponse } from "next/server";
import { outreachDb } from "@/lib/menuary-outreach/server";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = outreachDb();
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: lead } = await db.from("menuary_outreach_leads").select("id, status").eq("public_token", token).maybeSingle();
  if (!lead) return NextResponse.json({ ok: true });
  if (lead.status !== "unsubscribed") {
    const now = new Date().toISOString();
    await db.from("menuary_outreach_leads").update({ status: "unsubscribed", unsubscribed_at: now, next_send_at: null, updated_at: now }).eq("id", lead.id);
    await db.from("menuary_outreach_events").insert({ lead_id: lead.id, event_type: "unsubscribed", metadata: { source: "one_click" } });
  }
  return NextResponse.json({ ok: true });
}
