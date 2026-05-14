import Link from "next/link";
import type { ReactNode } from "react";
import { CLIENTS_PUBLIC_ORIGIN } from "@/lib/clients-config";
import { STUDIO_PUBLIC_ORIGIN } from "@/lib/studio-config";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="menuary-shell min-h-screen bg-[var(--menuary-paper)] text-[var(--menuary-ink)]">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

function MarketingHeader() {
  return (
    <header className="border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--menuary-paper)]/70 sticky top-0 z-40">
      <div className="menuary-container flex items-center justify-between py-5">
        <Link href="/" className="menuary-wordmark" aria-label="Menuary home">
          menuary
          <span aria-hidden className="ml-[0.15em] text-[var(--menuary-copper)]">.</span>
        </Link>
        <nav className="hidden items-center gap-9 md:flex">
          <Link href="/pricing" className="menuary-nav-link">Offerta</Link>
          <Link href="/chi-siamo" className="menuary-nav-link">Studio</Link>
          <a href={`${CLIENTS_PUBLIC_ORIGIN}/login`} className="menuary-nav-link">
            Area personale
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={`${CLIENTS_PUBLIC_ORIGIN}/login`}
            className="menuary-button menuary-button-light text-sm md:hidden"
          >
            Accedi
          </a>
          <Link href="/contatti" className="menuary-button menuary-button-dark">
            Parla con noi
          </Link>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  const year = new Date().getFullYear();
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
              La piattaforma operativa per ristoranti: sito, gestionale completo e assistente
              IA al telefono. Costruita su misura, mantenuta nel tempo.
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
            title="Navigazione"
            links={[
              { href: "/", label: "Home" },
              { href: "/chi-siamo", label: "Studio" },
              { href: "/pricing", label: "Offerta" },
              { href: "/contatti", label: "Contatti" },
            ]}
          />
          <FooterColumn
            title="Contatti"
            links={[
              { href: "mailto:hello@menuary.it", label: "hello@menuary.it" },
              { href: "tel:+393513768607", label: "+39 351 3768607" },
              { href: "/contatti", label: "Richiedi proposta" },
            ]}
          />
          <FooterColumn
            title="Per i locali"
            links={[
              {
                href: `${STUDIO_PUBLIC_ORIGIN}/login`,
                label: "Login ristoratori",
                external: true,
              },
              {
                href: STUDIO_PUBLIC_ORIGIN,
                label: "Fatturazione e abbonamenti",
                external: true,
              },
              {
                href: `${CLIENTS_PUBLIC_ORIGIN}/login`,
                label: "Area personale clienti",
                external: true,
              },
            ]}
          />
        </div>

        <div className="menuary-rule mt-14" />
        <div className="mt-6 flex flex-col gap-3 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} · Menuary · PynkStudio</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--menuary-ink)]">Privacy</Link>
            <Link href="/cookie" className="hover:text-[var(--menuary-ink)]">Cookie</Link>
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
