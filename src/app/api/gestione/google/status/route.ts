import { NextResponse } from "next/server";
import { getPrimaryLocation, getLastSuccessfulSync } from "@/lib/data/google-sync";
import { requireGestione } from "@/lib/gestione-auth";

// GET /api/gestione/google/status?tenantId=bepork
export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const auth = await requireGestione(tenantId, "admin");
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  if (auth.isDemo) return NextResponse.json({ connected: false, location: null, lastSync: null });

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
