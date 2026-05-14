// ─── Vertical ────────────────────────────────────────────────────────────────
// Ogni tenant appartiene a un "ramo verticale" della piattaforma.
// Il ramo determina il sito marketing di riferimento, il copy dei moduli
// e le pagine di default.
//
// "food"     → ristoranti, pizzerie, bar, trattorie  (menuary.it)
// "services" → studi professionali, saloni, centri benessere, ecc. (TODO: dominio da definire)
//
// Aggiungere nuovi vertical: estendere questo tipo + aggiungere entry in
// VERTICAL_REGISTRY (src/lib/vertical.ts) + creare marketing pages in
// src/components/[nome-vertical]/pages/.
export type TenantVertical = "food" | "services";

// ─── Feature flags ────────────────────────────────────────────────────────────
export type TenantFeatureFlags = {
  website: boolean;
  onlineMenu: boolean;
  takeaway: boolean;
  tableOrders: boolean;
  orderKiosk: boolean;
  kitchenDisplay: boolean;
  dinerSeparation: boolean;
  reservations: boolean;
  tablePlanner: boolean;
  productAvailability: boolean;
  upselling: boolean;
  crm: boolean;
  analytics: boolean;
  takeawaySlots: boolean;
  deliveryHub: boolean;
  inventoryFoodCost: boolean;
  printStations: boolean;
  staffRoles: boolean;
  multiLocation: boolean;
  favorites: boolean;
  reviews: boolean;
  gallery: boolean;
};

// ─── Theme ────────────────────────────────────────────────────────────────────
export type TenantTheme = {
  red: string;
  redDark: string;
  peach: string;
  cream: string;
  ink: string;
  brick: string;
  mustard: string;
  mustardSoft: string;
  green: string;
  pink: string;
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export type TenantProfile = {
  id: string;
  name: string;
  label: string;
  vertical: TenantVertical;
  domains: string[];
  previewSlug?: string;
  enabled: boolean;
  theme: TenantTheme;
  features: TenantFeatureFlags;
};

export type TenantFeatureKey = keyof TenantFeatureFlags;
