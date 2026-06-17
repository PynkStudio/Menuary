import "server-only";

import { findTenantById } from "@/lib/tenant-registry";

export const STRIPE_API_VERSION = "2026-02-25.clover";

export type StripeCredentialScope =
  | "tenant_connect"
  | "demo_sandbox"
  | "platform_contract";

export type StripeAccountMode =
  | "tenant_connect"
  | "demo_sandbox_connect"
  | "demo_sandbox_platform";

export type StripeResolvedAccount = {
  mode: StripeAccountMode;
  secretKey: string;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  accountEmail: string | null;
  accountCountry: string | null;
  status: "pending" | "connected" | "restricted" | "disconnected";
};

function firstEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return null;
}

export function getStripeSecretKey(scope: StripeCredentialScope = "tenant_connect"): string {
  const key =
    scope === "demo_sandbox"
      ? firstEnv("STRIPE_DEMO_SANDBOX_SECRET_KEY", "STRIPE_SANDBOX_SECRET_KEY", "STRIPE_TEST_SECRET_KEY")
      : scope === "platform_contract"
        ? firstEnv("STRIPE_PLATFORM_CONTRACT_SECRET_KEY", "STRIPE_LIVE_SECRET_KEY", "STRIPE_SECRET_KEY")
        : firstEnv("STRIPE_TENANT_CONNECT_SECRET_KEY", "STRIPE_LIVE_SECRET_KEY", "STRIPE_SECRET_KEY");

  if (!key) throw new Error("stripe_secret_unset");
  return key;
}

export function getStripeConnectClientId(): string {
  const id = firstEnv("STRIPE_CONNECT_CLIENT_ID", "STRIPE_TENANT_CONNECT_CLIENT_ID");
  if (!id) throw new Error("stripe_connect_client_id_unset");
  return id;
}

export function getStripeConnectStateSecret(): string {
  const secret = firstEnv(
    "STRIPE_CONNECT_STATE_SECRET",
    "STRIPE_TENANT_CONNECT_STATE_SECRET",
    "STRIPE_TENANT_CONNECT_SECRET_KEY",
    "STRIPE_SECRET_KEY",
  );
  if (!secret) throw new Error("stripe_state_secret_unset");
  return secret;
}

export function getDemoSandboxStripeAccount(): StripeResolvedAccount | null {
  const secretKey = firstEnv("STRIPE_DEMO_SANDBOX_SECRET_KEY", "STRIPE_SANDBOX_SECRET_KEY", "STRIPE_TEST_SECRET_KEY");
  if (!secretKey) return null;

  const connectedAccountId = firstEnv("STRIPE_DEMO_CONNECTED_ACCOUNT_ID", "STRIPE_DEMO_SANDBOX_ACCOUNT_ID");
  return {
    mode: connectedAccountId ? "demo_sandbox_connect" : "demo_sandbox_platform",
    secretKey,
    stripeAccountId: connectedAccountId,
    chargesEnabled: true,
    payoutsEnabled: Boolean(connectedAccountId),
    detailsSubmitted: true,
    accountEmail: "sandbox@menuary.test",
    accountCountry: "IT",
    status: "connected",
  };
}

export function isLikelyDemoTenant(tenantId: string): boolean {
  const tenant = findTenantById(tenantId);
  if (!tenant) return false;
  if (tenant.status === "trattativa" || tenant.status === "trial") return true;
  return tenant.domains.length === 0;
}
