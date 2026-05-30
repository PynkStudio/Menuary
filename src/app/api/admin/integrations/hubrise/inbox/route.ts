import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** GET /api/admin/integrations/hubrise/inbox?limit=20 — eventi inbound non risolti. */
export async function GET(req: NextRequest) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? 20), 100);

  const [unresolvedRes, countRes] = await Promise.all([
    supabase
      .from("hubrise_inbound_log")
      .select("id,received_at,event,hubrise_location_id,resource_id,status,reason")
      .eq("resolved", false)
      .order("received_at", { ascending: false })
      .limit(limit),
    supabase
      .from("hubrise_inbound_log")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false),
  ]);

  return NextResponse.json({
    items: unresolvedRes.data ?? [],
    unresolvedCount: countRes.count ?? 0,
  });
}

/** POST /api/admin/integrations/hubrise/inbox/resolve — segna come risolto. */
export async function POST(req: NextRequest) {
  const { ids } = (await req.json().catch(() => ({}))) as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  await supabase
    .from("hubrise_inbound_log")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .in("id", ids);

  return NextResponse.json({ ok: true });
}
