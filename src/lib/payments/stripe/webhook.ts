import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getTenantByStripeAccount, upsertTenantPaymentAccount } from "./accounts";

// Verifica firma Stripe (Stripe-Signature: t=...,v1=...).
// Implementiamo a mano per evitare dipendenza dall'SDK Stripe.
// Docs: https://docs.stripe.com/webhooks/signatures

const TOLERANCE_SECONDS = 5 * 60;

export type VerifiedStripeEvent = {
  id: string;
  type: string;
  livemode: boolean;
  account?: string; // presente per eventi Connect
  data: { object: Record<string, unknown> };
  created: number;
};

export function verifyStripeSignature(opts: {
  payload: string;
  signatureHeader: string | null;
  secret: string;
}): VerifiedStripeEvent {
  if (!opts.signatureHeader) throw new Error("missing_signature");
  const parts = Object.fromEntries(
    opts.signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) throw new Error("malformed_signature");
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp)) throw new Error("bad_timestamp");
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > TOLERANCE_SECONDS) {
    throw new Error("signature_expired");
  }
  const expected = createHmac("sha256", opts.secret)
    .update(`${parts.t}.${opts.payload}`)
    .digest("hex");
  const a = Buffer.from(parts.v1, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("invalid_signature");
  }
  const event = JSON.parse(opts.payload) as VerifiedStripeEvent;
  if (!event?.id || !event?.type) throw new Error("invalid_event");
  return event;
}

function serviceDb() {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");
  return db;
}

/** Insert idempotente nel log eventi. Ritorna false se già visto. */
async function recordEvent(event: VerifiedStripeEvent): Promise<boolean> {
  const db = serviceDb() as unknown as {
    from: (t: "stripe_webhook_events") => {
      insert: (row: Record<string, unknown>) => Promise<{
        error: { message: string; code?: string } | null;
      }>;
    };
  };
  const { error } = await db.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    livemode: event.livemode,
    account: event.account ?? null,
    payload: event as unknown as Record<string, unknown>,
  });
  if (!error) return true;
  // 23505 = unique violation → già processato.
  if (error.code === "23505" || /duplicate key/i.test(error.message)) return false;
  throw new Error(error.message);
}

async function markProcessed(eventId: string, errorMsg?: string): Promise<void> {
  const db = serviceDb() as unknown as {
    from: (t: "stripe_webhook_events") => {
      update: (row: Record<string, unknown>) => {
        eq: (k: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };
  await db
    .from("stripe_webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      process_error: errorMsg ?? null,
    })
    .eq("id", eventId);
}

type CheckoutSessionObject = {
  id: string;
  payment_intent: string | null;
  amount_total: number | null;
  payment_status: string;
  metadata: Record<string, string> | null;
};

type AccountObject = {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  email: string | null;
  country: string | null;
};

async function handleCheckoutCompleted(
  event: VerifiedStripeEvent,
): Promise<void> {
  const session = event.data.object as unknown as CheckoutSessionObject;

  // Platform contract payment (source=platform_contract)
  if (session.metadata?.source === "platform_contract" && session.metadata?.contract_id) {
    await handleContractPaymentCompleted(session);
    return;
  }

  const orderId = session.metadata?.order_id;
  const tenantId = session.metadata?.tenant_id;
  if (!orderId || !tenantId) return; // niente da aggiornare

  const db = serviceDb() as unknown as {
    from: (t: "orders") => {
      update: (row: Record<string, unknown>) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
  };
  await db
    .from("orders")
    .update({
      payment_status: "paid",
      payment_provider: "stripe",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      stripe_account_id: event.account ?? null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("tenant_id", tenantId);

  // Aggiorna anche eventuale channel_payment_request collegato.
  const dbCh = serviceDb() as unknown as {
    from: (t: "channel_payment_requests") => {
      update: (row: Record<string, unknown>) => {
        eq: (k: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };
  await dbCh
    .from("channel_payment_requests")
    .update({
      status: "paid",
      stripe_payment_intent_id: session.payment_intent,
      paid_at: new Date().toISOString(),
    })
    .eq("provider_session_id", session.id);
}

async function handleAccountUpdated(event: VerifiedStripeEvent): Promise<void> {
  const acc = event.data.object as unknown as AccountObject;
  if (!acc.id) return;
  const existing = await getTenantByStripeAccount(acc.id);
  if (!existing) return; // account non collegato a nessun tenant
  await upsertTenantPaymentAccount({
    tenantId: existing.tenantId,
    stripeAccountId: acc.id,
    chargesEnabled: acc.charges_enabled,
    payoutsEnabled: acc.payouts_enabled,
    detailsSubmitted: acc.details_submitted,
    accountEmail: acc.email,
    accountCountry: acc.country,
    status: acc.charges_enabled
      ? "connected"
      : acc.details_submitted
        ? "restricted"
        : "pending",
  });
}

export async function processStripeEvent(event: VerifiedStripeEvent): Promise<{
  duplicate: boolean;
  handled: boolean;
}> {
  const isNew = await recordEvent(event);
  if (!isNew) return { duplicate: true, handled: false };

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event);
        break;
      case "account.updated":
        await handleAccountUpdated(event);
        break;
      // Altri eventi possono essere aggiunti in seguito (payment_intent.payment_failed,
      // charge.refunded, account.application.deauthorized, ecc.).
      default:
        break;
    }
    await markProcessed(event.id);
    return { duplicate: false, handled: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markProcessed(event.id, msg);
    throw err;
  }
}

// ─── Platform contract payment ───────────────────────────────────────────────

async function handleContractPaymentCompleted(
  session: CheckoutSessionObject,
): Promise<void> {
  const contractId = session.metadata?.contract_id;
  if (!contractId) return;

  const { getContract, updateContract } = await import("@/lib/contracts/contract-queries");

  const contract = await getContract(contractId);
  if (!contract) {
    console.warn("[stripe-webhook] Contract not found:", contractId);
    return;
  }

  // Update contract payment status
  await updateContract(contractId, {
    payment_status: "paid",
    stripe_payment_intent_id: session.payment_intent,
    paid_at: new Date().toISOString(),
    status: "countersigned",
  });

  // Pagamento ricevuto → attiva l'abbonamento (tenant + dominio + canone). Se non
  // esiste un abbonamento collegato, fallback all'attivazione diretta del tenant.
  const { activateSubscriptionByContract } = await import("@/lib/platform/subscription-service");
  const activated = await activateSubscriptionByContract(contractId).catch((err) => {
    console.error("[stripe-webhook] activateSubscriptionByContract failed", err);
    return false;
  });
  if (!activated) {
    const tenantSlug = contract.contract_data?.servizio?.tenantSlug;
    if (tenantSlug) await activateTenantForContract(contractId, tenantSlug);
  }
}

async function activateTenantForContract(
  contractId: string,
  tenantSlug: string,
): Promise<void> {
  const db = serviceDb();

  // Find tenant by slug (id = slug in this codebase)
  const { data: tenant } = await (db as unknown as {
    from: (t: "tenants") => {
      select: (s: string) => {
        eq: (k: string, v: string) => {
          maybeSingle: () => Promise<{ data: { id: string; status: string } | null }>;
        };
      };
    };
  }).from("tenants").select("id, status").eq("id", tenantSlug).maybeSingle();

  if (!tenant) {
    console.warn("[stripe-webhook] Tenant not found for activation:", tenantSlug);
    return;
  }

  // Activate tenant
  await (db as unknown as {
    from: (t: "tenants") => {
      update: (row: Record<string, unknown>) => {
        eq: (k: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  }).from("tenants").update({
    enabled: true,
    status: "active",
    updated_at: new Date().toISOString(),
  }).eq("id", tenant.id);

  // Mark activation on contract
  const { updateContract } = await import("@/lib/contracts/contract-queries");
  await updateContract(contractId, {
    tenant_id: tenant.id,
    tenant_activated_at: new Date().toISOString(),
  });

  console.log("[stripe-webhook] Tenant activated:", tenant.id, "for contract:", contractId);
}
