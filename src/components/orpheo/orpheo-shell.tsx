import Link from "next/link";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { DEFAULT_MARKET, MARKET_HEADER, normalizeMarketCode } from "@/lib/markets";
import { LOCALE_HEADER, DEFAULT_LOCALE, isAppLocale } from "@/i18n/locales";
import { MarketSelector } from "@/components/marketing/market-selector";

const PRICING_PATH = "/pricing";

const ORPHEO_VARS: Record<string, string> = {
  "--menuary-ink": "#17111F",
  "--menuary-paper": "#FBFAF7",
  "--menuary-porcelain": "#F4F0FB",
  "--menuary-muted": "#6B5E75",
  "--menuary-line": "#E7DFF0",
  "--menuary-copper": "#7C3AED",
  "--menuary-sage": "#0F9F6E",
  "--menuary-gold": "#F4DF9A",
  "--menuary-hero-from": "#FBFAF7",
  "--menuary-hero-to": "#F4F0FB",
};

async function getLocaleHref(path: string): Promise<string> {
  const value = (await headers()).get(LOCALE_HEADER);
  const locale = isAppLocale(value) ? value : DEFAULT_LOCALE;
  return `/${locale}${path}`;
}

export async function OrpheoShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[var(--menuary-paper)] text-[var(--menuary-ink)]"
      style={ORPHEO_VARS as React.CSSProperties}
    >
      <OrpheoHeader />
      <main>{children}</main>
      <OrpheoFooter />
    </div>
  );
}

async function OrpheoHeader() {
  const currentMarket = normalizeMarketCode((await headers()).get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const pricingHref = await getLocaleHref(PRICING_PATH);
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--menuary-paper)]/70">
      <div className="menuary-container flex items-center justify-between py-5">
        <Link href="/" className="flex items-baseline gap-0.5" aria-label="Orpheo home">
          <span className="text-2xl font-medium tracking-[-0.02em]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
            orpheo
          </span>
          <span aria-hidden className="text-2xl text-[var(--menuary-copper)]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>.</span>
        </Link>
        <nav className="hidden items-center gap-9 md:flex">
          <Link href={pricingHref} className="menuary-nav-link">Prezzi</Link>
          <Link href="/contatti" className="menuary-nav-link">Contatti</Link>
          <a href="https://admin.menuary.it" className="menuary-nav-link">Admin</a>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <MarketSelector currentMarket={currentMarket} />
          </div>
          <Link href="/contatti" className="menuary-button menuary-button-dark">
            Richiedi una demo
          </Link>
        </div>
      </div>
      <div className="menuary-container pb-4 sm:hidden">
        <MarketSelector currentMarket={currentMarket} />
      </div>
    </header>
  );
}

async function OrpheoFooter() {
  const year = new Date().getFullYear();
  const pricingHref = await getLocaleHref(PRICING_PATH);
  return (
    <footer className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <p className="text-2xl font-medium tracking-[-0.02em]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
              orpheo<span aria-hidden className="ml-[0.1em] text-[var(--menuary-copper)]">.</span>
            </p>
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
              Presenza, booking, catalogo opere, diritti, recensioni e fanbase per artisti, autori e professionisti creativi.
            </p>
          </div>
          <FooterCol title="Prodotto" links={[
            { href: "/", label: "Home" },
            { href: pricingHref, label: "Prezzi" },
            { href: "/contatti", label: "Contatti" },
          ]} />
          <FooterCol title="Contatti" links={[
            { href: "mailto:hello@weuseorpheo.com", label: "hello@weuseorpheo.com" },
            { href: "tel:+393513768607", label: "+39 351 3768607" },
          ]} />
          <FooterCol title="Piattaforma" links={[
            { href: "https://admin.menuary.it", label: "Admin Menuary", external: true },
            { href: "https://bizery.it", label: "Bizery", external: true },
            { href: "https://menuary.it", label: "Menuary", external: true },
          ]} />
        </div>
        <div className="menuary-rule mt-14" />
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
          © {year} · Orpheo · PynkStudio
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--menuary-ink)]">{title}</p>
      <ul className="mt-5 space-y-3 text-[15px]">
        {links.map((link) => (
          <li key={link.href + link.label}>
            {link.external ? (
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-[var(--menuary-muted)] transition-colors hover:text-[var(--menuary-ink)]">
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="text-[var(--menuary-muted)] transition-colors hover:text-[var(--menuary-ink)]">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
