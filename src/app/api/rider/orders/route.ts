import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getRiderSession } from "@/lib/rider-session";

export async function GET() {
  const session = await getRiderSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "Servizio non disponibile" }, { status: 503 });

  const { data: orders } = await svc
    .from("orders")
    .select(`
      id, code, status, total, created_at, notes,
      customer_name, customer_phone, delivery_address, delivery_address_text,
      delivery_pin_lat, delivery_pin_lng, assigned_at, picked_up_at,
      payment_status, payment_provider,
      order_lines(name, qty, variant_label)
    `)
    .eq("tenant_id", session.tenantId)
    .eq("rider_id", session.riderId)
    .in("status", ["pronto", "in_consegna"])
    .order("assigned_at", { ascending: true });

  return NextResponse.json({ orders: orders ?? [] });
}
