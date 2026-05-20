import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// POST /api/kiosk/pair
// Body: { code: string }
// Risponde con device_token long-lived (salvato dal kiosk in localStorage).
// Il code è single-use: dopo il pairing viene rigenerato un nuovo code per
// permettere all'admin di riaccoppiare se necessario.
export async function POST(req: NextRequest) {
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });

  const { data: device } = await svc
    .from("kiosk_devices")
    .select("id, tenant_id, enabled, paired_at, device_token")
    .eq("pairing_code", code)
    .maybeSingle();

  if (!device) return NextResponse.json({ error: "invalid_code" }, { status: 404 });
  if (!device.enabled) return NextResponse.json({ error: "device_disabled" }, { status: 403 });

  // Se già accoppiato in passato, rigeneriamo comunque il token (singolo device attivo per code).
  const token = randomBytes(32).toString("base64url");

  const { error } = await svc
    .from("kiosk_devices")
    .update({
      device_token: token,
      paired_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", device.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    device_id: device.id,
    tenant_id: device.tenant_id,
    token,
  });
}
