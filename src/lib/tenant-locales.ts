export const TENANT_LOCALE_COOKIE_PREFIX = "TENANT_LOCALE_";

export type TenantLocaleConfig = {
  defaultLocale: string;
  locales: readonly string[];
};

const TENANT_LOCALES: Record<string, TenantLocaleConfig> = {
  doca: {
    defaultLocale: "it",
    locales: ["it", "pt", "en"],
  },
  // Predisposto per l'inglese: aggiungere "en" qui (e i copy in pynkstudio-i18n.ts)
  // quando la traduzione è pronta. Non pubblicare varianti URL senza contenuti.
  pynkstudio: {
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

