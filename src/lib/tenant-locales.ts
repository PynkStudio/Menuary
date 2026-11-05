export const TENANT_LOCALE_COOKIE_PREFIX = "TENANT_LOCALE_";

export type TenantLocaleConfig = {
  defaultLocale: string;
  locales: readonly string[];
};

const TENANT_LOCALES: Record<string, TenantLocaleConfig> = {
  // Copy completi in entrambe le lingue in src/lib/casabramanti-i18n.ts: la
  // maison vende in Europa, l'inglese è pubblicato dal primo rilascio.
  casabramanti: {
    defaultLocale: "it",
    locales: ["it", "en"],
  },
  // Predisposto per multilingua: pubblicare nuove lingue solo con copy completi.
  "cascina-errante": {
    defaultLocale: "it",
    locales: ["it"],
  },
  doca: {
    defaultLocale: "it",
    locales: ["it", "pt", "en"],
  },
  // Predisposto per l'inglese: aggiungere "en" qui (e i copy in pynkstudio-i18n.ts)
  // quando la traduzione è pronta. Non pubblicare varianti URL senza contenuti.
  // Il Beta program ha già la sua variante /beta/en, gestita a parte (beta-i18n.ts).
  pynkstudio: {
    defaultLocale: "it",
    locales: ["it"],
  },
  // Predisposto per l'inglese: la trilogia ha già un titolo internazionale
  // ("The Emotion Dragons Trilogy"), ma pubblicare la lingua richiede copy
  // completi sul sito e nella newsletter, non solo il titolo tradotto.
  "valentina-orciuoli": {
    defaultLocale: "it",
    locales: ["it"],
  },
};

export function getTenantLocaleConfig(tenantId: string) {
  return TENANT_LOCALES[tenantId] ?? null;
}

export function tenantLocaleCookieName(tenantId: string) {
  return `${TENANT_LOCALE_COOKIE_PREFIX}${tenantId.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

export function matchTenantLocale(
  language: string | null | undefined,
  locales: readonly string[],
) {
  if (!language) return null;
  const normalized = language.trim().toLowerCase().replace("_", "-");
  return (
    locales.find((locale) => locale.toLowerCase() === normalized) ??
    locales.find((locale) => locale.toLowerCase() === normalized.split("-")[0]) ??
    null
  );
}

export function detectTenantLocaleFromAcceptLanguage(
  acceptLanguage: string | null,
  config: TenantLocaleConfig,
) {
  if (!acceptLanguage) return config.defaultLocale;
  for (const part of acceptLanguage.split(",")) {
    const locale = matchTenantLocale(part.split(";")[0], config.locales);
    if (locale) return locale;
  }
  return config.defaultLocale;
}
