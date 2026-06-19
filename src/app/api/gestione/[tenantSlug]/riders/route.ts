import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";

type Params = { params: Promise<{ tenantSlug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { tenantSlug } = await params;
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "Servizio non disponibile" }, { status: 503 });

  const { data } = await svc
    .from("rider_profiles")
    .select("id, name, access_code, active, created_at")
    .eq("tenant_id", tenantSlug)
    .order("name", { ascending: true });

  return NextResponse.json({ riders: data ?? [] });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { tenantSlug } = await params;
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok || (!auth.isDemo && !auth.isAdmin)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { name } = body ?? {};
  if (!name?.trim()) return NextResponse.json({ error: "Nome richiesto" }, { status: 400 });

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "Servizio non disponibile" }, { status: 503 });

  // Genera codice univoco: prime 3 lettere nome + 4 caratteri casuali
  const prefix = name.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3).padEnd(2, "X");
  const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4).padEnd(4, "0");
  const access_code = `${prefix}${suffix}`;

  const { data, error } = await svc
    .from("rider_profiles")
    .insert({ tenant_id: tenantSlug, name: name.trim(), access_code })
    .select("id, name, access_code, active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rider: data }, { status: 201 });
}
