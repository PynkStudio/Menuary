import { NextRequest, NextResponse } from "next/server";
import { processStripeEvent, verifyStripeSignature } from "@/lib/payments/stripe/webhook";

export const dynamic = "force-dynamic";

// Webhook Connect Stripe. Da configurare lato Stripe Dashboard come
// "Connect application" webhook puntato a {NEXT_PUBLIC_SITE_URL}/api/webhooks/stripe.
// Eventi minimi da abilitare:
//   - checkout.session.completed
//   - checkout.session.async_payment_succeeded
//   - account.updated
//   - account.application.deauthorized (futuro)
//
// Il segreto del webhook tenant Connect va salvato in STRIPE_TENANT_WEBHOOK_SECRET.
// Per uno webhook "Account" piattaforma usare STRIPE_WEBHOOK_SECRET_PLATFORM.
// Per la sandbox demo condivisa usare STRIPE_DEMO_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  const secrets = [
    process.env.STRIPE_TENANT_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_PLATFORM,
    process.env.STRIPE_DEMO_WEBHOOK_SECRET,
  ].filter((value): value is string => Boolean(value));
  if (!secrets.length) {
    return NextResponse.json({ error: "webhook_secret_unset" }, { status: 503 });
  }

  let event;
  let verifyError = "signature_verification_failed";
  try {
    for (const secret of secrets) {
      try {
        event = verifyStripeSignature({ payload, signatureHeader: signature, secret });
        break;
      } catch (err) {
        verifyError = err instanceof Error ? err.message : verifyError;
      }
    }
    if (!event) throw new Error(verifyError);
  } catch {
    // Stripe richiede 4xx per firme invalide, altrimenti continua a ritentare.
    return NextResponse.json({ error: verifyError }, { status: 400 });
  }

  try {
    const result = await processStripeEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "process_error";
    // 500 → Stripe ritenta automaticamente.
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
