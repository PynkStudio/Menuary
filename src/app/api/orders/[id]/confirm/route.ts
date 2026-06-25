import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendOrderConfirmationEmail } from "@/lib/orders/send-confirmation-email";
import { notifyCustomerOrderStatus } from "@/lib/orders/order-notifications";
import { dispatchComandaForOrder } from "@/lib/printing/dispatch";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/orders/[id]/confirm
 *
 * Conferma manuale dell'ordine da parte dello staff: porta lo stato da
 * `pending_confirmation` a `nuovo`. Se l'ordine è già scaduto
 * (confirmation_expires_at < now) lo marca come `expired` e restituisce 410.
 *
 * Non tocca ordini già in altro stato (idempotente solo se status === "nuovo").
 */
export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const { id } = await params;

  const { data: order, error: loadErr } = await supabase
    .from("orders")
    .select("id, tenant_id, location_id, code, status, confirmation_expires_at, public_token, customer_phone, source, type")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

  // Già confermato (auto-accept o conferma precedente): idempotente.
  if (order.status === "nuovo") {
    return NextResponse.json({ ok: true, status: "nuovo", alreadyConfirmed: true });
  }

  if (order.status !== "pending_confirmation") {
    return NextResponse.json(
      { error: "order not in pending state", status: order.status },
      { status: 409 },
    );
  }

  // Scadenza: rifiutiamo la conferma e marchiamo expired.
  const now = Date.now();
  const expiresAt = order.confirmation_expires_at
    ? new Date(order.confirmation_expires_at).getTime()
    : null;
  if (expiresAt != null && expiresAt < now) {
    await supabase.from("orders").update({ status: "expired" }).eq("id", id);
    return NextResponse.json({ error: "confirmation window expired" }, { status: 410 });
  }

  const { error: updErr } = await supabase
    .from("orders")
    .update({
      status: "nuovo",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending_confirmation"); // guard race: non sovrascrivere altri stati

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Stampa comanda server-side (es. SUNMI cloud). No-op se QZ/non configurato.
  void dispatchComandaForOrder(supabase, order.tenant_id, order.id, order.location_id ?? null).catch(() => {});

  // Email di conferma — best-effort, non blocca la response.
  void sendOrderConfirmationEmail(supabase, id).catch(() => {});
  void notifyCustomerOrderStatus({
    tenantId: order.tenant_id,
    orderId: order.id,
    code: order.code,
    publicToken: order.public_token,
    customerPhone: order.customer_phone,
    kind: "confirmed",
    orderSource: order.source,
    orderType: order.type,
    req,
  });

  return NextResponse.json({ ok: true, status: "nuovo" });
}
