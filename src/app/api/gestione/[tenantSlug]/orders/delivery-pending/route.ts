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
    .from("orders")
    .select("id, code, customer_name, delivery_address, total, status, rider_id")
    .eq("tenant_id", tenantSlug)
    .eq("dine_option", "delivery")
    .in("status", ["pronto", "in_consegna"])
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ orders: data ?? [] });
}
