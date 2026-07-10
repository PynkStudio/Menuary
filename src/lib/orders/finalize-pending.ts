import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { PaymentMethod } from "@/lib/types";
import { notifyOperationalNewOrder } from "@/lib/notifications/operational-order-push";
import { dispatchComandaForOrder } from "@/lib/printing/dispatch";

type Db = SupabaseClient<Database>;

export type FinalizePendingOrderResult =
  | { ok: true; status: "nuovo"; alreadyFinalized?: boolean }
  | { ok: false; reason: "not_found" | "not_pending" | "update_failed"; status?: string; error?: string };

function normalizePaymentMethod(method: PaymentMethod | null | undefined): PaymentMethod {
  return method === "online" || method === "on_delivery_card" ? method : "on_delivery_cash";
}

export async function finalizePendingOrder(
  db: Db,
  input: {
    orderId: string;
    tenantId?: string;
    paymentMethod?: PaymentMethod | null;
  },
): Promise<FinalizePendingOrderResult> {
  const query = db
    .from("orders")
    .select("id, tenant_id, location_id, code, status, payment_status, payment_method, customer_name")
    .eq("id", input.orderId);
  const { data: order, error: loadError } = input.tenantId
    ? await query.eq("tenant_id", input.tenantId).maybeSingle()
    : await query.maybeSingle();

  if (loadError) return { ok: false, reason: "update_failed", error: loadError.message };
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status === "nuovo") return { ok: true, status: "nuovo", alreadyFinalized: true };
  if (order.status !== "pending_confirmation") {
    return { ok: false, reason: "not_pending", status: order.status };
  }

  const nowIso = new Date().toISOString();
  const requestedMethod = normalizePaymentMethod(input.paymentMethod ?? (order.payment_method as PaymentMethod | null));
  const paid = order.payment_status === "paid";
  const paymentMethod = paid && requestedMethod === "online" ? "online" : requestedMethod === "on_delivery_card" ? "on_delivery_card" : "on_delivery_cash";

  const patch: Record<string, unknown> = {
    status: "nuovo",
    confirmed_at: nowIso,
    auto_accepted: true,
    confirmation_expires_at: null,
    payment_method: paymentMethod,
    updated_at: nowIso,
  };
  if (!paid) {
    patch.payment_status = "not_required";
    patch.payment_provider = null;
  }

  const { data: updated, error: updateError } = await db
    .from("orders")
    .update(patch as never)
    .eq("id", order.id)
    .eq("tenant_id", order.tenant_id)
    .eq("status", "pending_confirmation")
    .select("id")
    .maybeSingle();

  if (updateError) return { ok: false, reason: "update_failed", error: updateError.message };
  if (!updated) return { ok: true, status: "nuovo", alreadyFinalized: true };

  void notifyOperationalNewOrder({
    tenantId: order.tenant_id,
    orderCode: order.code,
    status: "nuovo",
    customerName: order.customer_name,
    locationId: order.location_id ?? null,
  }).catch(() => null);
  void dispatchComandaForOrder(db, order.tenant_id, order.id, order.location_id ?? null).catch(() => {});

  return { ok: true, status: "nuovo" };
}
