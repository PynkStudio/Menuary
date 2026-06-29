import { headers } from "next/headers";
import { type AppLocale, isAppLocale, DEFAULT_LOCALE, LOCALE_HEADER } from "./locales";
import { mergeMessages } from "./messages/_merge";
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

// Ogni lingua è un override parziale sull'italiano: le chiavi non ancora
// tradotte (es. about/pricing in alcune lingue) ricadono sull'italiano invece
// di rompere la pagina con un valore undefined.
const ALL: Record<AppLocale, typeof it> = {
  it,
  en: mergeMessages(it, en),
  fr: mergeMessages(it, fr),
  es: mergeMessages(it, es),
  de: mergeMessages(it, de),
  pt: mergeMessages(it, pt),
  nl: mergeMessages(it, nl),
  da: mergeMessages(it, da),
  sv: mergeMessages(it, sv),
  nb: mergeMessages(it, nb),
  fi: mergeMessages(it, fi),
  pl: mergeMessages(it, pl),
  cs: mergeMessages(it, cs),
  sl: mergeMessages(it, sl),
  hr: mergeMessages(it, hr),
  sq: mergeMessages(it, sq),
  el: mergeMessages(it, el),
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
