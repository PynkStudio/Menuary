const LOCALE_COOKIE = "NEXT_LOCALE";

export type AppLocale = "it" | "en";

export function readLocaleFromCookies(getCookie: (name: string) => string | undefined): AppLocale {
  const v = getCookie(LOCALE_COOKIE);
  return v === "en" ? "en" : "it";
}
