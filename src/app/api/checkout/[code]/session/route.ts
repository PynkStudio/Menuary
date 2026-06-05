import { NextRequest, NextResponse } from "next/server";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";
import { createCheckoutSession } from "@/lib/payments/stripe/checkout";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { PaymentSource } from "@/lib/payments/stripe/fees";

export const dynamic = "force-dynamic";

// POST /api/checkout/[code]/session
// Body: { tenantId, token }
// Crea (o ricrea) la Stripe Checkout Session per un ordine già esistente.
// Chiamato dal client della pagina /checkout/[code] dopo l'accettazione privacy.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  let body: { tenantId?: string; token?: string } = {};
  try {
    body = (await req.json()) as { tenantId?: string; token?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.tenantId || !body.token) {
    return NextResponse.json({ error: "tenantId_and_token_required" }, { status: 400 });
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
  if (!order.lines.length) {
    return NextResponse.json({ error: "order_empty" }, { status: 422 });
  }

  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;
  const returnPath = `/checkout/${encodeURIComponent(code)}?t=${encodeURIComponent(body.token)}`;

  try {
    const session = await createCheckoutSession({
      tenantId: order.tenantId,
      orderId: order.id,
      source: (order.source as PaymentSource) ?? "online",
      currency: order.currency.toLowerCase(),
      items: order.lines.map((l) => ({
        name: l.name,
        amountCents: Math.round(l.unitPrice * 100),
        quantity: l.qty,
      })),
      paymentIntentDescription: `Ordine ${order.code} · ${order.lines
        .map((l) => `${l.qty}× ${l.name}`)
        .join(", ")}`.slice(0, 990),
      successUrl: `${origin}${returnPath}&status=success`,
      cancelUrl: `${origin}${returnPath}&status=cancel`,
      expiresInMinutes: 60,
    });
    const db = createSupabaseServiceClient();
    if (db) {
      await db
        .from("orders")
        .update({
          payment_status: "pending",
          payment_provider: "stripe",
          stripe_account_id: session.stripeAccountId,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.paymentIntentId,
          application_fee_amount_cents: session.applicationFeeCents,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", order.id)
        .eq("tenant_id", order.tenantId);
    }
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout_failed";
    const status =
      message === "tenant_stripe_not_connected" ||
      message === "tenant_stripe_charges_disabled"
        ? 409
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
