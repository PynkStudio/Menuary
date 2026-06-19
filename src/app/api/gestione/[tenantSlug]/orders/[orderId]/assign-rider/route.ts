import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";

type Params = { params: Promise<{ tenantSlug: string; orderId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { tenantSlug, orderId } = await params;
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { riderId } = body ?? {};

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "Servizio non disponibile" }, { status: 503 });

  if (riderId === null) {
    // Rimozione assegnazione
    const { error } = await svc
      .from("orders")
      .update({ rider_id: null, assigned_at: null })
      .eq("id", orderId)
      .eq("tenant_id", tenantSlug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Verifica che il rider esista e appartenga al tenant
  const { data: rider } = await svc
    .from("rider_profiles")
    .select("id")
    .eq("id", riderId)
    .eq("tenant_id", tenantSlug)
    .eq("active", true)
    .maybeSingle();

  if (!rider) return NextResponse.json({ error: "Rider non trovato" }, { status: 404 });

  const { error } = await svc
    .from("orders")
    .update({ rider_id: riderId, assigned_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("tenant_id", tenantSlug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
