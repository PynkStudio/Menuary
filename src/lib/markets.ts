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
  flag: string;
  currency: string;
  locale: string;
};

export const MARKET_COOKIE = "MENUARY_MARKET";
export const MARKET_HEADER = "x-market";
export const DEFAULT_MARKET: MarketCode = "IT";

export const MARKETS: Market[] = [
  { code: "IT", name: "Italia", flag: "🇮🇹", currency: "EUR", locale: "it-IT" },
  { code: "FR", name: "Francia", flag: "🇫🇷", currency: "EUR", locale: "fr-FR" },
  { code: "DE", name: "Germania", flag: "🇩🇪", currency: "EUR", locale: "de-DE" },
  { code: "ES", name: "Spagna", flag: "🇪🇸", currency: "EUR", locale: "es-ES" },
  { code: "PT", name: "Portogallo", flag: "🇵🇹", currency: "EUR", locale: "pt-PT" },
  { code: "NL", name: "Paesi Bassi", flag: "🇳🇱", currency: "EUR", locale: "nl-NL" },
  { code: "BE", name: "Belgio", flag: "🇧🇪", currency: "EUR", locale: "fr-BE" },
  { code: "AT", name: "Austria", flag: "🇦🇹", currency: "EUR", locale: "de-AT" },
  { code: "CH", name: "Svizzera", flag: "🇨🇭", currency: "CHF", locale: "de-CH" },
  { code: "IE", name: "Irlanda", flag: "🇮🇪", currency: "EUR", locale: "en-IE" },
  { code: "DK", name: "Danimarca", flag: "🇩🇰", currency: "DKK", locale: "da-DK" },
  { code: "SE", name: "Svezia", flag: "🇸🇪", currency: "SEK", locale: "sv-SE" },
  { code: "NO", name: "Norvegia", flag: "🇳🇴", currency: "NOK", locale: "nb-NO" },
  { code: "FI", name: "Finlandia", flag: "🇫🇮", currency: "EUR", locale: "fi-FI" },
  { code: "PL", name: "Polonia", flag: "🇵🇱", currency: "PLN", locale: "pl-PL" },
  { code: "CZ", name: "Repubblica Ceca", flag: "🇨🇿", currency: "CZK", locale: "cs-CZ" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮", currency: "EUR", locale: "sl-SI" },
  { code: "HR", name: "Croazia", flag: "🇭🇷", currency: "EUR", locale: "hr-HR" },
  { code: "AL", name: "Albania", flag: "🇦🇱", currency: "ALL", locale: "sq-AL" },
  { code: "GR", name: "Grecia", flag: "🇬🇷", currency: "EUR", locale: "el-GR" },
  { code: "BR", name: "Brasile", flag: "🇧🇷", currency: "BRL", locale: "pt-BR" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", locale: "en-AU" },
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
  return market === "IT" ? "it" : "en";
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
