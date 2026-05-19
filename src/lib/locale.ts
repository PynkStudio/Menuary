export type { AppLocale } from "@/i18n/locales";
export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isAppLocale,
} from "@/i18n/locales";

import { isAppLocale, DEFAULT_LOCALE, LOCALE_COOKIE } from "@/i18n/locales";
import type { AppLocale } from "@/i18n/locales";

export function readLocaleFromCookies(
  getCookie: (name: string) => string | undefined,
): AppLocale {
  const v = getCookie(LOCALE_COOKIE);
  return isAppLocale(v) ? v : DEFAULT_LOCALE;
}
