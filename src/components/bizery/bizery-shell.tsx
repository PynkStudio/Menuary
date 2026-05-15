import Link from "next/link";
import type { ReactNode } from "react";

// CSS var override: rimappa --menuary-* su palette Bizery (blu professionale).
// Tutti i componenti marketing che usano .menuary-* ereditano automaticamente
// i colori Bizery all'interno di questo shell.
const BIZERY_VARS: Record<string, string> = {
  "--menuary-ink":        "#0F172A",
  "--menuary-paper":      "#FFFFFF",
  "--menuary-porcelain":  "#F0F5FF",
  "--menuary-muted":      "#64748B",
  "--menuary-line":       "#E2E8F0",
  "--menuary-copper":     "#2563EB",   // accento primario (sostituisce copper)
  "--menuary-sage":       "#10B981",   // successo / verde
  "--menuary-gold":       "#DBEAFE",   // tono caldo leggero
  "--menuary-hero-from":  "#EFF6FF",
  "--menuary-hero-to":    "#FFFFFF",
};

const GESTIONE_URL =
  process.env.NODE_ENV === "production"
    ? "https://gestione.bizery.it"
    : "http://gestione.bizery.localhost:3000";

export function BizeryShell({ children }: { children: ReactNode }) {
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

function BizeryHeader() {
  return (
    <header className="border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--menuary-paper)]/70 sticky top-0 z-40">
      <div className="menuary-container flex items-center justify-between py-5">
        <Link href="/" className="flex items-baseline gap-0.5" aria-label="Bizery home">
          <span
            className="font-['var(--font-menuary-display)',Georgia,serif] text-2xl font-medium tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
          >
            bizery
          </span>
          <span aria-hidden className="text-2xl text-[var(--menuary-copper)]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>.</span>
        </Link>
        <nav className="hidden items-center gap-9 md:flex">
          <Link href="/pricing" className="menuary-nav-link">Offerta</Link>
          <Link href="/chi-siamo" className="menuary-nav-link">Studio</Link>
          <a href={GESTIONE_URL} className="menuary-nav-link">Accedi</a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={GESTIONE_URL}
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

function BizeryFooter() {
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
              La piattaforma operativa per aziende di servizi: sito, appuntamenti, listino
              digitale, CRM e gestione team. Costruita su misura, mantenuta nel tempo.
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

          <FooterCol title="Navigazione" links={[
            { href: "/", label: "Home" },
            { href: "/pricing", label: "Offerta" },
            { href: "/contatti", label: "Contatti" },
          ]} />
          <FooterCol title="Contatti" links={[
            { href: "mailto:hello@bizery.it", label: "hello@bizery.it" },
            { href: "tel:+393513768607", label: "+39 351 3768607" },
            { href: "/contatti", label: "Richiedi proposta" },
          ]} />
          <FooterCol title="Per le aziende" links={[
            { href: GESTIONE_URL, label: "Accedi al pannello", external: true },
            { href: "/pricing", label: "Piani e prezzi" },
            { href: "https://menuary.it", label: "Menuary · Food", external: true },
          ]} />
        </div>

        <div className="menuary-rule mt-14" />
        <div className="mt-6 flex flex-col gap-3 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} · Bizery · PynkStudio</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--menuary-ink)]">Privacy</Link>
            <Link href="/cookie" className="hover:text-[var(--menuary-ink)]">Cookie</Link>
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
