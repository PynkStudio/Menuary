import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { PlatformContract } from "@/lib/contracts/contract-queries";
import {
  computeCanoneAmount,
  computeFirstPayment,
} from "@/lib/contracts/menuary-contract";
import type { BillingCycle } from "@/lib/platform-crm-types";

/** Giorni di tolleranza dal contratto: oltre la due_date il tenant viene sospeso. */
export const PAYMENT_GRACE_DAYS = 15;

// platform_subscriptions / platform_payments non sono nei tipi generati.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addCycle(isoDate: string, cycle: BillingCycle): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (cycle === "yearly") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}

/** Mappa il metodo di pagamento del contratto sul provider di riconciliazione. */
function providerForMethod(method: string): "manual" | "stripe" | "bunq" {
  if (method === "bunq") return "bunq";
  if (method === "carta") return "stripe";
  return "manual"; // bonifico / IBAN
}

/**
 * Crea (idempotente) l'abbonamento `pending_payment` + il primo pagamento `pending`
 * a partire da un contratto firmato. Importo ricorrente = canone (MRR/YRR, escluso
 * il setup); primo pagamento = setup + primo canone. Scadenza = oggi + 15gg.
 */
export async function createPendingSubscriptionFromContract(
  contract: PlatformContract,
): Promise<{ subscriptionId: string; paymentId: string | null } | null> {
  if (!contract.lead_id) {
    console.warn("[subscription-service] contratto senza lead_id, salto", contract.id);
    return null;
  }

  const existing = await db()
    .from("platform_subscriptions")
    .select("id")
    .eq("contract_id", contract.id)
    .maybeSingle();
  if (existing.data?.id) {
    const { data: pay } = await db()
      .from("platform_payments")
      .select("id")
      .eq("subscription_id", existing.data.id)
      .eq("kind", "first")
      .eq("status", "pending")
      .maybeSingle();
    return { subscriptionId: existing.data.id, paymentId: pay?.id ?? null };
  }

  const economiche = contract.contract_data.economiche;
  const cycle = economiche.cicloFatturazione;
  const recurring = computeCanoneAmount(economiche);
  const firstPayment = computeFirstPayment(economiche);
  const method = economiche.metodoPagamento;
  const tenantSlug = contract.contract_data.servizio?.tenantSlug || null;
  const dominio = contract.contract_data.servizio?.dominio || null;

  const start = todayISO();
  const grace = addDays(start, PAYMENT_GRACE_DAYS);

  const { data: sub, error } = await db()
    .from("platform_subscriptions")
    .insert({
      lead_id: contract.lead_id,
      contract_id: contract.id,
      tenant_id: tenantSlug,
      package_slug: contract.package_slug,
      billing_cycle: cycle,
      price_override: recurring,
      setup_amount: economiche.setup,
      first_payment_amount: firstPayment,
      payment_method: method,
      official_domain: dominio,
      currency: "EUR",
      status: "pending_payment",
      started_at: start,
      grace_until: grace,
      notes: `Generato dal contratto ${contract.numero}`,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // invoice_number = numero contratto → consente la riconciliazione Bunq per riferimento.
  const { data: pay, error: payErr } = await db()
    .from("platform_payments")
    .insert({
      subscription_id: sub.id,
      lead_id: contract.lead_id,
      amount: firstPayment,
      currency: "EUR",
      status: "pending",
      kind: "first",
      payment_method: method,
      payment_provider: providerForMethod(method),
      invoice_number: contract.numero,
      due_date: grace,
    })
    .select("id")
    .single();
  if (payErr) throw new Error(payErr.message);

  // Collega il contratto all'abbonamento generato.
  await db()
    .from("platform_contracts")
    .update({ subscription_id: sub.id, updated_at: new Date().toISOString() })
    .eq("id", contract.id);

  return { subscriptionId: sub.id, paymentId: pay.id };
}

/** Aggancia i riferimenti del provider (Bunq/Stripe) al pagamento, per la riconciliazione. */
export async function attachPaymentProviderRefs(
  paymentId: string,
  refs: { bunqRequestId?: number; bunqPaymentUrl?: string; stripePaymentLink?: string },
): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (refs.bunqRequestId != null) update.bunq_request_id = refs.bunqRequestId;
  if (refs.bunqPaymentUrl) update.bunq_payment_url = refs.bunqPaymentUrl;
  if (refs.stripePaymentLink) update.stripe_payment_link = refs.stripePaymentLink;
  await db().from("platform_payments").update(update).eq("id", paymentId);
}

/** Attiva l'abbonamento collegato a un contratto (path Stripe / conferma manuale). */
export async function activateSubscriptionByContract(contractId: string): Promise<boolean> {
  const { data: sub } = await db()
    .from("platform_subscriptions")
    .select("id")
    .eq("contract_id", contractId)
    .maybeSingle();
  if (!sub?.id) return false;
  await activateSubscription(sub.id);
  return true;
}

/**
 * Pagamento ricevuto → attiva l'abbonamento e il tenant sul dominio indicato.
 * Marca pagato il pagamento `pending` collegato, calcola il prossimo rinnovo.
 */
export async function activateSubscription(subscriptionId: string): Promise<void> {
  const { data: sub, error } = await db()
    .from("platform_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!sub) throw new Error("subscription_not_found");

  const now = new Date().toISOString();
  const start = todayISO();
  const periodEnd = addCycle(start, sub.billing_cycle as BillingCycle);

  await db()
    .from("platform_subscriptions")
    .update({
      status: "active",
      activated_at: sub.activated_at ?? now,
      current_period_start: start,
      current_period_end: periodEnd,
      next_renewal_at: periodEnd,
      grace_until: null,
      suspended_at: null,
      updated_at: now,
    })
    .eq("id", subscriptionId);

  // Marca pagato il pagamento pending più recente dell'abbonamento.
  await db()
    .from("platform_payments")
    .update({ status: "paid", paid_at: now, payment_date: start, updated_at: now })
    .eq("subscription_id", subscriptionId)
    .eq("status", "pending");

  await activateTenant(sub.tenant_id as string | null, sub.lead_id as string | null);
}

/** Attiva il tenant sul dominio indicato e segna il lead come convertito/attivo. */
async function activateTenant(
  tenantId: string | null,
  leadId: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  if (tenantId) {
    await db()
      .from("tenants")
      .update({ enabled: true, status: "active", updated_at: now })
      .eq("id", tenantId);
  }
  if (leadId) {
    await db()
      .from("platform_leads")
      .update({
        status: "active",
        stage: "tenant",
        official_domain_active: true,
        converted_at: now,
        updated_at: now,
      })
      .eq("id", leadId);
  }
}

/**
 * Genera il pagamento di rinnovo `pending` e sposta in avanti il periodo.
 * Restituisce l'id del pagamento creato (il chiamante invia link/sollecito).
 */
export async function createRenewalPayment(
  subscriptionId: string,
): Promise<{ paymentId: string; amount: number } | null> {
  const { data: sub, error } = await db()
    .from("platform_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!sub) return null;

  const amount = Number(sub.price_override ?? 0);
  const renewalDate = (sub.next_renewal_at as string | null) ?? todayISO();
  const grace = addDays(renewalDate, PAYMENT_GRACE_DAYS);

  const { data: pay, error: payErr } = await db()
    .from("platform_payments")
    .insert({
      subscription_id: subscriptionId,
      lead_id: sub.lead_id,
      amount,
      currency: "EUR",
      status: "pending",
      kind: "renewal",
      payment_method: sub.payment_method,
      payment_provider: providerForMethod(String(sub.payment_method ?? "")),
      due_date: grace,
    })
    .select("id")
    .single();
  if (payErr) throw new Error(payErr.message);

  await db()
    .from("platform_subscriptions")
    .update({
      current_period_start: renewalDate,
      current_period_end: addCycle(renewalDate, sub.billing_cycle as BillingCycle),
      next_renewal_at: addCycle(renewalDate, sub.billing_cycle as BillingCycle),
      grace_until: grace,
      last_reminder_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  return { paymentId: pay.id, amount };
}

/**
 * Pagamento non arrivato entro i 15gg → sospende abbonamento e mette offline il tenant.
 * Stato cliente recuperabile: a pagamento ricevuto torna `active`. Lead → `suspended`.
 */
export async function suspendSubscription(subscriptionId: string): Promise<void> {
  const { data: sub } = await db()
    .from("platform_subscriptions")
    .select("tenant_id, lead_id")
    .eq("id", subscriptionId)
    .maybeSingle();

  const now = new Date().toISOString();
  await db()
    .from("platform_subscriptions")
    .update({ status: "suspended", suspended_at: now, updated_at: now })
    .eq("id", subscriptionId);

  if (sub?.tenant_id) {
    await db()
      .from("tenants")
      .update({ enabled: false, status: "suspended", updated_at: now })
      .eq("id", sub.tenant_id);
  }
  if (sub?.lead_id) {
    await db()
      .from("platform_leads")
      .update({ status: "suspended", updated_at: now })
      .eq("id", sub.lead_id);
  }
}

/**
 * Recesso del cliente → abbonamento `cancelled`, pagamenti pendenti annullati.
 * Tenant e lead restano attivi fino alla scadenza del periodo pagato (gestita dal cron).
 * Distinto da `lost` (potenziale mai convertito): churned è un ex cliente.
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason?: string,
): Promise<void> {
  const { data: sub } = await db()
    .from("platform_subscriptions")
    .select("tenant_id, lead_id, notes")
    .eq("id", subscriptionId)
    .maybeSingle();

  const now = new Date().toISOString();
  await db()
    .from("platform_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: now,
      grace_until: null,
      notes: reason ? `${sub?.notes ?? ""}\nRecesso: ${reason}`.trim() : sub?.notes,
      updated_at: now,
    })
    .eq("id", subscriptionId);

  await db()
    .from("platform_payments")
    .update({
      status: "failed",
      notes: `Annullato per recesso contratto (${now.slice(0, 10)})`,
      updated_at: now,
    })
    .eq("subscription_id", subscriptionId)
    .eq("status", "pending");

  // Tenant e lead restano attivi fino alla scadenza del periodo pagato
  // (next_renewal_at). La messa offline è gestita dal cron giornaliero.
}

export async function getSubscriptionByContract(
  contractId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> {
  const { data } = await db()
    .from("platform_subscriptions")
    .select("*")
    .eq("contract_id", contractId)
    .maybeSingle();
  return data ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listSubscriptions(): Promise<any[]> {
  const { data, error } = await db()
    .from("platform_subscriptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
