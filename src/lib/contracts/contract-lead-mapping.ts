import type { PlatformLead, PlatformPackage } from "@/lib/platform-crm-types";
import {
  BRAND_INFO,
  DEFAULT_ORDER_COMMISSION_PCT,
  round2,
  type ContractBrand,
  type ContractData,
} from "./menuary-contract";

type ContractLead = Pick<
  PlatformLead,
  | "business_name"
  | "business_slug"
  | "business_vertical"
  | "contact_name"
  | "contact_email"
  | "contact_phone"
  | "address"
  | "city"
  | "province"
  | "postal_code"
  | "billing_name"
  | "billing_vat"
  | "billing_cf"
  | "billing_address"
  | "billing_city"
  | "billing_province"
  | "billing_postal_code"
  | "billing_sdi"
  | "billing_pec"
  | "official_domain"
  | "proposed_package_slug"
  | "proposed_addons"
  | "proposed_billing_cycle"
  | "proposed_setup_amount"
  | "proposed_recurring_amount"
>;

type ContractPackage = Pick<
  PlatformPackage,
  "name" | "price_monthly" | "setup_amount"
>;

export type LeadContractSyncUpdate = {
  business_slug?: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  billing_name: string | null;
  billing_vat: string | null;
  billing_cf: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_province: string | null;
  billing_postal_code: string | null;
  billing_sdi: string | null;
  billing_pec: string | null;
  official_domain?: string | null;
  updated_at: string;
};

function nullableText(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function contractBrandFromLeadVertical(
  vertical: PlatformLead["business_vertical"],
): ContractBrand {
  if (vertical === BRAND_INFO.orpheo.vertical) return "orpheo";
  if (vertical === BRAND_INFO.bizery.vertical) return "bizery";
  return "menuary";
}

export function contractClientFromLead(
  current: ContractData["cliente"],
  lead: ContractLead,
): ContractData["cliente"] {
  return {
    tipo: lead.billing_cf && !lead.billing_vat ? "individual" : current.tipo,
    ragioneSociale: lead.billing_name ?? lead.business_name,
    legaleRappresentante: lead.contact_name ?? "",
    piva: lead.billing_vat ?? "",
    cf: lead.billing_cf ?? "",
    sedeLegale: [
      lead.billing_address ?? lead.address,
      lead.billing_postal_code ?? lead.postal_code,
      lead.billing_city ?? lead.city,
      lead.billing_province ?? lead.province,
    ]
      .filter(Boolean)
      .join(", "),
    pec: lead.billing_pec ?? "",
    email: lead.contact_email ?? "",
    telefono: lead.contact_phone ?? "",
    sdi: lead.billing_sdi ?? "",
  };
}

export function applyLeadToContractData(
  current: ContractData,
  lead: ContractLead,
  proposedPackage?: ContractPackage,
): ContractData {
  const cycle = lead.proposed_billing_cycle ?? current.economiche.cicloFatturazione;
  const recurring = lead.proposed_recurring_amount;
  const canoneMensile =
    recurring != null
      ? cycle === "yearly"
        ? round2(recurring / 12)
        : recurring
      : proposedPackage?.price_monthly ?? current.economiche.canoneMensile;
  const setup =
    lead.proposed_setup_amount ??
    proposedPackage?.setup_amount ??
    current.economiche.setup;
  const proposedAddons = new Set(lead.proposed_addons ?? []);

  return {
    ...current,
    brand: contractBrandFromLeadVertical(lead.business_vertical),
    cliente: contractClientFromLead(current.cliente, lead),
    servizio: {
      ...current.servizio,
      tenantSlug: lead.business_slug ?? "",
      dominio: lead.official_domain ?? "",
      pianoNome: proposedPackage?.name ?? current.servizio.pianoNome,
      moduliIa: {
        ...current.servizio.moduliIa,
        telefono:
          proposedAddons.has("ai-phone") || current.servizio.moduliIa.telefono,
        whatsapp:
          proposedAddons.has("ai-whatsapp") || current.servizio.moduliIa.whatsapp,
      },
    },
    economiche: {
      ...current.economiche,
      cicloFatturazione: cycle,
      canoneMensile,
      setup,
      setupRate: [setup],
      commissioneOrdiniPct:
        proposedAddons.has("ai-phone") || proposedAddons.has("ai-whatsapp")
          ? DEFAULT_ORDER_COMMISSION_PCT
          : current.economiche.commissioneOrdiniPct,
      scontoAnnuale: recurring != null ? 0 : current.economiche.scontoAnnuale,
    },
  };
}

export function leadUpdateFromContractData(
  data: ContractData,
  now = new Date().toISOString(),
): LeadContractSyncUpdate {
  const addressParts = parseItalianLegalAddress(data.cliente.sedeLegale);
  return {
    business_slug: nullableText(data.servizio.tenantSlug) ?? undefined,
    contact_name: nullableText(data.cliente.legaleRappresentante),
    contact_email: nullableText(data.cliente.email)?.toLowerCase() ?? null,
    contact_phone: nullableText(data.cliente.telefono),
    billing_name: nullableText(data.cliente.ragioneSociale),
    billing_vat: nullableText(data.cliente.piva),
    billing_cf: nullableText(data.cliente.cf),
    billing_address: addressParts.address,
    billing_city: addressParts.city,
    billing_province: addressParts.province,
    billing_postal_code: addressParts.postalCode,
    billing_sdi: nullableText(data.cliente.sdi),
    billing_pec: nullableText(data.cliente.pec),
    official_domain: nullableText(data.servizio.dominio) ?? undefined,
    updated_at: now,
  };
}

function parseItalianLegalAddress(value: string): {
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
} {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const [address, second, third, fourth] = parts;
  const cityPart = third ?? second ?? "";
  const provincePart = fourth ?? "";
  const capMatch = cityPart.match(/\b\d{5}\b/);
  const provinceMatch =
    provincePart.match(/\b([A-Z]{2})\b/) ?? cityPart.match(/\(([A-Z]{2})\)/);

  return {
    address: nullableText(address ?? value),
    city: nullableText(cityPart.replace(/\b\d{5}\b/g, "").replace(/\([A-Z]{2}\)/g, "")),
    province: provinceMatch?.[1] ?? null,
    postalCode: capMatch?.[0] ?? null,
  };
}
