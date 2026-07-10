import { NextRequest, NextResponse } from "next/server";
import { cartLinesToDbRows } from "@/lib/api/orders";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";
import { notifyCustomerOrderStatus } from "@/lib/orders/order-notifications";
import { recordPlatformErrorFromRequest } from "@/lib/platform-errors";
import type { CartLine } from "@/lib/types";

export const dynamic = "force-dynamic";

const UPSELL_WINDOW_SEC = 300;

type AppendBody = {
  tenantId?: string;
  token?: string;
  lines?: CartLine[];
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = (await req.json().catch(() => null)) as AppendBody | null;
  if (!body?.tenantId || !body.token || !body.lines?.length) {
    return NextResponse.json({ error: "tenant_token_and_lines_required" }, { status: 400 });
  }

  const order = await getPublicCheckoutOrder({
    tenantId: body.tenantId,
    code,
    token: body.token,
  });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });

  const elapsedSec = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
  if (elapsedSec > UPSELL_WINDOW_SEC) {
    return NextResponse.json({ error: "upsell_window_expired" }, { status: 409 });
  }
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "already_paid" }, { status: 409 });
  }
  if (order.status !== "pending_confirmation") {
    return NextResponse.json({ error: `order_${order.status}` }, { status: 409 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const { data: existingLines, error: linesLoadError } = await db
    .from("order_lines")
    .select("position")
    .eq("order_id", order.id)
    .order("position", { ascending: false })
    .limit(1);
  if (linesLoadError) {
    await recordPlatformErrorFromRequest(req, {
      error: linesLoadError,
      source: "api",
      tenantId: order.tenantId,
      orderId: order.id,
      flow: "checkout_append",
      operation: "load_last_line",
      title: "Checkout: lettura righe ordine per upsell fallita",
      httpStatus: 500,
      metadata: { code, orderCode: order.code },
    }).catch(() => undefined);
    return NextResponse.json({ error: linesLoadError.message }, { status: 500 });
  }

  const offset = (existingLines?.[0]?.position ?? -1) + 1;
  const rows = cartLinesToDbRows(order.id, body.lines).map((row, index) => ({
    ...row,
    position: offset + index,
  }));
  const addedTotal = rows.reduce((sum, row) => sum + Number(row.line_total ?? 0), 0);
  const nextTotal = order.total + addedTotal;

  const { error: insertError } = await db.from("order_lines").insert(rows);
  if (insertError) {
    await recordPlatformErrorFromRequest(req, {
      error: insertError,
      source: "api",
      tenantId: order.tenantId,
      orderId: order.id,
      flow: "checkout_append",
      operation: "insert_upsell_lines",
      title: "Checkout: aggiunta prodotti upsell fallita",
      httpStatus: 500,
      metadata: { code, orderCode: order.code, linesCount: rows.length, addedTotal },
    }).catch(() => undefined);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await db
    .from("orders")
    .update({
      total: nextTotal,
      updated_at: new Date().toISOString(),
      payment_status: order.paymentStatus === "pending" ? "pending" : order.paymentStatus,
    } as never)
    .eq("id", order.id)
    .eq("tenant_id", order.tenantId);
  if (updateError) {
    await recordPlatformErrorFromRequest(req, {
      error: updateError,
      source: "api",
      tenantId: order.tenantId,
      orderId: order.id,
      flow: "checkout_append",
      operation: "update_order_total",
      title: "Checkout: aggiornamento totale dopo upsell fallito",
      httpStatus: 500,
      metadata: { code, orderCode: order.code, addedTotal, nextTotal },
    }).catch(() => undefined);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  void notifyCustomerOrderStatus({
    tenantId: order.tenantId,
    orderId: order.id,
    code: order.code,
    publicToken: body.token,
    customerPhone: order.customerPhone,
    kind: "updated",
    req,
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    code: order.code,
    addedTotal,
    total: nextTotal,
  });
}
