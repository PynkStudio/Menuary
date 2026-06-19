import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { notifyCustomerOrderStatus } from "@/lib/orders/order-notifications";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/orders/[id]/reject
 *
 * Rifiuto manuale di un ordine in `pending_confirmation`: passa a `annullato`.
 * Body opzionale: { reason?: string } — salvato in notes (prefisso "Rifiutato: ").
 */
export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const { id } = await params;
  let reason: string | null = null;
  try {
    const body = await req.json();
    if (body && typeof body.reason === "string") reason = body.reason.trim() || null;
  } catch {
    // body opzionale
  }

  const { data: order, error: loadErr } = await supabase
    .from("orders")
    .select("id, tenant_id, code, status, notes, public_token, customer_phone, source, type")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

  if (order.status !== "pending_confirmation") {
    return NextResponse.json(
      { error: "order not in pending state", status: order.status },
      { status: 409 },
    );
  }

  const newNotes = reason
    ? [order.notes, `Rifiutato: ${reason}`].filter(Boolean).join("\n")
    : order.notes;

  const { error: updErr } = await supabase
    .from("orders")
    .update({ status: "annullato", notes: newNotes })
    .eq("id", id)
    .eq("status", "pending_confirmation");

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  void notifyCustomerOrderStatus({
    tenantId: order.tenant_id,
    orderId: order.id,
    code: order.code,
    publicToken: order.public_token,
    customerPhone: order.customer_phone,
    kind: "rejected",
    orderSource: order.source,
    orderType: order.type,
    req,
    reason,
  });

  return NextResponse.json({ ok: true, status: "annullato" });
}
