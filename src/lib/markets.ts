import type { AppLocale } from "@/i18n/locales";

export type MarketCode =
  | "IT"
  | "FR"
  | "DE"
  | "ES"
  | "PT"
  | "NL"
  | "BE"
  | "AT"
  | "CH"
  | "IE"
  | "DK"
  | "SE"
  | "NO"
  | "FI"
  | "PL"
  | "CZ"
  | "SI"
  | "HR"
  | "AL"
  | "GR"
  | "BR"
  | "AU";

export type Market = {
  code: MarketCode;
  name: string;
  nativeName: string;
  flag: string;
  currency: string;
  locale: string;
};

export const MARKET_COOKIE = "MENUARY_MARKET";
export const MARKET_HEADER = "x-market";
export const DEFAULT_MARKET: MarketCode = "IT";

export const MARKETS: Market[] = [
  { code: "IT", name: "Italia", nativeName: "Italia", flag: "🇮🇹", currency: "EUR", locale: "it-IT" },
  { code: "FR", name: "Francia", nativeName: "France", flag: "🇫🇷", currency: "EUR", locale: "fr-FR" },
  { code: "DE", name: "Germania", nativeName: "Deutschland", flag: "🇩🇪", currency: "EUR", locale: "de-DE" },
  { code: "ES", name: "Spagna", nativeName: "España", flag: "🇪🇸", currency: "EUR", locale: "es-ES" },
  { code: "PT", name: "Portogallo", nativeName: "Portugal", flag: "🇵🇹", currency: "EUR", locale: "pt-PT" },
  { code: "NL", name: "Paesi Bassi", nativeName: "Nederland", flag: "🇳🇱", currency: "EUR", locale: "nl-NL" },
  { code: "BE", name: "Belgio", nativeName: "Belgique / België", flag: "🇧🇪", currency: "EUR", locale: "fr-BE" },
  { code: "AT", name: "Austria", nativeName: "Österreich", flag: "🇦🇹", currency: "EUR", locale: "de-AT" },
  { code: "CH", name: "Svizzera", nativeName: "Schweiz / Suisse", flag: "🇨🇭", currency: "CHF", locale: "de-CH" },
  { code: "IE", name: "Irlanda", nativeName: "Ireland", flag: "🇮🇪", currency: "EUR", locale: "en-IE" },
  { code: "DK", name: "Danimarca", nativeName: "Danmark", flag: "🇩🇰", currency: "DKK", locale: "da-DK" },
  { code: "SE", name: "Svezia", nativeName: "Sverige", flag: "🇸🇪", currency: "SEK", locale: "sv-SE" },
  { code: "NO", name: "Norvegia", nativeName: "Norge", flag: "🇳🇴", currency: "NOK", locale: "nb-NO" },
  { code: "FI", name: "Finlandia", nativeName: "Suomi", flag: "🇫🇮", currency: "EUR", locale: "fi-FI" },
  { code: "PL", name: "Polonia", nativeName: "Polska", flag: "🇵🇱", currency: "PLN", locale: "pl-PL" },
  { code: "CZ", name: "Repubblica Ceca", nativeName: "Česko", flag: "🇨🇿", currency: "CZK", locale: "cs-CZ" },
  { code: "SI", name: "Slovenia", nativeName: "Slovenija", flag: "🇸🇮", currency: "EUR", locale: "sl-SI" },
  { code: "HR", name: "Croazia", nativeName: "Hrvatska", flag: "🇭🇷", currency: "EUR", locale: "hr-HR" },
  { code: "AL", name: "Albania", nativeName: "Shqipëria", flag: "🇦🇱", currency: "ALL", locale: "sq-AL" },
  { code: "GR", name: "Grecia", nativeName: "Ελλάδα", flag: "🇬🇷", currency: "EUR", locale: "el-GR" },
  { code: "BR", name: "Brasile", nativeName: "Brasil", flag: "🇧🇷", currency: "BRL", locale: "pt-BR" },
  { code: "AU", name: "Australia", nativeName: "Australia", flag: "🇦🇺", currency: "AUD", locale: "en-AU" },
];

const MARKET_SET = new Set<string>(MARKETS.map((market) => market.code));

export function isMarketCode(value: unknown): value is MarketCode {
  return typeof value === "string" && MARKET_SET.has(value.toUpperCase());
}

export function normalizeMarketCode(value: unknown): MarketCode | null {
  if (!isMarketCode(value)) return null;
  return value.toUpperCase() as MarketCode;
}

export function getMarket(code: MarketCode): Market {
  return MARKETS.find((market) => market.code === code) ?? MARKETS[0];
}

export function marketForLocale(locale: AppLocale): MarketCode {
  if (locale === "fr") return "FR";
  if (locale === "de") return "DE";
  if (locale === "es") return "ES";
  if (locale === "pt") return "PT";
  if (locale === "nl") return "NL";
  if (locale === "da") return "DK";
  if (locale === "sv") return "SE";
  if (locale === "nb") return "NO";
  if (locale === "fi") return "FI";
  if (locale === "pl") return "PL";
  if (locale === "cs") return "CZ";
  if (locale === "sl") return "SI";
  if (locale === "hr") return "HR";
  if (locale === "sq") return "AL";
  if (locale === "el") return "GR";
  if (locale === "en") return "IE";
  return "IT";
}

export function localeForMarket(market: MarketCode): AppLocale {
  if (market === "IT") return "it";
  if (market === "FR" || market === "BE") return "fr";
  if (market === "DE" || market === "AT" || market === "CH") return "de";
  if (market === "ES") return "es";
  if (market === "PT" || market === "BR") return "pt";
  if (market === "NL") return "nl";
  if (market === "DK") return "da";
  if (market === "SE") return "sv";
  if (market === "NO") return "nb";
  if (market === "FI") return "fi";
  if (market === "PL") return "pl";
  if (market === "CZ") return "cs";
  if (market === "SI") return "sl";
  if (market === "HR") return "hr";
  if (market === "AL") return "sq";
  if (market === "GR") return "el";
  return "en";
}

export const MARKET_LANGUAGE_CODES: Record<MarketCode, string[]> = {
  IT: ["IT", "EN", "FR", "DE", "ES"],
  FR: ["FR", "EN", "DE", "ES", "IT"],
  DE: ["DE", "EN", "FR", "IT", "ES"],
  ES: ["ES", "EN", "FR", "DE", "IT"],
  PT: ["PT", "EN", "ES", "FR", "DE"],
  NL: ["NL", "EN", "DE", "FR", "ES"],
  BE: ["FR", "NL", "EN", "DE", "ES"],
  AT: ["DE", "EN", "IT", "FR", "ES"],
  CH: ["DE", "FR", "IT", "EN", "ES"],
  IE: ["EN", "FR", "DE", "ES", "IT"],
  DK: ["DA", "EN", "DE", "SV", "NO"],
  SE: ["SV", "EN", "DE", "FI", "NO"],
  NO: ["NO", "EN", "DE", "SV", "DA"],
  FI: ["FI", "EN", "SV", "DE", "RU"],
  PL: ["PL", "EN", "DE", "FR", "UA"],
  CZ: ["CS", "EN", "DE", "PL", "SK"],
  SI: ["SL", "EN", "IT", "DE", "HR"],
  HR: ["HR", "EN", "DE", "IT", "SL"],
  AL: ["SQ", "EN", "IT", "DE", "EL"],
  GR: ["EL", "EN", "DE", "FR", "IT"],
  BR: ["PT", "EN", "ES", "FR", "IT"],
  AU: ["EN", "ZH", "JA", "KO", "IT"],
};

export function formatMarketLanguageBadge(prefix: string, marketCode: MarketCode): string {
  return `${prefix} · ${MARKET_LANGUAGE_CODES[marketCode].join(" ")} +`;
}

export function formatMarketMoney(amount: number, marketCode: MarketCode): string {
  const market = getMarket(marketCode);
  return new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: market.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
