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

// ─── Status ───────────────────────────────────────────────────────────────────
// Governa il ciclo di vita del tenant sulla piattaforma e determina
// quali job automatici vengono eseguiti (es. sync Google Reviews).
//
// "active"  → tenant in produzione: sync ogni 30 giorni
// "trial"   → tenant in prova: solo il primo sync di popolamento, poi stop
// "offline" → tenant disattivato: nessun job automatico eseguito
export type TenantStatus = "active" | "trial" | "offline";

// ─── Google integration ───────────────────────────────────────────────────────
// Il Place ID e il resource name della location Google non sono hardcodati qui:
// vengono acquisiti dinamicamente quando il gestore collega il proprio account
// Google Business tramite OAuth dal pannello di gestione (gestione.menuary.it /
// gestione.bizery.it) e sono persistiti nella tabella `tenant_google_locations`.
export type TenantGoogleConfig = {
  /** Marker opzionale per indicare che il tenant ha già completato il linking Google. Usato solo come override manuale in casi eccezionali. */
  manualPlaceId?: string;
};

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
  // TODO(google-reserve): aggiungere flag `googleReserve: boolean` una volta approvati come partner Actions Center.
  // Abilita il pulsante "Prenota" direttamente su Google Maps/Search per il tenant.
  // Prerequisito: tenant deve avere `reservations: true` e una location Google collegata.
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
  status: TenantStatus;
  google?: TenantGoogleConfig;
  theme: TenantTheme;
  features: TenantFeatureFlags;
};

export type TenantFeatureKey = keyof TenantFeatureFlags;
