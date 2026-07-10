import type { TenantProfile } from "./tenant";
import type { TenantFeatureFlags } from "./tenant";
import { allTenantFeatures } from "./tenant-modules";

/** Tenant demo del verticale food (Menuary). Usato come fallback per host non riconosciuti sul verticale food. */
export const DEFAULT_FOOD_TENANT_ID = "bepork";

/** Tenant services usato come fallback tecnico per host Bizery non riconosciuti. */
export const DEFAULT_SERVICES_TENANT_ID = "officinakam";

/** Tenant creative usato come fallback tecnico per host Orpheo non riconosciuti. */
export const DEFAULT_CREATIVE_TENANT_ID = "orpheo-demo";

/** @deprecated Usa getDefaultTenantForVertical(). Mantenuto per compatibilità con import esistenti. */
export const DEFAULT_TENANT_ID = DEFAULT_FOOD_TENANT_ID;

/** ThePork: tenant demo food con tutti i moduli piattaforma attivi (nei limiti dell’implementazione). */
export const BEPORK_FULL_MODULE_FLAGS: TenantFeatureFlags = {
  ...allTenantFeatures(true),
  shop: false,
  slabbby: false,
  aiPhone: false,
  aiWhatsapp: true,
  hubriseSync: false,
  payments: false,
  pressKit: false,
  worksCatalog: false,
  creativeBooking: false,
  rightsRoyalties: false,
  reputationReviews: false,
  fanbaseCommunity: false,
};

/** Cascina Errante: ristorante demo Menuary con tutte le feature attive. */
export const CASCINA_ERRANTE_MODULE_FLAGS: TenantFeatureFlags = {
  ...allTenantFeatures(true),
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
  cashRegister: false,
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
  hubriseSync: false,
  payments: false,
};

/** Valentina Orciuoli: author site fantasy su verticale creative/Orpheo. */
export const VALENTINA_ORCIUOLI_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: false,
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: false,
  tablePlanner: false,
  productAvailability: false,
  upselling: false,
  crm: false,
  analytics: true,
  takeawaySlots: false,
  deliveryHub: false,
  cashRegister: false,
  inventoryFoodCost: false,
  printStations: false,
  staffRoles: false,
  multiLocation: false,
  favorites: false,
  reviews: false,
  gallery: true,
  shop: false,
  slabbby: false,
  aiPhone: false,
  aiWhatsapp: false,
  hubriseSync: false,
  payments: false,
  pressKit: true,
  worksCatalog: true,
  creativeBooking: false,
  rightsRoyalties: false,
  reputationReviews: false,
  fanbaseCommunity: true,
  linktree: true,
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
  cashRegister: false,
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
  hubriseSync: false,
  payments: false,
};

/** Doca: bakery brasiliana a Milano — pane, caffè, saudade. */
export const DOCA_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: true,
  takeaway: true,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: true,
  dinerSeparation: false,
  reservations: false,
  tablePlanner: false,
  productAvailability: true,
  upselling: false,
  crm: false,
  analytics: false,
  takeawaySlots: true,
  deliveryHub: false,
  cashRegister: false,
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
  hubriseSync: false,
  payments: false,
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
  cashRegister: false,
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
  hubriseSync: false,
  payments: false,
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
  cashRegister: false,
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
  hubriseSync: false,
  payments: false,
};

/** Pizzeria Kimos: lead Milano con menu, ordini diretti e assistenti AI su telefono e WhatsApp. */
export const KIMOS_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: true,
  takeaway: true,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: true,
  dinerSeparation: false,
  reservations: false,
  tablePlanner: false,
  productAvailability: true,
  upselling: true,
  crm: true,
  analytics: true,
  takeawaySlots: true,
  deliveryHub: true,
  cashRegister: false,
  inventoryFoodCost: false,
  printStations: true,
  staffRoles: false,
  multiLocation: false,
  favorites: true,
  reviews: true,
  gallery: true,
  shop: false,
  slabbby: false,
  aiPhone: true,
  aiWhatsapp: true,
  hubriseSync: false,
  payments: true,
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
  cashRegister: false,
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
  hubriseSync: false,
  payments: false,
};

/** PynkStudio: software house / agenzia digitale su verticale services. Sito multi-pagina con portfolio, consulenza e form contatti. */
export const PYNKSTUDIO_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: false,
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: false,
  tablePlanner: false,
  productAvailability: false,
  upselling: false,
  crm: true,
  analytics: true,
  takeawaySlots: false,
  deliveryHub: false,
  cashRegister: false,
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
  hubriseSync: false,
  payments: false,
  mail: true,
  pynkAgenda: true,
  companyPatrimoniale: true,
};

/** Orpheo: tenant tecnico/demo per il verticale creative. */
export const ORPHEO_MODULE_FLAGS: TenantFeatureFlags = {
  website: true,
  onlineMenu: false,
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: false,
  tablePlanner: false,
  productAvailability: false,
  upselling: false,
  crm: true,
  analytics: true,
  takeawaySlots: false,
  deliveryHub: false,
  cashRegister: false,
  inventoryFoodCost: false,
  printStations: false,
  staffRoles: true,
  multiLocation: false,
  favorites: false,
  reviews: true,
  gallery: true,
  shop: false,
  slabbby: false,
  aiPhone: false,
  aiWhatsapp: false,
  hubriseSync: false,
  payments: false,
  pressKit: true,
  worksCatalog: true,
  creativeBooking: true,
  rightsRoyalties: true,
  reputationReviews: true,
  fanbaseCommunity: true,
};

export const TENANTS: TenantProfile[] = [
  // ── Verticale food (menuary.it) ──────────────────────────────────────────
  {
    id: "bepork",
    name: "ThePork",
    label: "Demo · ThePork",
    vertical: "food",
    domains: ["localhost", "127.0.0.1"],
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
    features: {
      ...allTenantFeatures(true),
      shop: false,
      slabbby: false,
      aiPhone: false,
      aiWhatsapp: false,
      hubriseSync: false,
      payments: false,
      pressKit: false,
      worksCatalog: false,
      creativeBooking: false,
      rightsRoyalties: false,
      reputationReviews: false,
      fanbaseCommunity: false,
    },
  },
  {
    id: "cascina-errante",
    name: "Cascina Errante",
    label: "Demo · Cascina Errante",
    vertical: "food",
    domains: ["cascinaerrante.it", "www.cascinaerrante.it"],
    previewSlug: "cascina-errante",
    enabled: true,
    status: "active",
    theme: {
      red: "#F0783C",
      redDark: "#0F2F1E",
      peach: "#EFE3C2",
      cream: "#FFFFFF",
      ink: "#0F2F1E",
      brick: "#1C4A31",
      mustard: "#EFA950",
      mustardSoft: "#F4C985",
      green: "#32704D",
      pink: "#F0783C",
    },
    features: CASCINA_ERRANTE_MODULE_FLAGS,
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
      red: "#A7522A",        // terracotta del logo DOCA
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
      // Palette Nøm — riso, matcha, salmone, ginger, nori.
      // Allineata con src/styles/tenants/nom-sushi.css (--nom-*).
      red: "#C86D58",          // salmone (accent primario, CTA)
      redDark: "#8F473B",      // salmone scurissimo (hover)
      peach: "#FFFDF7",        // paper avorio
      cream: "#F8F4E9",        // sfondo riso
      ink: "#172820",          // verde-inchiostro profondo (testo)
      brick: "#101A16",        // nori scuro (hero, footer)
      mustard: "#D8BC80",      // ginger (badge caldi, prezzi sticker)
      mustardSoft: "#ECD9A8",
      green: "#6D8460",        // matcha (highlight verde foglia)
      pink: "#C86D58",         // salmone (riuso accent)
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
  {
    id: "kimos",
    name: "Pizzeria Kimos",
    label: "Lead · Pizzeria Kimos",
    vertical: "food",
    domains: [],
    previewSlug: "kimos",
    enabled: true,
    status: "trattativa",
    theme: {
      // Palette Kimos: menu stampato scuro, insegna rossa, giallo forno e verde kebab.
      red: "#C64335",
      redDark: "#8E2B26",
      peach: "#E9D8B6",
      cream: "#F4E9D3",
      ink: "#171512",
      brick: "#2B211C",
      mustard: "#E5B83B",
      mustardSoft: "#F1D98C",
      green: "#667A45",
      pink: "#B96756",
    },
    features: KIMOS_MODULE_FLAGS,
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
  {
    id: "valentina-orciuoli",
    name: "Valentina Orciuoli",
    label: "Lead · Valentina Orciuoli",
    vertical: "creative",
    domains: [],
    previewSlug: "valentina-orciuoli",
    enabled: true,
    status: "trattativa",
    theme: {
      red: "#A12B24",
      redDark: "#671713",
      peach: "#E8D7B2",
      cream: "#050506",
      ink: "#F7EEDC",
      brick: "#15100D",
      mustard: "#D7A944",
      mustardSoft: "#F1D17C",
      green: "#6E8B69",
      pink: "#B77968",
    },
    features: VALENTINA_ORCIUOLI_MODULE_FLAGS,
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

  {
    id: "pynkstudio",
    name: "PynkStudio",
    label: "Tenant · PynkStudio",
    vertical: "services",
    domains: [
      "pynkstudio.it",
      "www.pynkstudio.it",
      "pynkstudio.com",
      "www.pynkstudio.com",
      "pynkstudio.eu",
      "www.pynkstudio.eu",
    ],
    previewSlug: "pynkstudio",
    enabled: true,
    status: "active",
    theme: {
      // Palette Pynk: flamingo pink su fondo near-black, superfici plum.
      red: "#E94B97",        // pynk flamingo (primario, CTA)
      redDark: "#C22D74",    // pynk scuro (hover)
      peach: "#F0A8CC",      // pynk light (secondario)
      cream: "#0E0E11",      // sfondo near-black (brand dark-first)
      ink: "#FAFAFA",        // testo chiaro su fondo scuro
      brick: "#2B1B26",      // superficie plum (card)
      mustard: "#E94B97",    // alias accent
      mustardSoft: "#F4C2DC",
      green: "#3DD68C",
      pink: "#E94B97",
    },
    features: PYNKSTUDIO_MODULE_FLAGS,
  },

  // ── Verticale creative (Orpheo — weuseorpheo.com) ─────────────────────────
  {
    id: "orpheo-demo",
    name: "Orpheo Demo",
    label: "Demo · Orpheo",
    vertical: "creative",
    domains: [],
    previewSlug: "orpheo-demo",
    enabled: true,
    status: "trial",
    theme: {
      red: "#7C3AED",
      redDark: "#4C1D95",
      peach: "#F5D0FE",
      cream: "#FBFAF7",
      ink: "#17111F",
      brick: "#24162F",
      mustard: "#D6A84F",
      mustardSoft: "#F4DF9A",
      green: "#0F9F6E",
      pink: "#D9468F",
    },
    features: ORPHEO_MODULE_FLAGS,
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

export function findTenantByPrefixedHost(
  hostname: string,
  prefix: "gestione" | "ordini" | "cassa" | "kiosk" | "cucina" | "rider",
): TenantProfile | undefined {
  const normalized = hostname.toLowerCase().split(":")[0] ?? hostname;
  const hostPrefix = `${prefix}.`;
  if (!normalized.startsWith(hostPrefix)) return undefined;
  return findTenantByDomain(normalized.slice(hostPrefix.length));
}

export function findTenantByPreviewSlug(slug: string): TenantProfile | undefined {
  return TENANTS.find((tenant) => tenant.previewSlug === slug);
}

export function findTenantsByVertical(vertical: TenantProfile["vertical"]): TenantProfile[] {
  return TENANTS.filter((tenant) => tenant.vertical === vertical);
}

/** Restituisce il tenant demo appropriato per il verticale. Usare sempre questo come fallback al posto di getDefaultTenant(). */
export function getDefaultTenantForVertical(vertical: TenantProfile["vertical"]): TenantProfile {
  const id =
    vertical === "creative"
      ? DEFAULT_CREATIVE_TENANT_ID
      : vertical === "services"
        ? DEFAULT_SERVICES_TENANT_ID
        : DEFAULT_FOOD_TENANT_ID;
  return findTenantById(id) ?? findTenantsByVertical(vertical)[0] ?? TENANTS[0];
}

/** @deprecated Usa getDefaultTenantForVertical(vertical). Questo restituisce sempre il default food. */
export function getDefaultTenant(): TenantProfile {
  return getDefaultTenantForVertical("food");
}
