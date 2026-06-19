import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getRiderSession } from "@/lib/rider-session";

type Params = { params: Promise<{ orderId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getRiderSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const { status } = body ?? {};

  if (status !== "in_consegna" && status !== "consegnato") {
    return NextResponse.json({ error: "Stato non valido" }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "Servizio non disponibile" }, { status: 503 });

  const now = new Date().toISOString();
  const extra =
    status === "in_consegna"
      ? { picked_up_at: now }
      : { delivered_at: now };

  const { error } = await svc
    .from("orders")
    .update({ status, ...extra, updated_at: now })
    .eq("id", orderId)
    .eq("tenant_id", session.tenantId)
    .eq("rider_id", session.riderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
