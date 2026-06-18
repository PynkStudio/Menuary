import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";

export const dynamic = "force-dynamic";

const UPDATE_WINDOW_SEC = 300; // 5 minuti

// PATCH /api/checkout/[code]/update
// Body: { tenantId, token, pickupTime?, deliveryAddress? }
// Permette di correggere orario e/o indirizzo entro i primi 5 minuti dalla creazione.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  let body: { tenantId?: string; token?: string; pickupTime?: string | null; deliveryAddress?: string | null } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.tenantId || !body.token) {
    return NextResponse.json({ error: "tenantId_and_token_required" }, { status: 400 });
  }

  const hasPickupTime = "pickupTime" in body;
  const hasAddress = "deliveryAddress" in body;
  if (!hasPickupTime && !hasAddress) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const order = await getPublicCheckoutOrder({
    tenantId: body.tenantId,
    code,
    token: body.token,
  });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });

  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "already_paid" }, { status: 409 });
  }
  const blockedStatuses = ["annullato", "in_preparazione", "pronto", "consegnato", "expired"];
  if (blockedStatuses.includes(order.status)) {
    return NextResponse.json({ error: `blocked_status_${order.status}` }, { status: 409 });
  }

  const elapsedSec = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
  if (elapsedSec > UPDATE_WINDOW_SEC) {
    return NextResponse.json({ error: "update_window_expired" }, { status: 409 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (hasPickupTime) patch.pickup_time = body.pickupTime ?? null;
  if (hasAddress) patch.delivery_address = body.deliveryAddress ?? null;

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
