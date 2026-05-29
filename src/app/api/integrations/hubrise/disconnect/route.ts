import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { linkId } = (await req.json().catch(() => ({}))) as { linkId?: string };
  if (!linkId) return NextResponse.json({ error: "linkId required" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  await supabase.from("hubrise_links" as never).delete().eq("id", linkId);
  return NextResponse.json({ ok: true });
}
