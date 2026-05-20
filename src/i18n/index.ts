import { headers } from "next/headers";
import { type AppLocale, isAppLocale, DEFAULT_LOCALE, LOCALE_HEADER } from "./locales";
import { messages as it } from "./messages/it";
import { messages as en } from "./messages/en";
import { messages as fr } from "./messages/fr";
import { messages as es } from "./messages/es";
import { messages as de } from "./messages/de";
import { messages as pt } from "./messages/pt";
import { messages as nl } from "./messages/nl";
import { messages as da } from "./messages/da";
import { messages as sv } from "./messages/sv";
import { messages as nb } from "./messages/nb";
import { messages as fi } from "./messages/fi";
import { messages as pl } from "./messages/pl";
import { messages as cs } from "./messages/cs";
import { messages as sl } from "./messages/sl";
import { messages as hr } from "./messages/hr";
import { messages as sq } from "./messages/sq";
import { messages as el } from "./messages/el";

export type { AppLocale };
export { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./locales";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL: Record<AppLocale, any> = {
  it,
  en,
  fr,
  es,
  de,
  pt,
  nl,
  da,
  sv,
  nb,
  fi,
  pl,
  cs,
  sl,
  hr,
  sq,
  el,
};

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
