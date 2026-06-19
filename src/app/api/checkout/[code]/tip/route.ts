import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";
import { createCheckoutSession } from "@/lib/payments/stripe/checkout";
import { isDemoHostname } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

// POST /api/checkout/[code]/tip
// Body: { tenantId, token, tipCents }
// Per ordini pagati in contanti: crea una nuova sessione Stripe per la mancia.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  let body: { tenantId?: string; token?: string; tipCents?: number } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.tenantId || !body.token) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const tipCents = Math.max(50, Math.round(body.tipCents ?? 0)); // min 50 centesimi
  if (tipCents < 50) {
    return NextResponse.json({ error: "tip_too_small" }, { status: 400 });
  }

  const order = await getPublicCheckoutOrder({
    tenantId: body.tenantId,
    code,
    token: body.token,
  });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (order.dineOption !== "delivery") {
    return NextResponse.json({ error: "not_a_delivery_order" }, { status: 400 });
  }
  if (order.paymentStatus !== "not_required") {
    return NextResponse.json({ error: "wrong_payment_method" }, { status: 409 });
  }

  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;
  const demoSandbox = isDemoHostname(url.hostname);
  const returnPath = `/checkout/${encodeURIComponent(code)}?t=${encodeURIComponent(body.token)}`;

  try {
    const session = await createCheckoutSession({
      tenantId: order.tenantId,
      orderId: order.id,
      source: "mancia",
      currency: order.currency.toLowerCase(),
      items: [{ name: "Mancia al rider 🛵", amountCents: tipCents, quantity: 1 }],
      paymentIntentDescription: `Mancia ordine ${order.code}`,
      successUrl: `${origin}${returnPath}&mancia=ok`,
      cancelUrl: `${origin}${returnPath}&mancia=cancel`,
      expiresInMinutes: 30,
      demoSandbox,
      metadata: { source: "mancia", order_id: order.id },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "tip_session_failed";
    const status =
      msg === "tenant_stripe_not_connected" || msg === "tenant_stripe_charges_disabled"
        ? 409
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
