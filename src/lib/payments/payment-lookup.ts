import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { FORNITORE } from "@/lib/contracts/menuary-contract";

export type PaymentLookupResult = {
  found: true;
  status: "pending" | "paid" | "failed";
  method: "bunq" | "carta" | "bonifico";
  amount: number;
  invoiceNumber: string | null;
  brand: "menuary" | "bizery" | "orpheo";
  actionUrl: string | null;
  bonificoDetails: {
    iban: string;
    intestatario: string;
    causale: string;
  } | null;
} | {
  found: false;
  status: "not_found";
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function lookupPaymentByContractRef(
  ref: string,
): Promise<PaymentLookupResult> {
  const db = createSupabaseServiceClient();
  if (!db) {
    return { found: false, status: "not_found" };
  }

  const contract = await findContractByRef(db, ref);
  if (contract) {
    return buildResultFromContract(db, contract);
  }

  const payment = await findPaymentById(db, ref);
  if (payment) {
    return buildResultFromPayment(db, payment);
  }

  return { found: false, status: "not_found" };
}

async function findContractByRef(
  db: ReturnType<typeof createSupabaseServiceClient>,
  ref: string,
): Promise<Record<string, unknown> | null> {
  if (!db) return null;

  if (UUID_RE.test(ref)) {
    const { data } = await db
      .from("platform_contracts")
      .select("id, numero, brand, subscription_id, contract_data")
      .eq("id", ref)
      .maybeSingle();
    if (data) return data as unknown as Record<string, unknown>;
  }

  const { data } = await db
    .from("platform_contracts")
    .select("id, numero, brand, subscription_id, contract_data")
    .eq("numero", ref)
    .maybeSingle();
  return (data ?? null) as unknown as Record<string, unknown> | null;
}

async function findPaymentById(
  db: ReturnType<typeof createSupabaseServiceClient>,
  ref: string,
): Promise<Record<string, unknown> | null> {
  if (!db || !UUID_RE.test(ref)) return null;
  const { data } = await db
    .from("platform_payments")
    .select("*")
    .eq("id", ref)
    .maybeSingle();
  return (data ?? null) as unknown as Record<string, unknown> | null;
}

async function buildResultFromContract(
  db: ReturnType<typeof createSupabaseServiceClient>,
  contract: Record<string, unknown>,
): Promise<PaymentLookupResult> {
  if (!db) return { found: false, status: "not_found" };

  const subscriptionId = contract.subscription_id as string | null;
  if (!subscriptionId) {
    return { found: false, status: "not_found" };
  }

  const { data: payments } = await db
    .from("platform_payments")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false })
    .limit(1);

  const payment = (payments as unknown as Record<string, unknown>[])?.[0] ?? null;
  if (!payment) {
    return { found: false, status: "not_found" };
  }

  return buildRow(contract, payment);
}

async function buildResultFromPayment(
  db: ReturnType<typeof createSupabaseServiceClient>,
  payment: Record<string, unknown>,
): Promise<PaymentLookupResult> {
  if (!db) return { found: false, status: "not_found" };

  const subscriptionId = payment.subscription_id as string | null;
  if (!subscriptionId) {
    return { found: false, status: "not_found" };
  }

  const { data: sub } = await db
    .from("platform_subscriptions")
    .select("contract_id")
    .eq("id", subscriptionId)
    .maybeSingle();
  const subData = sub as Record<string, unknown> | null;
  const contractId = subData?.contract_id as string | null;

  if (!contractId) {
    return { found: false, status: "not_found" };
  }

  const { data: contract } = await db
    .from("platform_contracts")
    .select("id, numero, brand, subscription_id, contract_data")
    .eq("id", contractId)
    .maybeSingle();
  const contractData = contract as unknown as Record<string, unknown> | null;
  if (!contractData) {
    return { found: false, status: "not_found" };
  }

  return buildRow(contractData, payment);
}

function buildRow(
  contract: Record<string, unknown>,
  payment: Record<string, unknown>,
): PaymentLookupResult {
  const brand = contract.brand as string;
  const pStatus = payment.status as string;
  const method = (payment.payment_method as string) ?? "bonifico";
  const amount = Number(payment.amount ?? 0);
  const invoiceNumber = (payment.invoice_number as string) ?? null;
  const bunqUrl = (payment.bunq_payment_url as string) ?? null;
  const stripeUrl = (payment.stripe_payment_link as string) ?? null;

  const typedBrand = brand === "orpheo" ? "orpheo" : brand === "bizery" ? "bizery" : "menuary";

  const actionUrl =
    method === "bunq" ? bunqUrl
    : method === "carta" ? stripeUrl
    : null;

  const cd = contract.contract_data as Record<string, unknown> | null;
  const cliente = cd?.cliente as Record<string, unknown> | null;
  const ragioneSociale = (cliente?.ragioneSociale as string) ?? "";

  const bonificoDetails = method === "bonifico" ? {
    iban: FORNITORE.iban,
    intestatario: FORNITORE.ragioneSociale,
    causale: `contratto ${invoiceNumber ?? contract.numero as string} - ${ragioneSociale}`.trim(),
  } : null;

  const status: "pending" | "paid" | "failed" =
    pStatus === "paid" ? "paid" : pStatus === "failed" ? "failed" : "pending";

  return {
    found: true,
    status,
    method: method === "carta" ? "carta" : method === "bunq" ? "bunq" : "bonifico",
    amount,
    invoiceNumber,
    brand: typedBrand,
    actionUrl,
    bonificoDetails,
  };
}
