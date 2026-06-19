import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/payments/stripe/checkout";
import type { PaymentSource } from "@/lib/payments/stripe/fees";
import { shouldUseStripeSandbox } from "@/lib/payments/stripe/sandbox-policy";

export const dynamic = "force-dynamic";

// POST /api/payments/stripe/checkout
// Crea una Checkout Session sull'account Stripe del tenant.
// Body: {
//   tenantId, orderId?, source, currency?, items: [{ name, description?, amountCents, quantity? }],
//   customerEmail?, paymentIntentDescription?, successUrl, cancelUrl, expiresInMinutes?, metadata?
// }
type CheckoutBody = {
  tenantId?: string;
  orderId?: string;
  source?: PaymentSource | string;
  currency?: string;
  items?: Array<{
    name?: string;
    description?: string;
    amountCents?: number;
    quantity?: number;
  }>;
  customerEmail?: string;
  paymentIntentDescription?: string;
  successUrl?: string;
  cancelUrl?: string;
  expiresInMinutes?: number;
  metadata?: Record<string, string>;
};

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.tenantId) return NextResponse.json({ error: "tenantId_required" }, { status: 400 });
  if (!body.source) return NextResponse.json({ error: "source_required" }, { status: 400 });
  if (!body.successUrl || !body.cancelUrl) {
    return NextResponse.json({ error: "success_cancel_urls_required" }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "items_required" }, { status: 400 });
  }

  const items = body.items.map((it) => {
    if (!it.name || !Number.isFinite(it.amountCents) || (it.amountCents ?? 0) <= 0) {
      throw new Error("invalid_line_item");
    }
    return {
      name: it.name,
      description: it.description,
      amountCents: it.amountCents as number,
      quantity: it.quantity ?? 1,
    };
  });

  try {
    const url = new URL(req.url);
    const session = await createCheckoutSession({
      tenantId: body.tenantId,
      orderId: body.orderId,
      source: body.source,
      currency: body.currency,
      items,
      customerEmail: body.customerEmail,
      paymentIntentDescription: body.paymentIntentDescription,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
      expiresInMinutes: body.expiresInMinutes,
      metadata: body.metadata,
      demoSandbox: shouldUseStripeSandbox(body.tenantId, url.hostname),
    });
    return NextResponse.json({ session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout_failed";
    const status =
      message === "tenant_stripe_not_connected" ||
      message === "tenant_stripe_charges_disabled"
        ? 409
        : message === "invalid_line_item"
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
