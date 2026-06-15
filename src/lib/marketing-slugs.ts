import { type AppLocale, DEFAULT_LOCALE } from "@/i18n/locales";

/**
 * Slug URL adattati per lingua sui siti marketing (menuary/bizery/orpheo).
 *
 * La "chiave" di una route coincide con il segmento del path interno italiano
 * (`chi-siamo`, `pricing`, `contatti`; `""` = home), che resta l'identità usata
 * dal dispatcher per modalità. Ogni lingua espone però uno slug pubblico proprio
 * (`/de/ueber-uns`, `/fr/tarifs`, …) per massimizzare la SEO locale.
 *
 * Tutti gli slug sono ASCII url-safe. Le lingue non mappate ricadono sullo slug
 * italiano (chiave): l'URL resta valido anche se la traduzione del segmento non
 * è ancora definita.
 */
export type MarketingRouteKey = "" | "chi-siamo" | "pricing" | "contatti";

export const MARKETING_ROUTE_KEYS: readonly MarketingRouteKey[] = [
  "",
  "chi-siamo",
  "pricing",
  "contatti",
];

const SLUGS: Record<Exclude<MarketingRouteKey, "">, Partial<Record<AppLocale, string>>> = {
  "chi-siamo": {
    en: "about",
    fr: "a-propos",
    es: "quienes-somos",
    de: "ueber-uns",
    pt: "sobre-nos",
    nl: "over-ons",
    da: "om-os",
    sv: "om-oss",
    nb: "om-oss",
    fi: "tietoa",
    pl: "o-nas",
    cs: "o-nas",
    sl: "o-nas",
    hr: "o-nama",
    sq: "rreth-nesh",
    el: "poioi-eimaste",
  },
  pricing: {
    fr: "tarifs",
    es: "precios",
    de: "preise",
    pt: "precos",
    nl: "prijzen",
    da: "priser",
    sv: "priser",
    nb: "priser",
    fi: "hinnat",
    pl: "cennik",
    cs: "cenik",
    sl: "cenik",
    hr: "cijene",
    sq: "cmimet",
    el: "times",
  },
  contatti: {
    en: "contact",
    fr: "contact",
    es: "contacto",
    de: "kontakt",
    pt: "contato",
    nl: "contact",
    da: "kontakt",
    sv: "kontakt",
    nb: "kontakt",
    fi: "yhteystiedot",
    pl: "kontakt",
    cs: "kontakt",
    sl: "kontakt",
    hr: "kontakt",
    sq: "kontakt",
    el: "epikoinonia",
  },
};

function isRouteKey(value: string): value is MarketingRouteKey {
  return (MARKETING_ROUTE_KEYS as readonly string[]).includes(value);
}

/** Slug pubblico per (route, lingua). `""` per la home, slug italiano come fallback. */
export function localizedSlug(key: MarketingRouteKey, locale: AppLocale): string {
  if (key === "") return "";
  if (locale === DEFAULT_LOCALE) return key;
  return SLUGS[key]?.[locale] ?? key;
}

/** Segmento localizzato a partire dal path interno italiano (es. `/chi-siamo`). */
export function localizedSegmentForPath(path: string, locale: AppLocale): string {
  const key = path.replace(/^\//, "");
  if (key === "") return "";
  return isRouteKey(key) ? localizedSlug(key, locale) : key;
}

/**
 * Inverso: dato il primo segmento pubblico sotto una lingua (`ueber-uns`),
 * restituisce la chiave route interna (`chi-siamo`), o `null` se non riconosciuto.
 */
export function resolveLocalizedSegment(locale: AppLocale, segment: string): MarketingRouteKey | null {
  for (const key of MARKETING_ROUTE_KEYS) {
    if (key === "") continue;
    if (localizedSlug(key, locale) === segment) return key;
  }
  return null;
}

export { isRouteKey as isMarketingRouteKey };
