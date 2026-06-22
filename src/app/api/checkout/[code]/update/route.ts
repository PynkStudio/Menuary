import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";

export const dynamic = "force-dynamic";

const UPDATE_WINDOW_SEC = 300; // 5 minuti

type UpdateBody = {
  tenantId?: string;
  token?: string;
  pickupTime?: string | null;
  deliveryAddress?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
};

const TIMED_BLOCKED = ["annullato", "in_preparazione", "pronto", "consegnato", "in_consegna", "expired"];
const DETAIL_BLOCKED = ["in_consegna", "consegnato", "annullato", "expired"];

// PATCH /api/checkout/[code]/update
// pickupTime: finestra 5 min + status modifiable
// customerName, customerPhone, deliveryAddress, notes: fino a prima di "in_consegna"
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  let body: UpdateBody = {};
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.tenantId || !body.token) {
    return NextResponse.json({ error: "tenantId_and_token_required" }, { status: 400 });
  }

  const hasPickupTime = "pickupTime" in body;
  const hasAddress = "deliveryAddress" in body;
  const hasName = "customerName" in body;
  const hasPhone = "customerPhone" in body;
  const hasNotes = "notes" in body;
  const hasTimedField = hasPickupTime;
  const hasDetailField = hasAddress || hasName || hasPhone || hasNotes;

  if (!hasTimedField && !hasDetailField) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const order = await getPublicCheckoutOrder({
    tenantId: body.tenantId,
    code,
    token: body.token,
  });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });

  if (hasDetailField && DETAIL_BLOCKED.includes(order.status)) {
    return NextResponse.json({ error: `blocked_status_${order.status}` }, { status: 409 });
  }

  if (hasTimedField) {
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "already_paid" }, { status: 409 });
    }
    if (TIMED_BLOCKED.includes(order.status)) {
      return NextResponse.json({ error: `blocked_status_${order.status}` }, { status: 409 });
    }
    const elapsedSec = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
    if (elapsedSec > UPDATE_WINDOW_SEC) {
      return NextResponse.json({ error: "update_window_expired" }, { status: 409 });
    }
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (hasPickupTime) patch.pickup_time = body.pickupTime ?? null;
  if (hasAddress) patch.delivery_address = body.deliveryAddress ?? null;
  if (hasName) patch.customer_name = body.customerName ?? null;
  if (hasPhone) patch.customer_phone = body.customerPhone ?? null;
  if (hasNotes) patch.notes = body.notes ?? null;

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { error } = await (db as unknown as {
    from: (t: "orders") => {
      update: (row: Record<string, unknown>) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
  })
    .from("orders")
    .update(patch)
    .eq("id", order.id)
    .eq("tenant_id", order.tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
