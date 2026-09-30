"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_MARKET,
  MARKETS,
  MARKET_COOKIE,
  localeForMarket,
  normalizeMarketCode,
  type MarketCode,
} from "@/lib/markets";
import { LOCALE_COOKIE, isAppLocale, DEFAULT_LOCALE } from "@/i18n/locales";
import { localizedPath } from "@/lib/marketing-seo";
import { resolveLocalizedSegment } from "@/lib/marketing-slugs";

/**
 * Riporta il path pubblico corrente alla route interna italiana: da
 * `/de/ueber-uns` a `/chi-siamo`. Senza questo passaggio cambiare lingua da una
 * pagina con slug tradotto porta a un URL inesistente (es. `/fr/ueber-uns`).
 */
function internalPath(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  const locale = match && isAppLocale(match[1]) ? match[1] : DEFAULT_LOCALE;
  const rest = match && isAppLocale(match[1]) ? match[2] ?? "/" : pathname || "/";
  const [first = "", ...tail] = rest.replace(/^\//, "").split("/");
  if (!first) return "";
  const key = resolveLocalizedSegment(locale, first);
  return `/${[key ?? first, ...tail].join("/")}`;
}

export function MarketSelector({ currentMarket }: { currentMarket: MarketCode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<MarketCode>(currentMarket);

  const options = useMemo(() => MARKETS, []);

  function handleChange(nextRaw: string) {
    const next = normalizeMarketCode(nextRaw) ?? DEFAULT_MARKET;
    setValue(next);

    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${MARKET_COOKIE}=${next}; path=/; max-age=${maxAge}; samesite=lax`;

    const locale = localeForMarket(next);
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("market", next);

    const target = `${localizedPath(internalPath(pathname), locale)}?${params.toString()}`;
    router.push(target);
    router.refresh();
  }

  return (
    <label className="relative inline-flex items-center rounded-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-3 py-2 text-sm font-semibold text-[var(--menuary-ink)]">
      <span className="sr-only">Paese</span>
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="max-w-[8.5rem] bg-transparent pr-1 text-sm font-semibold outline-none"
        aria-label="Cambia paese"
      >
        {options.map((item) => (
          <option key={item.code} value={item.code}>
            {item.flag} {item.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
