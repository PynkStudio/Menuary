import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { ClientsNav } from "@/components/clients/clients-nav";
import { STUDIO_PUBLIC_ORIGIN } from "@/lib/studio-config";

export function ClientsShell({ children }: { children: ReactNode }) {
  return (
    <div className="menuary-shell min-h-screen bg-[var(--menuary-paper)] text-[var(--menuary-ink)]">
      <ClientsNav />
      <div className="menuary-container py-10">{children}</div>

      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)]">
              Sei un ristoratore?
            </p>
            <p className="menuary-display mt-2 text-2xl">
              Gestisci il tuo locale su Menuary Studio.
            </p>
          </div>
          <a
            href={`${STUDIO_PUBLIC_ORIGIN}/login`}
            className="menuary-button menuary-button-dark text-sm sm:self-center"
          >
            Vai a Menuary Studio
            <ArrowUpRight size={16} strokeWidth={1.8} className="ml-1" />
          </a>
        </div>
      </section>

      <footer className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] py-8 text-center text-xs text-[var(--menuary-muted)]">
        <p>
          Portale clienti Menuary — i dati sono trattati secondo l&apos;informativa privacy.
        </p>
      </footer>
    </div>
  );
}
