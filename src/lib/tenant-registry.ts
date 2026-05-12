import type { TenantProfile } from "./tenant";

export const DEFAULT_TENANT_ID = "bepork";

export const TENANTS: TenantProfile[] = [
  {
    id: "bepork",
    name: "Be Pork",
    label: "Tenant 1 · Be Pork",
    domains: ["bepork.it", "www.bepork.it", "localhost", "127.0.0.1"],
    previewSlug: "bepork-demo",
    enabled: true,
    theme: {
      red: "#B8332E",
      redDark: "#8E2420",
      peach: "#F4C89A",
      cream: "#FFF4E6",
      ink: "#141010",
      brick: "#3A2320",
      mustard: "#F5C518",
      mustardSoft: "#F7D04A",
      green: "#2EB840",
      pink: "#EC5B8D",
    },
    features: {
      takeaway: true,
      tableOrders: true,
      kitchenDisplay: true,
      dinerSeparation: false,
      favorites: true,
      reviews: true,
      gallery: true,
    },
  },
  {
    id: "faak",
    name: "FAAK",
    label: "Tenant 2 · FAAK",
    domains: ["faak.menuary.local"],
    previewSlug: "faak-demo",
    enabled: true,
    theme: {
      red: "#D54537",
      redDark: "#92291F",
      peach: "#F5D7A8",
      cream: "#FFF7E8",
      ink: "#151210",
      brick: "#4B2D25",
      mustard: "#F3C931",
      mustardSoft: "#F8DC69",
      green: "#6E8E3D",
      pink: "#D96A7A",
    },
    features: {
      takeaway: true,
      tableOrders: true,
      kitchenDisplay: true,
      dinerSeparation: false,
      favorites: true,
      reviews: true,
      gallery: true,
    },
  },
];

export function findTenantById(id: string): TenantProfile | undefined {
  return TENANTS.find((tenant) => tenant.id === id);
}

export function findTenantByDomain(hostname: string): TenantProfile | undefined {
  const normalized = hostname.toLowerCase().split(":")[0] ?? hostname;
  return TENANTS.find((tenant) =>
    tenant.domains.some((domain) => domain.toLowerCase() === normalized),
  );
}

export function findTenantByPreviewSlug(slug: string): TenantProfile | undefined {
  return TENANTS.find((tenant) => tenant.previewSlug === slug);
}

export function getDefaultTenant(): TenantProfile {
  return findTenantById(DEFAULT_TENANT_ID) ?? TENANTS[0];
}
