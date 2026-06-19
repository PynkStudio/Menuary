import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { ContractData } from "./menuary-contract";
import { leadUpdateFromContractData } from "./contract-lead-mapping";

export type ContractStatus =
  | "draft"
  | "sent"
  | "signed"
  | "countersigned"
  | "expired"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

export type PlatformContract = {
  id: string;
  numero: string;
  brand: string;
  status: ContractStatus;
  lead_id: string | null;
  package_slug: string | null;
  contract_data: ContractData;
  clause_overrides: Record<string, string>;
  documenso_envelope_id: string | null;
  documenso_item_id: string | null;
  signing_url: string | null;
  counterparty_signing_url: string | null;
  signed_at: string | null;
  signed_document_path: string | null;
  payment_method: string | null;
  payment_status: PaymentStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  tenant_id: string | null;
  tenant_activated_at: string | null;
  subscription_id: string | null;
  sent_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- platform_contracts not yet in generated types
function db(): any {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client;
}

export async function listContracts(): Promise<PlatformContract[]> {
  const { data, error } = await db()
    .from("platform_contracts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PlatformContract[];
}

export async function listContractsNeedingDocumensoSync(): Promise<PlatformContract[]> {
  const { data, error } = await db()
    .from("platform_contracts")
    .select("*")
    .in("status", ["sent", "signed"])
    .not("documenso_envelope_id", "is", null);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PlatformContract[];
}

export async function getContract(
  id: string,
): Promise<PlatformContract | null> {
  const { data, error } = await db()
    .from("platform_contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as PlatformContract) ?? null;
}

export async function getContractByEnvelopeId(
  envelopeId: string,
): Promise<PlatformContract | null> {
  const { data, error } = await db()
    .from("platform_contracts")
    .select("*")
    .eq("documenso_envelope_id", envelopeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as PlatformContract) ?? null;
}

export async function getContractByNumero(
  numero: string,
): Promise<PlatformContract | null> {
  const { data, error } = await db()
    .from("platform_contracts")
    .select("*")
    .eq("numero", numero)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as PlatformContract) ?? null;
}

export async function getCountersignedContractByTenant(
  tenantId: string,
): Promise<PlatformContract | null> {
  const { data, error } = await db()
    .from("platform_contracts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "countersigned")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as PlatformContract) ?? null;
}

export async function getContractByStripeSession(
  sessionId: string,
): Promise<PlatformContract | null> {
  const { data, error } = await db()
    .from("platform_contracts")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as PlatformContract) ?? null;
}

export async function createContract(input: {
  numero: string;
  brand: string;
  contract_data: ContractData;
  clause_overrides: Record<string, string>;
  lead_id: string | null;
  package_slug: string | null;
}): Promise<PlatformContract> {
  const { data, error } = await db()
    .from("platform_contracts")
    .insert({
      numero: input.numero,
      brand: input.brand,
      status: "draft",
      lead_id: input.lead_id,
      package_slug: input.package_slug,
      contract_data: input.contract_data as unknown as Record<string, unknown>,
      clause_overrides: input.clause_overrides as unknown as Record<
        string,
        unknown
      >,
      payment_method: input.contract_data.economiche.metodoPagamento,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as PlatformContract;
}

export async function syncLeadFromContractData(
  leadId: string | null | undefined,
  contractData: ContractData,
): Promise<void> {
  if (!leadId) return;
  const update = Object.fromEntries(
    Object.entries(leadUpdateFromContractData(contractData)).filter(
      ([, value]) => value !== undefined,
    ),
  );
  const { error } = await db()
    .from("platform_leads")
    .update(update)
    .eq("id", leadId);
  if (error) throw new Error(error.message);
}

export async function updateContract(
  id: string,
  updates: Partial<
    Pick<
      PlatformContract,
      | "numero"
      | "brand"
      | "status"
      | "contract_data"
      | "clause_overrides"
      | "lead_id"
      | "package_slug"
      | "documenso_envelope_id"
      | "documenso_item_id"
      | "signing_url"
      | "counterparty_signing_url"
      | "signed_at"
      | "signed_document_path"
      | "payment_method"
      | "payment_status"
      | "stripe_checkout_session_id"
      | "stripe_payment_intent_id"
      | "paid_at"
      | "tenant_id"
      | "tenant_activated_at"
      | "subscription_id"
      | "sent_at"
      | "expires_at"
    >
  >,
): Promise<PlatformContract> {
  const { data, error } = await db()
    .from("platform_contracts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      ...(updates.contract_data
        ? {
            contract_data:
              updates.contract_data as unknown as Record<string, unknown>,
          }
        : {}),
      ...(updates.clause_overrides
        ? {
            clause_overrides:
              updates.clause_overrides as unknown as Record<string, unknown>,
          }
        : {}),
    } as Record<string, unknown>)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as PlatformContract;
}

export async function deleteContractById(id: string): Promise<void> {
  const { error } = await db()
    .from("platform_contracts")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setContractCancelled(id: string): Promise<PlatformContract> {
  const { data, error } = await db()
    .from("platform_contracts")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as PlatformContract;
}
