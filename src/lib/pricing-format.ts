export function parsePriceAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function formatPricingAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSetupFrom(value: unknown, currency: string, locale: string): string {
  const amount = parsePriceAmount(value);
  if (amount == null) return String(value ?? "");
  const language = locale.toLowerCase().split("-")[0];
  const prefixByLanguage: Record<string, string> = {
    it: "da",
    fr: "à partir de",
    de: "ab",
    es: "desde",
    pt: "desde",
    nl: "vanaf",
    da: "fra",
    sv: "från",
    nb: "fra",
    fi: "alkaen",
    pl: "od",
    cs: "od",
    sl: "od",
    hr: "od",
    sq: "nga",
    el: "από",
  };
  return `${prefixByLanguage[language] ?? "from"} ${formatPricingAmount(amount, currency, locale)}`;
}

export function replacePriceToken(template: string, token: "amount" | "price", value: string): string {
  return template.replace(new RegExp(`[€$£]?\\{${token}\\}\\s*[€$£]?`), value);
}

export function sanitizeAmountInput(value: string): string {
  return value.replace(/[^\d.,-]/g, "").replace(",", ".");
}
