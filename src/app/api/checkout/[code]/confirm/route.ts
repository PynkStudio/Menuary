import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";
import { finalizePendingOrder } from "@/lib/orders/finalize-pending";
import type { PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

type ConfirmBody = {
  tenantId?: string;
  token?: string;
  paymentMethod?: PaymentMethod;
};

function parsePaymentMethod(value: unknown): PaymentMethod | null {
  return value === "on_delivery_cash" || value === "on_delivery_card" || value === "online" ? value : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = (await req.json().catch(() => null)) as ConfirmBody | null;
  if (!body?.tenantId || !body.token) {
    return NextResponse.json({ error: "tenantId_and_token_required" }, { status: 400 });
  }

  const paymentMethod = parsePaymentMethod(body.paymentMethod);
  if (!paymentMethod || paymentMethod === "online") {
    return NextResponse.json({ error: "invalid_payment_method" }, { status: 400 });
  }

  const order = await getPublicCheckoutOrder({ tenantId: body.tenantId, code, token: body.token });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "already_paid" }, { status: 409 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const result = await finalizePendingOrder(db, {
    orderId: order.id,
    tenantId: order.tenantId,
    paymentMethod,
  });

  if (!result.ok) {
    const status = result.reason === "not_pending" ? 409 : result.reason === "not_found" ? 404 : 500;
    return NextResponse.json({ error: result.reason, currentStatus: result.status }, { status });
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    paymentMethod,
  });
}
