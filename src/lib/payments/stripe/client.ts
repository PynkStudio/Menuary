import "server-only";

import {
  getStripeSecretKey,
  STRIPE_API_VERSION,
  type StripeCredentialScope,
} from "./config";

// Wrapper minimale fetch-based per Stripe API. Nessuna dipendenza esterna
// (in linea con channel-payment-links.ts esistente). Supporta header
// `Stripe-Account` per agire sull'account collegato del tenant.

export type StripeRequestInit = {
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
  /** Account Stripe Connect su cui agire (acct_xxx). Omettere per chiamate piattaforma. */
  stripeAccount?: string;
  /** Secret esplicito, utile per demo sandbox/test mode. */
  secretKey?: string;
  /** Scope credenziali quando non viene passato secretKey. */
  credentialScope?: StripeCredentialScope;
  /** Idempotency key (consigliata su POST). */
  idempotencyKey?: string;
};

const STRIPE_API = "https://api.stripe.com/v1";

// Serializza un oggetto annidato nel formato form-url-encoded che Stripe attende
// (es. `payment_intent_data[metadata][order_id]=...`).
function appendForm(params: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => appendForm(params, `${key}[${i}]`, v));
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      appendForm(params, `${key}[${k}]`, v);
    }
    return;
  }
  params.set(key, typeof value === "string" ? value : String(value));
}

function serialize(body: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) appendForm(params, k, v);
  return params;
}

export type StripeError = {
  message: string;
  code?: string;
  type?: string;
  status: number;
};

export async function stripeRequest<T>(
  path: string,
  init: StripeRequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${init.secretKey ?? getStripeSecretKey(init.credentialScope)}`,
    "Stripe-Version": STRIPE_API_VERSION,
  };
  if (init.stripeAccount) headers["Stripe-Account"] = init.stripeAccount;
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;

  let body: string | undefined;
  if (init.body && init.method !== "GET") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = serialize(init.body).toString();
  }

  const url = init.body && init.method === "GET"
    ? `${STRIPE_API}${path}?${serialize(init.body).toString()}`
    : `${STRIPE_API}${path}`;

  const res = await fetch(url, { method: init.method ?? "POST", headers, body });
  const json = (await res.json().catch(() => null)) as
    | (T & { error?: { message?: string; code?: string; type?: string } })
    | null;

  if (!res.ok) {
    const err: StripeError = {
      message: json?.error?.message ?? `stripe_request_failed_${res.status}`,
      code: json?.error?.code,
      type: json?.error?.type,
      status: res.status,
    };
    throw Object.assign(new Error(err.message), { stripe: err });
  }
  if (!json) throw new Error("stripe_empty_response");
  return json as T;
}
