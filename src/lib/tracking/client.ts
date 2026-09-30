"use client";

import { track as vercelTrack } from "@vercel/analytics";
import {
  ATTRIBUTION_KEYS,
  type Attribution,
  type ConversionName,
  type ConversionParams,
  type TrackingConfig,
} from "./types";

// ─── Consenso ────────────────────────────────────────────────────────────────

export type ConsentState = { analytics: boolean; ads: boolean; at: string };

const CONSENT_VERSION = 1;
const CONSENT_EVENT = "mn:consent-change";
const OPEN_PREFERENCES_EVENT = "mn:consent-open";

function consentKey(siteKey: string) {
  return `mn_consent_v${CONSENT_VERSION}:${siteKey}`;
}

export function readConsent(siteKey: string): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(consentKey(siteKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.ads !== "boolean") return null;
    return { analytics: parsed.analytics, ads: parsed.ads, at: String(parsed.at ?? "") };
  } catch {
    return null;
  }
}

export function writeConsent(siteKey: string, consent: Omit<ConsentState, "at">) {
  const value: ConsentState = { ...consent, at: new Date().toISOString() };
  try {
    window.localStorage.setItem(consentKey(siteKey), JSON.stringify(value));
  } catch {
    // Storage bloccato: la scelta vale solo per questa pagina.
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: value }));
}

export function onConsentChange(handler: (consent: ConsentState) => void) {
  const listener = (event: Event) => handler((event as CustomEvent<ConsentState>).detail);
  window.addEventListener(CONSENT_EVENT, listener);
  return () => window.removeEventListener(CONSENT_EVENT, listener);
}

/** Riapre il banner: da collegare al link "Preferenze cookie" nei footer. */
export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
}

export function onOpenConsentPreferences(handler: () => void) {
  window.addEventListener(OPEN_PREFERENCES_EVENT, handler);
  return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, handler);
}

// ─── Attribuzione ────────────────────────────────────────────────────────────
// sessionStorage di prima parte, mai condiviso con terzi: serve solo ad allegare
// la fonte della visita alla richiesta che il visitatore invia. Scade con la
// sessione del browser, quindi non serve consenso preventivo.

const ATTRIBUTION_STORAGE = "mn_attribution";

export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl: Attribution = {};
    for (const key of ATTRIBUTION_KEYS) {
      const value = params.get(key)?.trim();
      if (value) fromUrl[key] = value.slice(0, 200);
    }
    const hasCampaign = Object.keys(fromUrl).length > 0;
    const existing = window.sessionStorage.getItem(ATTRIBUTION_STORAGE);
    // Una nuova campagna sovrascrive; una navigazione interna no.
    if (existing && !hasCampaign) return;

    const referrer = document.referrer && !document.referrer.startsWith(window.location.origin)
      ? document.referrer.slice(0, 300)
      : undefined;
    const value: Attribution = {
      ...fromUrl,
      referrer,
      landing_path: window.location.pathname.slice(0, 200),
      captured_at: new Date().toISOString(),
    };
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE, JSON.stringify(value));
  } catch {
    // sessionStorage non disponibile: la richiesta partirà senza attribuzione.
  }
}

export function getAttribution(): Attribution | null {
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

// ─── Eventi ──────────────────────────────────────────────────────────────────

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
    __mnTracking?: { config: TrackingConfig; consent: ConsentState | null };
  }
}

const META_EVENT: Record<ConversionName, string> = {
  lead: "Lead",
  booking: "Schedule",
  order: "Purchase",
  contact: "Contact",
};

const GA4_EVENT: Record<ConversionName, string> = {
  lead: "generate_lead",
  booking: "booking_request",
  order: "purchase",
  contact: "contact",
};

/**
 * Registra una conversione su tutti i canali attivi del sito corrente.
 * Sicura da chiamare ovunque: senza config o senza consenso invia solo
 * l'evento anonimo di Vercel Analytics (senza cookie).
 */
export function trackConversion(name: ConversionName, params: ConversionParams = {}) {
  if (typeof window === "undefined") return;

  const attribution = getAttribution();
  try {
    vercelTrack(`conversion_${name}`, {
      label: params.label ?? null,
      source: attribution?.utm_source ?? (attribution?.gclid ? "google" : attribution?.fbclid ? "meta" : null),
      campaign: attribution?.utm_campaign ?? null,
    });
  } catch {
    // Analytics non caricato (es. sviluppo locale).
  }

  const state = window.__mnTracking;
  if (!state) return;
  const { config, consent } = state;

  if (consent?.analytics && config.ga4Id && window.gtag) {
    window.gtag("event", GA4_EVENT[name], {
      send_to: config.ga4Id,
      value: params.value,
      currency: params.currency,
      transaction_id: params.transactionId,
      event_label: params.label,
    });
  }

  const adsLabel = config.googleAdsLabels?.[name];
  if (consent?.ads && config.googleAdsId && adsLabel && window.gtag) {
    window.gtag("event", "conversion", {
      send_to: `${config.googleAdsId}/${adsLabel}`,
      value: params.value,
      currency: params.currency,
      transaction_id: params.transactionId,
    });
  }

  if (consent?.ads && config.metaPixelId && window.fbq) {
    window.fbq(
      "track",
      META_EVENT[name],
      { value: params.value, currency: params.currency, content_name: params.label },
      params.transactionId ? { eventID: `${name}:${params.transactionId}` } : undefined,
    );
  }
}
