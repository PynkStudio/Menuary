/**
 * Tracciamento marketing condiviso da tutti i siti pubblici della piattaforma:
 * marketing (menuary.it, bizery.it, weuseorpheo.com) e siti dei tenant.
 *
 * Gli ID sono pubblici per natura (finiscono nel browser), quindi viaggiano
 * come props dal server al client. Nessuno script di terze parti parte senza
 * consenso esplicito: se un sito non ha ID configurati non mostra nemmeno il
 * banner.
 */
export type TrackingConfig = {
  /** Chiave stabile del sito, usata per separare il consenso tra siti diversi sullo stesso browser. */
  siteKey: string;
  /** GA4 measurement ID, es. G-XXXXXXX */
  ga4Id?: string;
  /** Google Ads conversion ID, es. AW-123456789 */
  googleAdsId?: string;
  /** Label delle conversioni Google Ads per evento (es. { lead: "AbCdEf" }). */
  googleAdsLabels?: Partial<Record<ConversionName, string>>;
  /** Meta (Facebook/Instagram) pixel ID */
  metaPixelId?: string;
  /** Path dell'informativa cookie, linkata dal banner. */
  cookiePolicyHref?: string;
};

/**
 * Conversioni standard della piattaforma. Nomi uguali per tutti i siti, così i
 * report sono confrontabili:
 * - lead: richiesta commerciale (form contatti, preventivo)
 * - booking: prenotazione/appuntamento inviato
 * - order: ordine confermato
 * - contact: click su telefono, WhatsApp o email
 */
export type ConversionName = "lead" | "booking" | "order" | "contact";

export type ConversionParams = {
  value?: number;
  currency?: string;
  transactionId?: string;
  /** Dettaglio libero (es. "whatsapp", "phone", "plan:prenotazioni"). */
  label?: string;
};

/** Parametri di attribuzione letti dall'URL di atterraggio. */
export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  msclkid?: string;
  referrer?: string;
  landing_path?: string;
  captured_at?: string;
};

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
] as const;

export function hasThirdPartyTracking(config: TrackingConfig | null | undefined): boolean {
  return Boolean(config && (config.ga4Id || config.googleAdsId || config.metaPixelId));
}
