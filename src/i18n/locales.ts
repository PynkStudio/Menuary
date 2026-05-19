export const SUPPORTED_LOCALES = ["it", "en", "fr", "es", "de", "pt"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "it";
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_HEADER = "x-locale";

export function isAppLocale(v: unknown): v is AppLocale {
  return typeof v === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(v);
}

export function detectLocaleFromAcceptLanguage(header: string | null): AppLocale {
  if (!header) return DEFAULT_LOCALE;
  for (const part of header.split(",")) {
    const lang = part.split(";")[0].trim().toLowerCase().slice(0, 2);
    if (isAppLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}
