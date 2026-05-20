import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "@/i18n";
import { headers } from "next/headers";
import { DEFAULT_MARKET, MARKET_HEADER, normalizeMarketCode } from "@/lib/markets";
import { MarketSelector } from "@/components/marketing/market-selector";

const BIZERY_VARS: Record<string, string> = {
  "--menuary-ink":        "#0F172A",
  "--menuary-paper":      "#FFFFFF",
  "--menuary-porcelain":  "#F0F5FF",
  "--menuary-muted":      "#64748B",
  "--menuary-line":       "#E2E8F0",
  "--menuary-copper":     "#2563EB",
  "--menuary-sage":       "#10B981",
  "--menuary-gold":       "#DBEAFE",
  "--menuary-hero-from":  "#EFF6FF",
  "--menuary-hero-to":    "#FFFFFF",
};

const GESTIONE_URL =
  process.env.NODE_ENV === "production"
    ? "https://gestione.bizery.it"
    : "http://gestione.bizery.localhost:3000";

export async function BizeryShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[var(--menuary-paper)] text-[var(--menuary-ink)]"
      style={BIZERY_VARS as React.CSSProperties}
    >
      <BizeryHeader />
      <main>{children}</main>
      <BizeryFooter />
    </div>
  );
}

async function BizeryHeader() {
  const t = (await getTranslations("bizery")).shell;
  const currentMarket = normalizeMarketCode((await headers()).get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  return (
    <header className="border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--menuary-paper)]/70 sticky top-0 z-40">
      <div className="menuary-container flex items-center justify-between py-5">
        <Link href="/" className="flex items-baseline gap-0.5" aria-label="Bizery home">
          <span
            className="text-2xl font-medium tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
          >
            bizery
          </span>
          <span aria-hidden className="text-2xl text-[var(--menuary-copper)]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>.</span>
        </Link>
        <nav className="hidden items-center gap-9 md:flex">
          <Link href="/pricing" className="menuary-nav-link">{t.nav.offer}</Link>
          <Link href="/chi-siamo" className="menuary-nav-link">{t.nav.about}</Link>
          <a href={GESTIONE_URL} className="menuary-nav-link">{t.nav.access}</a>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <MarketSelector currentMarket={currentMarket} />
          </div>
          <a
            href={GESTIONE_URL}
            className="menuary-button menuary-button-light text-sm md:hidden"
          >
            {t.nav.access}
          </a>
          <Link href="/contatti" className="menuary-button menuary-button-dark">
            {t.nav.contact}
          </Link>
        </div>
      </div>
      <div className="menuary-container pb-4 sm:hidden">
        <MarketSelector currentMarket={currentMarket} />
      </div>
    </header>
  );
}

async function BizeryFooter() {
  const t = (await getTranslations("bizery")).shell;
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <p
              className="text-2xl font-medium tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              bizery
              <span aria-hidden className="ml-[0.1em] text-[var(--menuary-copper)]">.</span>
            </p>
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
              {t.footer.desc}
            </p>
            <p className="mt-6 text-[13px] leading-6 text-[var(--menuary-muted)]">
              {t.footer.serviceBy}{" "}
              <a
                href="https://pynkstudio.it"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--menuary-ink)] underline decoration-[var(--menuary-copper)] underline-offset-4 transition-colors hover:text-[var(--menuary-copper)]"
              >
                PynkStudio
              </a>
              <span aria-hidden> · </span>
              <span>Milano, Italia</span>
            </p>
          </div>

          <FooterCol title={t.footer.nav} links={[
            { href: "/", label: "Home" },
            { href: "/pricing", label: t.nav.offer },
            { href: "/contatti", label: t.nav.contact },
          ]} />
          <FooterCol title={t.footer.contacts} links={[
            { href: "mailto:hello@bizery.it", label: "hello@bizery.it" },
            { href: "tel:+393513768607", label: "+39 351 3768607" },
            { href: "/contatti", label: t.footer.requestProposal },
          ]} />
          <FooterCol title={t.footer.forCompanies} links={[
            { href: GESTIONE_URL, label: t.footer.access, external: true },
            { href: "/pricing", label: t.footer.pricing },
            { href: "https://menuary.it", label: t.footer.menuary, external: true },
          ]} />
        </div>

        <div className="menuary-rule mt-14" />
        <div className="mt-6 flex flex-col gap-3 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} · Bizery · PynkStudio</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--menuary-ink)]">{t.footer.privacy}</Link>
            <Link href="/cookie" className="hover:text-[var(--menuary-ink)]">{t.footer.cookie}</Link>
          </div>
        </div>
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
        {links.map((l) => (
          <li key={l.href + l.label}>
            {l.external ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--menuary-muted)] transition-colors hover:text-[var(--menuary-ink)]"
              >
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="text-[var(--menuary-muted)] transition-colors hover:text-[var(--menuary-ink)]">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
