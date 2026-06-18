// ─── Vertical ────────────────────────────────────────────────────────────────
// Ogni tenant appartiene a un "ramo verticale" della piattaforma.
// Il ramo determina il sito marketing di riferimento, il copy dei moduli
// e le pagine di default.
//
// "food"     → ristoranti, pizzerie, bar, trattorie  (menuary.it)
// "services" → studi professionali, saloni, centri benessere, ecc. (bizery.it)
// "creative" → artisti, autori, musicisti, attori, registi, professionisti creativi (weuseorpheo.com)
//
// Aggiungere nuovi vertical: estendere questo tipo + aggiungere entry in
// VERTICAL_REGISTRY (src/lib/vertical.ts) + creare marketing pages in
// src/components/[nome-vertical]/pages/.
export type TenantVertical = "food" | "services" | "creative";

// ─── Status ───────────────────────────────────────────────────────────────────
// Governa il ciclo di vita del tenant sulla piattaforma e determina
// quali job automatici vengono eseguiti (es. sync Google Reviews).
//
// "active"     → tenant in produzione: sync ogni 30 giorni
// "trial"      → tenant in prova: solo il primo sync di popolamento, poi stop
// "offline"    → tenant disattivato: nessun job automatico eseguito
// "trattativa" → prospect in fase commerciale: demo disponibile, nessun job automatico
export type TenantStatus = "active" | "trial" | "offline" | "trattativa" | "suspended";

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
  cashRegister: boolean;
  inventoryFoodCost: boolean;
  printStations: boolean;
  staffRoles: boolean;
  multiLocation: boolean;
  favorites: boolean;
  reviews: boolean;
  gallery: boolean;
  shop: boolean;
  slabbby: boolean;
  /** Assistente vocale Retell AI per chiamate inbound: ordini, prenotazioni/appuntamenti e richieste informative. */
  aiPhone: boolean;
  /** Assistente WhatsApp AI per inbound via WhatsApp Web/Business: ordini, delivery, prenotazioni e pagamenti. */
  aiWhatsapp: boolean;
  /** Integrazione HubRise: push menu verso piattaforme aggregate (Deliveroo, JustEat, Glovo, Uber Eats…) e ricezione ordini via webhook. */
  hubriseSync: boolean;
  /** Pagamenti Stripe Connect (Standard): ogni tenant collega il proprio account Stripe per incassare autonomamente. Application fee piattaforma 0% per dine-in/online, 3% per ordini AI (Retell/WhatsApp). */
  payments: boolean;
  /** Casella mail interna tenant nel pannello gestione. */
  mail?: boolean;
  /** Blog editoriale: articoli, media, blocchi contenuto e commenti semplici moderati. */
  blog?: boolean;
  /** Press kit pubblico: bio, foto ufficiali, contatti media/booking e materiali scaricabili. */
  pressKit?: boolean;
  /** Catalogo opere: libri, brani, album, filmografia, spettacoli, crediti e asset collegati. */
  worksCatalog?: boolean;
  /** Booking creativo: eventi, concerti, firmacopie, casting, festival, shooting e tournée. */
  creativeBooking?: boolean;
  /** Diritti e royalty: licenze, territori, contratti, rendicontazioni e scadenze. */
  rightsRoyalties?: boolean;
  /** Reputation creativa: recensioni Amazon/Goodreads/IMDb/Letterboxd/provider e sentiment. */
  reputationReviews?: boolean;
  /** Fanbase e community: newsletter, segmenti, contenuti esclusivi e campagne audience. */
  fanbaseCommunity?: boolean;
  /** Linktree proprietario: pagina link pubblica e gestione autonoma dei link. */
  linktree?: boolean;
  /** Agenda call di consulenza (pynkstudio-specific): calendario prenotazioni call inbound da prenota-call. */
  pynkAgenda?: boolean;
  /** Vista patrimoniale aziendale: raccoglie gli introiti di tutti i verticali + attività diretta (pynkstudio-specific). */
  companyPatrimoniale?: boolean;
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
  /** Preferred routing form for multi-location tenants. Defaults to "both". */
  locationRouting?: LocationRoutingMode;
};

export type TenantFeatureKey = keyof TenantFeatureFlags;

// ─── Location routing ─────────────────────────────────────────────────────────
// "subdomain" → milano.tenant.it
// "path"      → tenant.it?loc=milano
// "both"      → subdomain preferred, query param accepted as fallback
export type LocationRoutingMode = "subdomain" | "path" | "both";

// ─── Location ─────────────────────────────────────────────────────────────────
// Represents a physical location (sede) of a tenant.
// Exists in DB for all tenants — single-location tenants always have exactly
// one row with is_default = true and never see any location-switching UI.
export type TenantLocation = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  hours?: unknown;
  isDefault: boolean;
  routingMode: LocationRoutingMode;
};
