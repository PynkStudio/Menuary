import type { TenantProfile } from "./tenant";
import type { TenantFeatureFlags } from "./tenant";
import { allTenantFeatures } from "./tenant-modules";

export const DEFAULT_TENANT_ID = "bepork";

/** Be Pork: stack demo/produzione con tutti i moduli piattaforma attivi (nei limiti dell’implementazione). */
export const BEPORK_FULL_MODULE_FLAGS: TenantFeatureFlags = allTenantFeatures(true);

/** Bizery demo: moduli appropriati per il verticale services (no food-specific). */
export const BIZERY_DEMO_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: true,       // "Listino servizi" nel verticale services
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: true,     // "Appuntamenti"
  tablePlanner: true,     // "Agenda e postazioni"
  productAvailability: true,
  upselling: true,        // "Servizi aggiuntivi"
  crm: true,
  analytics: true,
  takeawaySlots: true,    // "Slot disponibilità"
  deliveryHub: false,
  inventoryFoodCost: true, // "Costi e margini"
  printStations: false,
  staffRoles: true,
  multiLocation: true,
  favorites: true,
  reviews: true,
  gallery: true,
};

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

  // ── Verticale services (Bizery — bizery.it) ──────────────────────────────
  {
    id: "bizery-demo",
    name: "Bizery",
    label: "Demo · Bizery",
    vertical: "services",
    domains: ["bizery.it", "www.bizery.it", "bizery.localhost"],  // marketing site + demo preview
    previewSlug: "bizery-demo",
    enabled: true,
    theme: {
      red: "#2563EB",       // blu primario Bizery
      redDark: "#1D4ED8",
      peach: "#DBEAFE",
      cream: "#F0F5FF",
      ink: "#0F172A",
      brick: "#1E3A5F",
      mustard: "#F59E0B",
      mustardSoft: "#FCD34D",
      green: "#10B981",
      pink: "#8B5CF6",
    },
    features: BIZERY_DEMO_MODULE_FLAGS,
  },
  // Aggiungere qui i tenant Bizery reali quando attivati:
  // {
  //   id: "nome-azienda",
  //   name: "Nome Azienda",
  //   label: "Tenant · Nome Azienda",
  //   vertical: "services",
  //   domains: ["nomeazienda.it", "www.nomeazienda.it"],
  //   previewSlug: "nome-azienda-demo",
  //   enabled: true,
  //   theme: { ... },
  //   features: BIZERY_DEMO_MODULE_FLAGS,
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
