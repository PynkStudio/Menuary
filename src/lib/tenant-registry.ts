import type { TenantProfile } from "./tenant";
import type { TenantFeatureFlags } from "./tenant";
import { allTenantFeatures } from "./tenant-modules";

/** Tenant demo del verticale food (Menuary). Usato come fallback per host non riconosciuti sul verticale food. */
export const DEFAULT_FOOD_TENANT_ID = "bepork";

/** Tenant services usato come fallback tecnico per host Bizery non riconosciuti. */
export const DEFAULT_SERVICES_TENANT_ID = "officinakam";

/** @deprecated Usa getDefaultTenantForVertical(). Mantenuto per compatibilità con import esistenti. */
export const DEFAULT_TENANT_ID = DEFAULT_FOOD_TENANT_ID;

/** Be Pork: stack demo/produzione con tutti i moduli piattaforma attivi (nei limiti dell’implementazione). */
export const BEPORK_FULL_MODULE_FLAGS: TenantFeatureFlags = {
  ...allTenantFeatures(true),
  shop: false,
  slabbby: false,
  aiPhone: false,
  aiWhatsapp: false,
};

/** LibriTech: libreria tech/startup demo su verticale services. */
export const LIBRITECH_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: true,        // "Catalogo libri"
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: false,
  tablePlanner: false,
  productAvailability: true,
  upselling: false,
  crm: false,
  analytics: true,
  takeawaySlots: false,
  deliveryHub: false,
  inventoryFoodCost: false,
  printStations: false,
  staffRoles: false,
  multiLocation: false,
  favorites: true,
  reviews: true,
  gallery: false,
  shop: true,
  slabbby: true,
  aiPhone: false,
  aiWhatsapp: false,
};

/** Studio Legale Aranzulla: studio legale su verticale services. */
export const STUDIOARANZULLA_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: false,
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: true,      // "Richiesta consulenza"
  tablePlanner: false,
  productAvailability: false,
  upselling: false,
  crm: true,
  analytics: true,
  takeawaySlots: false,
  deliveryHub: false,
  inventoryFoodCost: false,
  printStations: false,
  staffRoles: false,
  multiLocation: false,
  favorites: false,
  reviews: true,
  gallery: false,
  shop: false,
  slabbby: false,
  aiPhone: false,
  aiWhatsapp: false,
};

/** Doca: bakery brasiliana a Milano — pane, caffè, saudade. */
export const DOCA_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: true,
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: true,
  tablePlanner: false,
  productAvailability: false,
  upselling: false,
  crm: false,
  analytics: false,
  takeawaySlots: false,
  deliveryHub: false,
  inventoryFoodCost: false,
  printStations: false,
  staffRoles: false,
  multiLocation: false,
  favorites: false,
  reviews: false,
  gallery: false,
  shop: false,
  slabbby: false,
  aiPhone: false,
  aiWhatsapp: false,
};

/** Nøm sushi: lead sushi/fusion AYCE a Genova con demo sito/menu pranzo+cena/prenotazioni. */
export const NOM_SUSHI_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: true,
  takeaway: true,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: true,
  tablePlanner: false,
  productAvailability: true,
  upselling: false,
  crm: false,
  analytics: true,
  takeawaySlots: true,
  deliveryHub: false,
  inventoryFoodCost: false,
  printStations: false,
  staffRoles: false,
  multiLocation: false,
  favorites: true,
  reviews: true,
  gallery: true,
  shop: false,
  slabbby: false,
  aiPhone: false,
  aiWhatsapp: false,
};

/** Junior Food: lead ristorante sudamericano a Bergamo con demo sito/menu/prenotazioni. */
export const JUNIOR_FOOD_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: true,
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: true,
  tablePlanner: false,
  productAvailability: false,
  upselling: false,
  crm: false,
  analytics: false,
  takeawaySlots: false,
  deliveryHub: false,
  inventoryFoodCost: false,
  printStations: false,
  staffRoles: false,
  multiLocation: false,
  favorites: true,
  reviews: true,
  gallery: true,
  shop: false,
  slabbby: false,
  aiPhone: false,
  aiWhatsapp: false,
};

/** Officina KAM: primo tenant reale Bizery — officina auto e moto. */
export const OFFICINAKAM_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: true,        // "Listino servizi"
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: false,     // "Appuntamenti" — non attivo per officinakam
  tablePlanner: false,     // "Agenda e postazioni" — non attivo per officinakam
  productAvailability: true,
  upselling: true,         // "Servizi aggiuntivi"
  crm: true,
  analytics: true,
  takeawaySlots: false,
  deliveryHub: false,
  inventoryFoodCost: true, // "Costi e margini"
  printStations: false,
  staffRoles: false,
  multiLocation: false,
  favorites: false,
  reviews: true,
  gallery: true,
  shop: false,
  slabbby: true,
  aiPhone: false,
  aiWhatsapp: false,
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
    status: "active",
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
    status: "trial",
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
    features: { ...allTenantFeatures(true), shop: false, slabbby: false, aiPhone: false, aiWhatsapp: false },
  },

  {
    id: "doca",
    name: "Doca",
    label: "Lead · Doca",
    vertical: "food",
    domains: [],
    previewSlug: "doca",
    enabled: true,
    status: "trattativa",
    theme: {
      // Palette ispirata al locale reale: legno, tonalità della terra,
      // illustrazioni brasiliane sobrie (no tropicale da cartolina).
      red: "#A85F3A",        // terracotta / mattone caldo
      redDark: "#7E4226",
      peach: "#EAD4B4",      // crema-sabbia
      cream: "#F6EDDD",      // sfondo carta calda
      ink: "#241B14",        // marrone scurissimo, non nero
      brick: "#3D2A1E",      // legno scuro
      mustard: "#D8A14A",    // ocra dorato (mais, guava cotta)
      mustardSoft: "#EBC785",
      green: "#5A6B3A",      // verde foglia ulivo, smorzato
      pink: "#C2554F",       // rosa-bruciato / accenti brasiliani
    },
    features: DOCA_MODULE_FLAGS,
  },
  {
    id: "nom-sushi",
    name: "Nøm sushi",
    label: "Lead · Nøm sushi",
    vertical: "food",
    domains: [],
    previewSlug: "nom-sushi",
    enabled: true,
    status: "trattativa",
    theme: {
      // Palette ispirata al logo acquerello: verde foglia + bruno scuro su crema/avorio
      red: "#5B7A3A",          // verde foglia profondo (accent primario)
      redDark: "#3F5527",      // verde scurissimo per hover
      peach: "#E8E2D0",        // crema-avorio
      cream: "#FBF8F1",        // sfondo carta naturale
      ink: "#2A1F18",          // bruno scuro inchiostro (testo)
      brick: "#1F1814",        // bruno-nero per superfici scure
      mustard: "#C9A961",      // ocra dorato (accenti caldi, dim sum)
      mustardSoft: "#E5D5A8",
      green: "#7BA05B",        // verde fresco (matcha, alghe wakame)
      pink: "#C56B5C",         // terracotta-rosso (accenti tartare/sashimi)
    },
    features: NOM_SUSHI_MODULE_FLAGS,
  },
  {
    id: "junior-food",
    name: "Junior Food",
    label: "Lead · Junior Food",
    vertical: "food",
    domains: [],
    previewSlug: "junior-food",
    enabled: true,
    status: "trattativa",
    theme: {
      red: "#FF1111",
      redDark: "#C90000",
      peach: "#F8EBCC",
      cream: "#FFFFFF",
      ink: "#111111",
      brick: "#3A2520",
      mustard: "#F8EBCC",
      mustardSoft: "#FFF5DD",
      green: "#336500",
      pink: "#E0C9C9",
    },
    features: JUNIOR_FOOD_MODULE_FLAGS,
  },

  // ── Verticale services (Bizery — bizery.it) ──────────────────────────────
  {
    id: "libritech",
    name: "LibriTech",
    label: "Demo · LibriTech",
    vertical: "services",
    domains: [],
    previewSlug: "libritech",
    enabled: true,
    status: "trial",
    theme: {
      red: "#6c47ff",
      redDark: "#5335cc",
      peach: "#ede9ff",
      cream: "#fafaf8",
      ink: "#1a1433",
      brick: "#2a2350",
      mustard: "#f5a524",
      mustardSoft: "#fdd976",
      green: "#22c55e",
      pink: "#e63946",
    },
    features: LIBRITECH_MODULE_FLAGS,
  },

  // ── Tenant Bizery reali ──────────────────────────────────────────────────────
  {
    id: "studioaranzulla",
    name: "Studio Legale Aranzulla",
    label: "Lead · Studio Legale Aranzulla",
    vertical: "services",
    domains: ["studiolegalearanzulla.it", "www.studiolegalearanzulla.it"],
    previewSlug: "studioaranzulla",
    enabled: true,
    status: "trattativa",
    theme: {
      red: "#9B7E46",       // gold primario (brand legale)
      redDark: "#7A6235",   // gold scuro
      peach: "#EDE8DE",     // warm cream accent
      cream: "#F8F6F1",     // sfondo off-white
      ink: "#1A1612",       // near-black con calore
      brick: "#1C2B4A",     // navy profondo per accenti
      mustard: "#9B7E46",   // alias gold
      mustardSoft: "#EDE8DE",
      green: "#2A5C3F",
      pink: "#8B2635",
    },
    features: STUDIOARANZULLA_MODULE_FLAGS,
  },
  {
    id: "officinakam",
    name: "Officina KAM",
    label: "Demo · Officina KAM",
    vertical: "services",
    domains: [],                    // nessun dominio proprio (solo preview slug)
    previewSlug: "officinakam",     // → demo.bizery.it/officinakam
    enabled: true,
    status: "trattativa",
    theme: {
      red: "#F97316",               // orange primario (brand officinakam)
      redDark: "#C2410C",           // orange scuro
      peach: "#FED7AA",             // warm light accent
      cream: "#0A0A0B",             // sfondo dark (invertito rispetto ai tenant food)
      ink: "#F8FAFC",               // testo chiaro su sfondo dark
      brick: "#18181B",             // surface dark (cards, sezioni alternate)
      mustard: "#F97316",           // accent secondario (uguale a red per coerenza brand)
      mustardSoft: "#FEF3C7",       // soft warm per badge
      green: "#22C55E",
      pink: "#A855F7",
    },
    features: OFFICINAKAM_MODULE_FLAGS,
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

export function findTenantByManagementHost(hostname: string): TenantProfile | undefined {
  const normalized = hostname.toLowerCase().split(":")[0] ?? hostname;
  const prefix = "gestione.";
  if (!normalized.startsWith(prefix)) return undefined;
  const tenantDomain = normalized.slice(prefix.length);
  return findTenantByDomain(tenantDomain);
}

export function findTenantByPreviewSlug(slug: string): TenantProfile | undefined {
  return TENANTS.find((tenant) => tenant.previewSlug === slug);
}

export function findTenantsByVertical(vertical: TenantProfile["vertical"]): TenantProfile[] {
  return TENANTS.filter((tenant) => tenant.vertical === vertical);
}

/** Restituisce il tenant demo appropriato per il verticale. Usare sempre questo come fallback al posto di getDefaultTenant(). */
export function getDefaultTenantForVertical(vertical: TenantProfile["vertical"]): TenantProfile {
  const id = vertical === "services" ? DEFAULT_SERVICES_TENANT_ID : DEFAULT_FOOD_TENANT_ID;
  return findTenantById(id) ?? findTenantsByVertical(vertical)[0] ?? TENANTS[0];
}

/** @deprecated Usa getDefaultTenantForVertical(vertical). Questo restituisce sempre il default food (BePork). */
export function getDefaultTenant(): TenantProfile {
  return getDefaultTenantForVertical("food");
}
