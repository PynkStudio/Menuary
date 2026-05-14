import type { TenantProfile } from "./tenant";
import type { TenantFeatureFlags } from "./tenant";
import { allTenantFeatures } from "./tenant-modules";

export const DEFAULT_TENANT_ID = "bepork";

/** Be Pork: stack demo/produzione con tutti i moduli piattaforma attivi (nei limiti dell’implementazione). */
export const BEPORK_FULL_MODULE_FLAGS: TenantFeatureFlags = allTenantFeatures(true);

export const TENANTS: TenantProfile[] = [
  // ── Verticale food (menuary.it) ──────────────────────────────────────────
  {
    id: "bepork",
    name: "Be Pork",
    label: "Tenant 1 · Be Pork",
    vertical: "food",
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
    features: BEPORK_FULL_MODULE_FLAGS,
  },
  {
    id: "faak",
    name: "FAAK",
    label: "Tenant 2 · FAAK",
    vertical: "food",
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

  // ── Verticale services (TODO: dominio marketing da definire) ─────────────
  // Aggiungere qui i tenant non ristorativi quando il verticale sarà pronto.
  // Esempio:
  // {
  //   id: "studio-rossi",
  //   name: "Studio Rossi",
  //   label: "Tenant · Studio Rossi",
  //   vertical: "services",
  //   domains: ["studiorossi.it", "www.studiorossi.it"],
  //   previewSlug: "studio-rossi-demo",
  //   enabled: true,
  //   theme: { ... },
  //   features: allTenantFeatures(true),
  // },
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

export function findTenantsByVertical(vertical: TenantProfile["vertical"]): TenantProfile[] {
  return TENANTS.filter((tenant) => tenant.vertical === vertical);
}

export function getDefaultTenant(): TenantProfile {
  return findTenantById(DEFAULT_TENANT_ID) ?? TENANTS[0];
}
