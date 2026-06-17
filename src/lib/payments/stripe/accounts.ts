import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/database.types";
import {
  getDemoSandboxStripeAccount,
  type StripeAccountMode,
} from "./config";

export type TenantPaymentAccountStatus =
  | "pending"
  | "connected"
  | "restricted"
  | "disconnected";

export type TenantPaymentAccount = {
  id: string;
  tenantId: string;
  provider: "stripe";
  stripeAccountId: string | null;
  accountType: "standard" | "express";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  accountEmail: string | null;
  accountCountry: string | null;
  oauthScope: string | null;
  status: TenantPaymentAccountStatus;
  lastSyncedAt: string | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
  metadata: Record<string, unknown>;
  mode: StripeAccountMode;
};

type Row = {
  id: string;
  tenant_id: string;
  provider: "stripe";
  stripe_account_id: string | null;
  account_type: "standard" | "express";
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  account_email: string | null;
  account_country: string | null;
  oauth_scope: string | null;
  status: TenantPaymentAccountStatus;
  last_synced_at: string | null;
  connected_at: string | null;
  disconnected_at: string | null;
  metadata: Record<string, unknown>;
};

function mapRow(row: Row): TenantPaymentAccount {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    provider: row.provider,
    stripeAccountId: row.stripe_account_id,
    accountType: row.account_type,
    chargesEnabled: row.charges_enabled,
    payoutsEnabled: row.payouts_enabled,
    detailsSubmitted: row.details_submitted,
    accountEmail: row.account_email,
    accountCountry: row.account_country,
    oauthScope: row.oauth_scope,
    status: row.status,
    lastSyncedAt: row.last_synced_at,
    connectedAt: row.connected_at,
    disconnectedAt: row.disconnected_at,
    metadata: row.metadata ?? {},
    mode: "tenant_connect",
  };
}

function serviceDb() {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");
  return db;
}

export async function getTenantPaymentAccount(
  tenantId: string,
  opts: { demoSandbox?: boolean } = {},
): Promise<TenantPaymentAccount | null> {
  if (opts.demoSandbox) {
    const demo = getDemoSandboxStripeAccount();
    if (demo) {
      return {
        id: `demo-sandbox:${tenantId}`,
        tenantId,
        provider: "stripe",
        stripeAccountId: demo.stripeAccountId,
        accountType: "standard",
        chargesEnabled: demo.chargesEnabled,
        payoutsEnabled: demo.payoutsEnabled,
        detailsSubmitted: demo.detailsSubmitted,
        accountEmail: demo.accountEmail,
        accountCountry: demo.accountCountry,
        oauthScope: null,
        status: demo.status,
        lastSyncedAt: null,
        connectedAt: null,
        disconnectedAt: null,
        metadata: { demoSandbox: true },
        mode: demo.mode,
      };
    }
  }

  const db = serviceDb() as unknown as {
    from: (t: "tenant_payment_accounts") => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => {
            maybeSingle: () => Promise<{ data: Row | null; error: { message: string } | null }>;
          };
        };
      };
    };
  };
  const { data, error } = await db
    .from("tenant_payment_accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("provider", "stripe")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function getTenantByStripeAccount(
  stripeAccountId: string,
): Promise<TenantPaymentAccount | null> {
  const db = serviceDb() as unknown as {
    from: (t: "tenant_payment_accounts") => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          maybeSingle: () => Promise<{ data: Row | null; error: { message: string } | null }>;
        };
      };
    };
  };
  const { data, error } = await db
    .from("tenant_payment_accounts")
    .select("*")
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export type UpsertAccountInput = {
  tenantId: string;
  stripeAccountId: string;
  oauthScope?: string | null;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  accountEmail?: string | null;
  accountCountry?: string | null;
  status?: TenantPaymentAccountStatus;
  metadata?: Record<string, Json>;
};

export async function upsertTenantPaymentAccount(
  input: UpsertAccountInput,
): Promise<TenantPaymentAccount> {
  const db = serviceDb() as unknown as {
    from: (t: "tenant_payment_accounts") => {
      upsert: (
        row: Record<string, unknown>,
        opts: { onConflict: string },
      ) => {
        select: (c: string) => {
          single: () => Promise<{ data: Row | null; error: { message: string } | null }>;
        };
      };
    };
  };
  const now = new Date().toISOString();
  const isConnected = input.status === "connected" || input.chargesEnabled === true;
  const row: Record<string, unknown> = {
    tenant_id: input.tenantId,
    provider: "stripe",
    stripe_account_id: input.stripeAccountId,
    account_type: "standard",
    oauth_scope: input.oauthScope ?? null,
    charges_enabled: input.chargesEnabled ?? false,
    payouts_enabled: input.payoutsEnabled ?? false,
    details_submitted: input.detailsSubmitted ?? false,
    account_email: input.accountEmail ?? null,
    account_country: input.accountCountry ?? null,
    status: input.status ?? (input.chargesEnabled ? "connected" : "pending"),
    last_synced_at: now,
    connected_at: isConnected ? now : null,
    metadata: input.metadata ?? {},
  };
  const { data, error } = await db
    .from("tenant_payment_accounts")
    .upsert(row, { onConflict: "tenant_id,provider" })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "upsert_failed");
  return mapRow(data);
}

export async function markAccountDisconnected(tenantId: string): Promise<void> {
  const db = serviceDb() as unknown as {
    from: (t: "tenant_payment_accounts") => {
      update: (row: Record<string, unknown>) => {
        eq: (k: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };
  const { error } = await db
    .from("tenant_payment_accounts")
    .update({
      status: "disconnected",
      stripe_account_id: null,
      charges_enabled: false,
      payouts_enabled: false,
      disconnected_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);
}
