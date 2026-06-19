import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { encodeRiderSession, RIDER_SESSION_COOKIE } from "@/lib/rider-session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { tenantId, accessCode } = body ?? {};

  if (!tenantId || !accessCode) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "Servizio non disponibile" }, { status: 503 });

  const { data: rider } = await svc
    .from("rider_profiles")
    .select("id, name, active")
    .eq("tenant_id", tenantId)
    .eq("access_code", accessCode.toUpperCase())
    .maybeSingle();

  if (!rider || !rider.active) {
    return NextResponse.json({ error: "Codice non valido" }, { status: 401 });
  }

  const session = encodeRiderSession({ riderId: rider.id, tenantId, riderName: rider.name });
  const response = NextResponse.json({ ok: true, riderName: rider.name });
  response.cookies.set(RIDER_SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 ore
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(RIDER_SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
