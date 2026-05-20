"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_MARKET,
  MARKETS,
  MARKET_COOKIE,
  getMarket,
  localeForMarket,
  normalizeMarketCode,
  type MarketCode,
} from "@/lib/markets";
import { LOCALE_COOKIE } from "@/i18n/locales";

function currentLocalePath(pathname: string): { locale: string | null; rest: string } {
  const match = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (!match) return { locale: null, rest: pathname || "/" };
  return { locale: match[1], rest: match[2] ?? "/" };
}

export function MarketSelector({ currentMarket }: { currentMarket: MarketCode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<MarketCode>(currentMarket);
  const market = getMarket(value);

  const options = useMemo(() => MARKETS, []);

  function handleChange(nextRaw: string) {
    const next = normalizeMarketCode(nextRaw) ?? DEFAULT_MARKET;
    setValue(next);

    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${MARKET_COOKIE}=${next}; path=/; max-age=${maxAge}; samesite=lax`;

    const { rest } = currentLocalePath(pathname);
    const locale = localeForMarket(next);
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("market", next);

    const target = `/${locale}${rest === "/" ? "" : rest}?${params.toString()}`;
    router.push(target);
    router.refresh();
  }

  return (
    <label className="relative inline-flex items-center rounded-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-3 py-2 text-sm font-semibold text-[var(--menuary-ink)]">
      <span className="mr-2" aria-hidden>
        {market.flag}
      </span>
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
