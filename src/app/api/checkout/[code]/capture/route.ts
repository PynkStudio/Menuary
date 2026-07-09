import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { updateAndCapturePaymentIntent } from "@/lib/payments/stripe/capture";
import { recordPlatformErrorFromRequest } from "@/lib/platform-errors";

export const dynamic = "force-dynamic";

// POST /api/checkout/[code]/capture
// Body: { tenantId, token, tipCents? }
// Cattura il PaymentIntent pre-autorizzato di un ordine delivery,
// aggiungendo opzionalmente la mancia all'importo prima della cattura.
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

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const { data, error } = await db
    .from("orders")
    .select(
      "id, tenant_id, dine_option, payment_status, total, public_token, stripe_payment_intent_id, stripe_account_id",
    )
    .eq("tenant_id", body.tenantId)
    .eq("code", code)
    .maybeSingle();

  if (error) {
    await recordPlatformErrorFromRequest(req, {
      error,
      source: "api",
      tenantId: body.tenantId,
      flow: "checkout_capture",
      operation: "load_order",
      title: "Checkout: lettura ordine per cattura pagamento fallita",
      httpStatus: 500,
      metadata: { code },
    }).catch(() => undefined);
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const row = data as unknown as {
    id: string;
    tenant_id: string;
    dine_option: string | null;
    payment_status: string;
    total: number;
    public_token: string;
    stripe_payment_intent_id: string | null;
    stripe_account_id: string | null;
  };

  // Verifica token
  const tokenBuf = Buffer.from(body.token, "utf8");
  const storedBuf = Buffer.from(row.public_token, "utf8");
  if (tokenBuf.length !== storedBuf.length || !timingSafeEqual(tokenBuf, storedBuf)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (row.dine_option !== "delivery") {
    return NextResponse.json({ error: "not_a_delivery_order" }, { status: 400 });
  }
  if (!row.stripe_payment_intent_id) {
    return NextResponse.json({ error: "no_payment_intent" }, { status: 400 });
  }

  const tipCents = Math.max(0, Math.round(body.tipCents ?? 0));
  const orderAmountCents = Math.round(Number(row.total) * 100);
  const totalCents = orderAmountCents + tipCents;

  try {
    await updateAndCapturePaymentIntent({
      paymentIntentId: row.stripe_payment_intent_id,
      stripeAccountId: row.stripe_account_id,
      tenantId: body.tenantId,
      newAmountCents: tipCents > 0 ? totalCents : undefined,
    });

    await db
      .from("orders")
      .update({ tip_amount_cents: tipCents } as never)
      .eq("id", row.id)
      .eq("tenant_id", row.tenant_id);

    return NextResponse.json({ ok: true, capturedAmountCents: totalCents });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "capture_failed";
    // PI già catturato → idempotente, va bene
    if (/already.{0,30}captured/i.test(msg)) {
      await db
        .from("orders")
        .update({ tip_amount_cents: tipCents } as never)
        .eq("id", row.id)
        .eq("tenant_id", row.tenant_id);
      return NextResponse.json({ ok: true, capturedAmountCents: totalCents });
    }
    await recordPlatformErrorFromRequest(req, {
      error: err,
      source: "api",
      tenantId: row.tenant_id,
      orderId: row.id,
      flow: "checkout_capture",
      operation: "stripe_capture",
      title: "Checkout: cattura pagamento Stripe fallita",
      httpStatus: 500,
      metadata: {
        code,
        paymentIntentId: row.stripe_payment_intent_id,
        stripeAccountId: row.stripe_account_id,
        orderAmountCents,
        tipCents,
        totalCents,
      },
    }).catch(() => undefined);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
