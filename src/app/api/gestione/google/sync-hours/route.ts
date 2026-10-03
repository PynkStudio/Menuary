import { NextResponse } from "next/server";
import { requireGestione } from "@/lib/gestione-auth";
import { runGoogleHoursSync, type HoursSyncMode } from "@/lib/google/hours-sync";

// POST /api/gestione/google/sync-hours
// Body: { tenantId, mode: "regular" | "special" | "all" }
// Legge gli orari dal DB e li sincronizza su Google Business Profile.

async function readPayload(request: Request): Promise<{ tenantId?: string; mode: HoursSyncMode }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      tenantId: String(form.get("tenantId") ?? ""),
      mode: (String(form.get("mode") ?? "all") || "all") as HoursSyncMode,
    };
  }

  const json = (await request.json().catch(() => ({}))) as {
    tenantId?: string;
    mode?: HoursSyncMode;
  };
  return { tenantId: json.tenantId, mode: json.mode ?? "all" };
}

export async function POST(request: Request) {
  const { tenantId, mode } = await readPayload(request);
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  const auth = await requireGestione(tenantId, "admin");
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  if (auth.isDemo) return NextResponse.json({ ok: true, synced: [], errors: [] });

  let result;
  try {
    result = await runGoogleHoursSync(tenantId, mode);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }

  return NextResponse.json({
    ok: !result.errors?.length,
    synced: result.synced,
    errors: result.errors,
  });
}
