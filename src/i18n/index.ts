import { headers } from "next/headers";
import { type AppLocale, isAppLocale, DEFAULT_LOCALE, LOCALE_HEADER } from "./locales";
import { messages as it } from "./messages/it";
import { messages as en } from "./messages/en";
import { messages as fr } from "./messages/fr";
import { messages as es } from "./messages/es";
import { messages as de } from "./messages/de";
import { messages as pt } from "./messages/pt";

export type { AppLocale };
export { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./locales";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL: Record<AppLocale, any> = { it, en, fr, es, de, pt };

export async function getLocale(): Promise<AppLocale> {
  const h = await headers();
  const v = h.get(LOCALE_HEADER);
  return isAppLocale(v) ? v : DEFAULT_LOCALE;
}

export async function getTranslations<K extends "marketing" | "bizery">(
  ns: K,
): Promise<typeof it[K]> {
  const locale = await getLocale();
  return ALL[locale][ns] as typeof it[K];
}
