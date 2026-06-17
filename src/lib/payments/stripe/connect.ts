import "server-only";

import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { stripeRequest } from "./client";
import { upsertTenantPaymentAccount } from "./accounts";
import {
  getStripeConnectClientId,
  getStripeConnectStateSecret,
  getStripeSecretKey,
} from "./config";

// Stripe Connect Standard: il tenant viene reindirizzato a Stripe per autorizzare
// la connessione del proprio account. Al ritorno scambiamo il code per ottenere
// `stripe_user_id` (acct_xxx) e leggiamo lo stato account per popolare lo store.
//
// Docs: https://docs.stripe.com/connect/oauth-reference

const STRIPE_OAUTH_AUTHORIZE = "https://connect.stripe.com/oauth/authorize";

function clientId(): string {
  return getStripeConnectClientId();
}

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://menuary.it"
  );
}

function stateSecret(): string {
  return getStripeConnectStateSecret();
}

// Lo "state" OAuth è firmato HMAC: contiene tenant_id + nonce + scadenza.
// Evita CSRF e collegamento dell'account al tenant sbagliato senza serverside session.
export function buildOAuthState(tenantId: string): string {
  const nonce = randomBytes(12).toString("hex");
  const exp = Math.floor(Date.now() / 1000) + 60 * 15; // 15 minuti
  const payload = `${tenantId}.${nonce}.${exp}`;
  const sig = createHmac("sha256", stateSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function parseOAuthState(
  state: string,
): { tenantId: string; valid: boolean; reason?: string } {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 4) return { tenantId: "", valid: false, reason: "malformed" };
    const [tenantId, nonce, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
      return { tenantId, valid: false, reason: "expired" };
    }
    const expected = createHmac("sha256", stateSecret())
      .update(`${tenantId}.${nonce}.${expStr}`)
      .digest("hex");
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { tenantId, valid: false, reason: "bad_signature" };
    }
    return { tenantId, valid: true };
  } catch {
    return { tenantId: "", valid: false, reason: "decode_error" };
  }
}

export function buildAuthorizeUrl(opts: {
  tenantId: string;
  email?: string;
  redirectPath?: string;
}): string {
  const state = buildOAuthState(opts.tenantId);
  const redirectUri = `${baseUrl()}/api/payments/stripe/callback`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    scope: "read_write",
    state,
    redirect_uri: redirectUri,
    "stripe_user[country]": "IT",
  });
  if (opts.email) params.set("stripe_user[email]", opts.email);
  return `${STRIPE_OAUTH_AUTHORIZE}?${params.toString()}`;
}

type OAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  scope: string;
  stripe_user_id: string;
  stripe_publishable_key?: string;
  token_type?: string;
};

// Scambia il code OAuth con stripe_user_id (l'account collegato).
// Endpoint OAuth è su /oauth/token (form root), non sotto /v1/.
async function exchangeOAuthCode(code: string): Promise<OAuthTokenResponse> {
  const secret = getStripeSecretKey("tenant_connect");
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
  });
  const res = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const json = (await res.json().catch(() => null)) as
    | (OAuthTokenResponse & { error?: string; error_description?: string })
    | null;
  if (!res.ok || !json?.stripe_user_id) {
    throw new Error(json?.error_description ?? json?.error ?? "stripe_oauth_exchange_failed");
  }
  return json;
}

type StripeAccountResponse = {
  id: string;
  email: string | null;
  country: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
};

async function retrieveConnectedAccount(stripeAccountId: string): Promise<StripeAccountResponse> {
  return stripeRequest<StripeAccountResponse>(`/accounts/${stripeAccountId}`, {
    method: "GET",
  });
}

export async function completeConnectOAuth(input: {
  tenantId: string;
  code: string;
}) {
  const token = await exchangeOAuthCode(input.code);
  const account = await retrieveConnectedAccount(token.stripe_user_id);
  return upsertTenantPaymentAccount({
    tenantId: input.tenantId,
    stripeAccountId: token.stripe_user_id,
    oauthScope: token.scope,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    accountEmail: account.email,
    accountCountry: account.country,
    status: account.charges_enabled ? "connected" : "pending",
  });
}

/** Disconnetti l'account dall'app piattaforma (revoca OAuth lato Stripe). */
export async function revokeConnectedAccount(stripeAccountId: string): Promise<void> {
  const secret = getStripeSecretKey("tenant_connect");
  const params = new URLSearchParams({
    client_id: clientId(),
    stripe_user_id: stripeAccountId,
  });
  const res = await fetch("https://connect.stripe.com/oauth/deauthorize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error((j as { error_description?: string })?.error_description ?? "stripe_deauthorize_failed");
  }
}

/** Risincronizza lo stato account da Stripe (utile da pannello admin). */
export async function refreshAccountStatus(input: {
  tenantId: string;
  stripeAccountId: string;
}) {
  const account = await retrieveConnectedAccount(input.stripeAccountId);
  return upsertTenantPaymentAccount({
    tenantId: input.tenantId,
    stripeAccountId: input.stripeAccountId,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    accountEmail: account.email,
    accountCountry: account.country,
    status: account.charges_enabled
      ? "connected"
      : account.details_submitted
        ? "restricted"
        : "pending",
  });
}
