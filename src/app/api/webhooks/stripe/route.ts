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
// Il segreto del webhook va salvato in STRIPE_WEBHOOK_SECRET (Connect).
// Per uno webhook "Account" piattaforma usare STRIPE_WEBHOOK_SECRET_PLATFORM.
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  const connectSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const platformSecret = process.env.STRIPE_WEBHOOK_SECRET_PLATFORM;
  const secret = connectSecret ?? platformSecret;
  if (!secret) {
    return NextResponse.json({ error: "webhook_secret_unset" }, { status: 503 });
  }

  let event;
  try {
    event = verifyStripeSignature({ payload, signatureHeader: signature, secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "signature_verification_failed";
    // Stripe richiede 4xx per firme invalide, altrimenti continua a ritentare.
    return NextResponse.json({ error: message }, { status: 400 });
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
