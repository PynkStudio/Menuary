import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId, mode } = await readPayload(request);
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

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
