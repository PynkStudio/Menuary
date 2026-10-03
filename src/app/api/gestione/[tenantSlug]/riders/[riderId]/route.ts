import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireGestione } from "@/lib/gestione-auth";

type Params = { params: Promise<{ tenantSlug: string; riderId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { tenantSlug, riderId } = await params;
  const auth = await requireGestione(tenantSlug, "admin");
  if (!auth.ok) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  if (auth.isDemo) return NextResponse.json({ error: "Non disponibile nella demo" }, { status: 409 });

  const body = await request.json().catch(() => null);
  type RiderUpdate = { name?: string; active?: boolean };
  const updates: RiderUpdate = {};
  if (typeof body?.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body?.active === "boolean") updates.active = body.active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "Servizio non disponibile" }, { status: 503 });

  const { data, error } = await svc
    .from("rider_profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updates as any)
    .eq("id", riderId)
    .eq("tenant_id", tenantSlug)
    .select("id, name, access_code, active")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rider: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { tenantSlug, riderId } = await params;
  const auth = await requireGestione(tenantSlug, "admin");
  if (!auth.ok) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  if (auth.isDemo) return NextResponse.json({ error: "Non disponibile nella demo" }, { status: 409 });

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "Servizio non disponibile" }, { status: 503 });

  const { error } = await svc
    .from("rider_profiles")
    .delete()
    .eq("id", riderId)
    .eq("tenant_id", tenantSlug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
