import { NextRequest, NextResponse } from "next/server";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";

type Params = { params: Promise<{ code: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { code } = await params;
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const token = url.searchParams.get("t");

  if (!tenantId || !token) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const order = await getPublicCheckoutOrder({ tenantId, code, token });
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    paymentStatus: order.paymentStatus,
    updatedAt: order.updatedAt,
    confirmationExpiresAt: order.confirmationExpiresAt,
    total: order.total,
    lines: order.lines,
  });
}
