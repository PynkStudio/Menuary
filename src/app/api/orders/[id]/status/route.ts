import { after, NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { pushOrderStatusToHubrise } from "@/lib/hubrise/push-status";
import { notifyCustomerOrderStatus } from "@/lib/orders/order-notifications";
import type { OrderStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };
type PersistedOrderStatus = Exclude<OrderStatus, "pending_confirmation" | "expired">;

const VALID_STATUSES: PersistedOrderStatus[] = [
  "nuovo",
  "in_preparazione",
  "pronto",
  "consegnato",
  "annullato",
];

function isPersistedOrderStatus(status: unknown): status is PersistedOrderStatus {
  return typeof status === "string" && VALID_STATUSES.includes(status as PersistedOrderStatus);
}

// ─── PATCH /api/orders/[id]/status — aggiorna stato ordine ───────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const { id } = await params;
  const { status }: { status: unknown } = await req.json();

  if (!isPersistedOrderStatus(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const { data: order, error: loadError } = await supabase
    .from("orders")
    .select("id, tenant_id, code, public_token, customer_phone")
    .eq("id", id)
    .maybeSingle();

  if (loadError) return NextResponse.json({ error: loadError.message }, { status: 500 });

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Propaga lo status alla piattaforma HubRise di origine (no-op per ordini diretti).
  after(async () => {
    await pushOrderStatusToHubrise({ orderId: id, newStatus: status });
    if (order) {
      await notifyCustomerOrderStatus({
        tenantId: order.tenant_id,
        orderId: order.id,
        code: order.code,
        publicToken: order.public_token,
        customerPhone: order.customer_phone,
        kind: status === "annullato" ? "rejected" : status === "nuovo" ? "confirmed" : "updated",
        req,
      });
    }
  });

  return NextResponse.json({ ok: true });
}
