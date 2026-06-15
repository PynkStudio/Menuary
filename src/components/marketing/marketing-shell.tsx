import Link from "next/link";
import type { ReactNode } from "react";
import { CLIENTS_PUBLIC_ORIGIN } from "@/lib/clients-config";
import { STUDIO_PUBLIC_ORIGIN } from "@/lib/studio-config";
import { getTranslations } from "@/i18n";
import { headers } from "next/headers";
import { DEFAULT_MARKET, MARKET_HEADER, normalizeMarketCode } from "@/lib/markets";
import { LOCALE_HEADER, DEFAULT_LOCALE, isAppLocale } from "@/i18n/locales";
import { localizedPath } from "@/lib/marketing-seo";
import { MarketSelector } from "@/components/marketing/market-selector";

const PRICING_PATH = "/pricing";

async function getLocaleHref(path: string): Promise<string> {
  const value = (await headers()).get(LOCALE_HEADER);
  const locale = isAppLocale(value) ? value : DEFAULT_LOCALE;
  return localizedPath(path, locale);
}

export async function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="menuary-shell min-h-screen bg-[var(--menuary-paper)] text-[var(--menuary-ink)]">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

async function MarketingHeader() {
  const t = (await getTranslations("marketing")).shell;
  const currentMarket = normalizeMarketCode((await headers()).get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const homeHref = await getLocaleHref("");
  const aboutHref = await getLocaleHref("/chi-siamo");
  const contactHref = await getLocaleHref("/contatti");
  const pricingHref = await getLocaleHref(PRICING_PATH);
  return (
    <header className="border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--menuary-paper)]/70 sticky top-0 z-40">
      <div className="menuary-container flex items-center justify-between py-5">
        <Link href={homeHref} className="menuary-wordmark" aria-label="Menuary home">
          menuary
          <span aria-hidden className="ml-[0.15em] text-[var(--menuary-copper)]">.</span>
        </Link>
        <nav className="hidden items-center gap-9 md:flex">
          <Link href={pricingHref} className="menuary-nav-link">{t.nav.offer}</Link>
          <Link href={aboutHref} className="menuary-nav-link">{t.nav.about}</Link>
          <a href={`${CLIENTS_PUBLIC_ORIGIN}/login`} className="menuary-nav-link">
            {t.nav.myAccount}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <MarketSelector currentMarket={currentMarket} />
          </div>
          <a
            href={`${CLIENTS_PUBLIC_ORIGIN}/login`}
            className="menuary-button menuary-button-light text-sm md:hidden"
          >
            {t.nav.signIn}
          </a>
          <Link href={contactHref} className="menuary-button menuary-button-dark">
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

async function MarketingFooter() {
  const t = (await getTranslations("marketing")).shell;
  const year = new Date().getFullYear();
  const homeHref = await getLocaleHref("");
  const aboutHref = await getLocaleHref("/chi-siamo");
  const contactHref = await getLocaleHref("/contatti");
  const pricingHref = await getLocaleHref(PRICING_PATH);
  return (
    <footer className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <p className="menuary-wordmark text-2xl">
              menuary
              <span aria-hidden className="ml-[0.15em] text-[var(--menuary-copper)]">.</span>
            </p>
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
              {t.footer.desc}
            </p>
            <p className="mt-6 text-[13px] leading-6 text-[var(--menuary-muted)]">
              Un servizio di{" "}
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

          <FooterColumn
            title={t.footer.nav}
            links={[
              { href: homeHref, label: "Home" },
              { href: aboutHref, label: t.nav.about },
              { href: pricingHref, label: t.nav.offer },
              { href: contactHref, label: "Contatti" },
            ]}
          />
          <FooterColumn
            title={t.footer.contacts}
            links={[
              { href: "mailto:hello@menuary.it", label: "hello@menuary.it" },
              { href: "tel:+393513768607", label: "+39 351 3768607" },
              { href: contactHref, label: t.footer.requestProposal },
            ]}
          />
          <FooterColumn
            title={t.footer.forRestaurants}
            links={[
              { href: `${STUDIO_PUBLIC_ORIGIN}/login`, label: t.footer.loginRestaurants, external: true },
              { href: STUDIO_PUBLIC_ORIGIN, label: t.footer.billing, external: true },
              { href: `${CLIENTS_PUBLIC_ORIGIN}/login`, label: t.footer.personalArea, external: true },
            ]}
          />
        </div>

        <div className="menuary-rule mt-14" />
        <div className="mt-6 flex flex-col gap-3 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} · Menuary · PynkStudio</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--menuary-ink)]">{t.footer.privacy}</Link>
            <Link href="/cookie" className="hover:text-[var(--menuary-ink)]">{t.footer.cookie}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--menuary-ink)]">
        {title}
      </p>
      <ul className="mt-5 space-y-3 text-[15px]">
        {links.map((link) => (
          <li key={link.href + link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--menuary-muted)] transition-colors hover:text-[var(--menuary-ink)]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-[var(--menuary-muted)] transition-colors hover:text-[var(--menuary-ink)]"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
