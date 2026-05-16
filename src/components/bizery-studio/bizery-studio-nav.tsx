"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bizeryStudioSite } from "@/lib/bizery-studio-config";

const NAV = [
  { href: bizeryStudioSite.paths.home, label: "Panoramica" },
  { href: bizeryStudioSite.paths.billing, label: "Fatturazione" },
  { href: bizeryStudioSite.paths.payments, label: "Pagamenti" },
  { href: bizeryStudioSite.paths.recesso, label: "Recesso" },
] as const;

const GESTIONE_URL =
  process.env.NODE_ENV === "production"
    ? "https://gestione.bizery.it"
    : "http://gestione.bizery.localhost:3000";

export function BizeryStudioNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--bs-line)] bg-[var(--bs-paper)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--bs-paper)]/75">
      <div className="menuary-container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href={bizeryStudioSite.paths.home} className="flex items-baseline gap-0 text-[var(--bs-ink)]" aria-label="Fatturazione Bizery">
            <span className="text-xl font-medium tracking-[-0.02em]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
              bizery
            </span>
            <span aria-hidden className="text-xl text-[var(--bs-accent)]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>.</span>
            <span className="ml-2 text-sm font-semibold tracking-tight text-[var(--bs-muted)]">
              Fatturazione azienda
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "font-bold text-[var(--bs-ink)]"
                      : "font-semibold text-[var(--bs-muted)] hover:text-[var(--bs-ink)]"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={GESTIONE_URL}
            className="text-sm font-semibold text-[var(--bs-muted)] hover:text-[var(--bs-ink)]"
          >
            Pannello gestione
          </a>
          <a href="https://bizery.it" className="text-sm font-semibold text-[var(--bs-muted)] hover:text-[var(--bs-ink)]">
            bizery.it
          </a>
        </div>
      </div>
    </header>
  );
}
