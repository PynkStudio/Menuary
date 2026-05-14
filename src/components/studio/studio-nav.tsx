"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { studioSite } from "@/lib/studio-config";

const NAV = [
  { href: studioSite.paths.home, label: "Panoramica" },
  { href: studioSite.paths.billing, label: "Fatturazione" },
  { href: studioSite.paths.payments, label: "Pagamenti" },
  { href: studioSite.paths.recesso, label: "Recesso" },
] as const;

export function StudioNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--menuary-paper)]/75">
      <div className="menuary-container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href={studioSite.paths.home} className="menuary-wordmark" aria-label="Fatturazione Menuary">
            menuary
            <span aria-hidden className="ml-[0.15em] text-[var(--menuary-copper)]">.</span>
            <span className="ml-2 text-sm font-semibold tracking-tight text-[var(--menuary-muted)]">
              Fatturazione locale
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
                      ? "font-bold text-[var(--menuary-ink)]"
                      : "font-semibold text-[var(--menuary-muted)] hover:text-[var(--menuary-ink)]"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="https://admin.menuary.it"
            className="text-sm font-semibold text-[var(--menuary-muted)] hover:text-[var(--menuary-ink)]"
          >
            Back-office
          </Link>
          <Link href="https://menuary.it" className="text-sm font-semibold text-[var(--menuary-muted)] hover:text-[var(--menuary-ink)]">
            menuary.it
          </Link>
        </div>
      </div>
    </header>
  );
}
