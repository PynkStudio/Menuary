/**
 * Registro delle landing verticali Menuary (`menuary.it/ristoranti/*`).
 *
 * Modulo dati puro: lo importano sia il middleware (routing/404) sia le
 * pagine, la sitemap e i link interni. I testi stanno in
 * `src/components/marketing/landings/landing-content.tsx`.
 *
 * Una landing o una sezione che promette una funzione va online solo quando la
 * funzione esiste davvero: `MENUARY_FEATURE_READY` è l'interruttore unico. Si
 * porta a `true` quando la voce corrispondente della bacheca in
 * `docs/03-features/landing-verticali-ristoranti.md` è ✅, non prima.
 */

export const MENUARY_FEATURE_READY = {
  /** Il titolare interroga e modifica il locale da WhatsApp (coperti, incasso, disponibilità piatti, fasce prenotazione). */
  ownerWhatsappAssistant: true,
  /** Chat IA sul menu per il cliente (QR, tablet, kiosk) collegata al carrello. */
  conversationalMenu: true,
  /** Il titolare indica cosa spingere e i suggerimenti IA ne tengono conto. */
  salesPriorities: false,
  /** Bozza IA della risposta a una recensione, approvata dal titolare prima della pubblicazione. */
  reviewReplyDrafts: false,
  /** L'assistente telefonico modifica o annulla una prenotazione esistente. */
  reservationChangesByPhone: false,
} as const;

export type MenuaryFeatureKey = keyof typeof MENUARY_FEATURE_READY;

export const MENUARY_LANDING_BASE = "/ristoranti";
/** Route interna Next su cui il middleware riscrive `/ristoranti/*` (vedi `handleMenuaryLanding`). */
export const MENUARY_LANDING_INTERNAL_BASE = "/soluzioni-ristoranti";

export type MenuaryLandingSlug =
  | "telefonate-prenotazioni-ai"
  | "self-order-ai"
  | "gestionale"
  | "whatsapp"
  | "menu-delivery"
  | "google-maps-recensioni";

type LandingEntry = {
  slug: MenuaryLandingSlug;
  /** Etichetta breve per link interni ed ecosistema. */
  label: string;
  /** Il problema in una riga, per le card di navigazione. */
  pain: string;
  /** Funzioni senza le quali la pagina non ha senso: tutte devono essere pronte. */
  requires: readonly MenuaryFeatureKey[];
};

export const MENUARY_LANDINGS: readonly LandingEntry[] = [
  {
    slug: "telefonate-prenotazioni-ai",
    label: "Telefonate e prenotazioni",
    pain: "Il telefono squilla nel pieno del servizio.",
    requires: [],
  },
  {
    slug: "self-order-ai",
    label: "Self ordering con IA",
    pain: "Il menu digitale mostra i piatti, ma non consiglia.",
    requires: ["conversationalMenu"],
  },
  {
    slug: "gestionale",
    label: "Gestionale unico",
    pain: "Cassa, ordini, prenotazioni e sito su software diversi.",
    requires: [],
  },
  {
    slug: "whatsapp",
    label: "Il ristorante su WhatsApp",
    pain: "Per sapere com'è andata devi aprire tre programmi.",
    requires: ["ownerWhatsappAssistant"],
  },
  {
    slug: "menu-delivery",
    label: "Menu e delivery sincronizzati",
    pain: "Lo stesso piatto da aggiornare su cinque canali.",
    requires: [],
  },
  {
    slug: "google-maps-recensioni",
    label: "Google Maps e recensioni",
    pain: "La scheda Google è un altro lavoro da fare.",
    requires: [],
  },
];

export function isFeatureReady(key: MenuaryFeatureKey): boolean {
  return MENUARY_FEATURE_READY[key];
}

export function findMenuaryLanding(slug: string): LandingEntry | null {
  return MENUARY_LANDINGS.find((landing) => landing.slug === slug) ?? null;
}

export function isMenuaryLandingPublished(slug: string): boolean {
  const landing = findMenuaryLanding(slug);
  return Boolean(landing && landing.requires.every(isFeatureReady));
}

export function publishedMenuaryLandings(): LandingEntry[] {
  return MENUARY_LANDINGS.filter((landing) => landing.requires.every(isFeatureReady));
}

export function menuaryLandingPath(slug: MenuaryLandingSlug): string {
  return `${MENUARY_LANDING_BASE}/${slug}`;
}

/**
 * Le landing non ancora pubblicabili restano visibili fuori dalla produzione
 * (locale, preview Vercel) per rivederle prima dell'accensione, sempre noindex.
 */
export function canPreviewUnpublishedLandings(): boolean {
  return process.env.VERCEL_ENV !== "production";
}
