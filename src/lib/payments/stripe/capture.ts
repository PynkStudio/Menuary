import "server-only";

import { stripeRequest } from "./client";
import { tenantUsesStripeDemoSandbox } from "./sandbox-policy";
import { getDemoSandboxStripeAccount } from "./config";

type CaptureResult = { id: string; status: string; amount_received: number };

/**
 * Aggiorna opzionalmente l'importo di un PaymentIntent (per aggiungere la mancia)
 * e poi lo cattura. Il PI deve essere in stato `requires_capture`.
 */
export async function updateAndCapturePaymentIntent(opts: {
  paymentIntentId: string;
  stripeAccountId: string | null;
  tenantId: string;
  /** Se definito, aggiorna l'importo prima di catturare (ordine + mancia). */
  newAmountCents?: number;
}): Promise<CaptureResult> {
  const useDemoSandbox = tenantUsesStripeDemoSandbox(opts.tenantId);
  const demoAccount = useDemoSandbox ? getDemoSandboxStripeAccount() : null;
  const secretKey = demoAccount?.secretKey ?? undefined;
  const stripeAccount = opts.stripeAccountId ?? undefined;

  if (opts.newAmountCents !== undefined) {
    await stripeRequest<Record<string, unknown>>(
      `/payment_intents/${opts.paymentIntentId}`,
      {
        method: "POST",
        body: { amount: opts.newAmountCents },
        stripeAccount,
        secretKey,
      },
    );
  }

  return stripeRequest<CaptureResult>(
    `/payment_intents/${opts.paymentIntentId}/capture`,
    {
      method: "POST",
      stripeAccount,
      secretKey,
      idempotencyKey: `mancia-capture:${opts.paymentIntentId}:${opts.newAmountCents ?? "base"}`,
    },
  );
}
