import type {
  BillingCycle,
  PlatformSubscription,
  SubscriptionStatus,
} from "@/lib/platform-crm-types";
import type { StoredContract } from "./contracts-store";
import {
  computeFirstPaymentTotal,
  computeYearlyTotal,
} from "./menuary-contract";

const STORAGE_KEY = "menuary.contract.subscriptions.v1";

export type DerivedSubscription = PlatformSubscription & {
  source: "contract";
  contract_id: string;
  contract_number: string;
};

function read(): DerivedSubscription[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DerivedSubscription[]) : [];
  } catch {
    return [];
  }
}

function write(list: DerivedSubscription[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function listDerivedSubscriptions(): DerivedSubscription[] {
  return read();
}

export function upsertSubscriptionFromContract(c: StoredContract): DerivedSubscription {
  const list = read();
  const existing = list.find((s) => s.contract_id === c.id);
  const billing_cycle: BillingCycle = c.data.economiche.cicloFatturazione;
  const annuale = billing_cycle === "yearly";
  const priceOverride = annuale
    ? computeYearlyTotal(c.data.economiche.canoneMensile, c.data.economiche.scontoAnnuale)
    : c.data.economiche.canoneMensile;

  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = new Date(now);
  if (annuale) periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  const status: SubscriptionStatus = c.status === "countersigned" ? "active" : "trial";

  const sub: DerivedSubscription = {
    source: "contract",
    contract_id: c.id,
    contract_number: c.numero,
    id: existing?.id ?? `sub-from-${c.id}`,
    lead_id: c.leadId ?? "",
    package_id: c.packageSlug ?? "",
    billing_cycle,
    price_override: priceOverride,
    setup_amount: c.data.economiche.setup,
    first_payment_amount: computeFirstPaymentTotal(c.data.economiche),
    currency: "EUR",
    status,
    started_at: existing?.started_at ?? periodStart,
    trial_ends_at: null,
    current_period_start: periodStart,
    current_period_end: periodEnd.toISOString(),
    next_renewal_at: periodEnd.toISOString(),
    cancelled_at: null,
    notes: `Generato dal contratto ${c.numero}`,
    created_at: existing?.created_at ?? now.toISOString(),
    updated_at: now.toISOString(),
  };

  const next = existing
    ? list.map((s) => (s.contract_id === c.id ? sub : s))
    : [sub, ...list];
  write(next);
  return sub;
}

export function getSubscriptionByContract(contractId: string): DerivedSubscription | null {
  return read().find((s) => s.contract_id === contractId) ?? null;
}
