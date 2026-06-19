import "server-only";

import { stripeRequest } from "./client";
import { getTenantPaymentAccount } from "./accounts";
import { applicationFeeCents, type PaymentSource } from "./fees";
import { getDemoSandboxStripeAccount, type StripeAccountMode } from "./config";
import { tenantUsesStripeDemoSandbox } from "./sandbox-policy";

export type CheckoutLineItemInput = {
  name: string;
  description?: string;
  /** Importo in centesimi. */
  amountCents: number;
  quantity?: number;
};

export type CreateCheckoutInput = {
  tenantId: string;
  orderId?: string;
  source: PaymentSource | string;
  currency?: string; // default "eur"
  items: CheckoutLineItemInput[];
  customerEmail?: string;
  /** Override descrizione PaymentIntent (riepilogo ordine letto su statement). */
  paymentIntentDescription?: string;
  successUrl: string;
  cancelUrl: string;
  /** Scadenza sessione (minuti). Default 120 (max 24h da Stripe; min 30). */
  expiresInMinutes?: number;
  metadata?: Record<string, string>;
  /** Usa la sandbox condivisa Menuary/Bizery sui tenant demo. */
  demoSandbox?: boolean;
  /** "manual" = pre-autorizza senza catturare subito. Default "automatic". */
  captureMethod?: "manual" | "automatic";
};

export type CheckoutSession = {
  id: string;
  url: string;
  paymentIntentId: string | null;
  expiresAt: number;
  amountTotalCents: number;
  applicationFeeCents: number;
  stripeAccountId: string | null;
  accountMode: StripeAccountMode;
};

type StripeSession = {
  id: string;
  url: string | null;
  payment_intent: string | null;
  expires_at: number;
  amount_total: number | null;
  metadata: Record<string, string> | null;
};

const MIN_EXPIRES_MIN = 30;

function totalCents(items: CheckoutLineItemInput[]): number {
  return items.reduce(
    (sum, it) => sum + Math.max(0, Math.round(it.amountCents)) * (it.quantity ?? 1),
    0,
  );
}

function trim(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export async function createCheckoutSession(
  input: CreateCheckoutInput,
): Promise<CheckoutSession> {
  if (!input.items.length) throw new Error("checkout_no_items");
  const useDemoSandbox = input.demoSandbox || tenantUsesStripeDemoSandbox(input.tenantId);

  const account = await getTenantPaymentAccount(input.tenantId, {
    demoSandbox: useDemoSandbox,
  });
  if (!account) {
    throw new Error("tenant_stripe_not_connected");
  }
  if (!account.chargesEnabled) {
    throw new Error("tenant_stripe_charges_disabled");
  }

  const demoAccount = useDemoSandbox ? getDemoSandboxStripeAccount() : null;
  const secretKey = demoAccount?.secretKey;
  const stripeAccount = account.stripeAccountId ?? undefined;

  const currency = (input.currency ?? "eur").toLowerCase();
  const amountTotal = totalCents(input.items);
  const feeCents = applicationFeeCents(amountTotal, input.source);

  const expiresInMin = Math.max(MIN_EXPIRES_MIN, input.expiresInMinutes ?? 120);
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInMin * 60;

  const body: Record<string, unknown> = {
    mode: "payment",
    "payment_method_types[0]": "card",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    expires_at: expiresAt,
    customer_creation: "if_required",
    metadata: {
      tenant_id: input.tenantId,
      source: input.source,
      ...(input.orderId ? { order_id: input.orderId } : {}),
      ...(input.metadata ?? {}),
    },
    payment_intent_data: {
      metadata: {
        tenant_id: input.tenantId,
        source: input.source,
        ...(input.orderId ? { order_id: input.orderId } : {}),
      },
      ...(input.paymentIntentDescription
        ? { description: trim(input.paymentIntentDescription, 1000) }
        : {}),
      ...(feeCents > 0 && stripeAccount ? { application_fee_amount: feeCents } : {}),
      ...(input.captureMethod === "manual" ? { capture_method: "manual" } : {}),
    },
  };

  // line_items in formato nested.
  input.items.forEach((it, i) => {
    const ln: Record<string, unknown> = {
      quantity: it.quantity ?? 1,
      price_data: {
        currency,
        unit_amount: Math.round(it.amountCents),
        product_data: {
          name: trim(it.name, 250),
          ...(it.description ? { description: trim(it.description, 500) } : {}),
        },
      },
    };
    (body as Record<string, unknown>)[`line_items[${i}]`] = ln;
  });

  if (input.customerEmail) body.customer_email = input.customerEmail;

  const session = await stripeRequest<StripeSession>("/checkout/sessions", {
    method: "POST",
    body,
    stripeAccount,
    secretKey,
    idempotencyKey: input.orderId
      ? `checkout:${account.mode}:${input.tenantId}:${input.orderId}`
      : undefined,
  });

  if (!session.url) throw new Error("stripe_checkout_no_url");

  return {
    id: session.id,
    url: session.url,
    paymentIntentId: session.payment_intent,
    expiresAt: session.expires_at,
    amountTotalCents: session.amount_total ?? amountTotal,
    applicationFeeCents: stripeAccount ? feeCents : 0,
    stripeAccountId: account.stripeAccountId,
    accountMode: account.mode,
  };
}
