import { NextResponse } from "next/server";
import { getPrimaryLocation, getLastSuccessfulSync } from "@/lib/data/google-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/gestione/google/status?tenantId=bepork
export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [location, lastSync] = await Promise.all([
    getPrimaryLocation(tenantId),
    getLastSuccessfulSync(tenantId),
  ]);

  return NextResponse.json({
    connected: !!location,
    location,
    lastSync: lastSync?.toISOString() ?? null,
  });
}
