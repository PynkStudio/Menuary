import type { TenantProfile } from "./tenant";
import { allTenantFeatures } from "./tenant-modules";

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
    features: allTenantFeatures(true),
  },
  {
    id: "faak",
    name: "FAAK",
    label: "Tenant 2 · FAAK",
    domains: ["faak.menuary.local", "faak.menuary.localhost"],
    previewSlug: "faak-demo",
    enabled: true,
    theme: {
      red: "#CD562F",
      redDark: "#000000",
      peach: "#FFF263",
      cream: "#FFFFFF",
      ink: "#000000",
      brick: "#2E4560",
      mustard: "#FFF263",
      mustardSoft: "#FFF8A5",
      green: "#2E4560",
      pink: "#CD562F",
    },
    features: allTenantFeatures(true),
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
