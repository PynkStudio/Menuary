import type { ReactNode } from "react";
import { StudioNav } from "@/components/studio/studio-nav";

export function StudioShell({ children }: { children: ReactNode }) {
  return (
    <div className="menuary-shell min-h-screen bg-[var(--menuary-paper)] text-[var(--menuary-ink)]">
      <StudioNav />
      <div className="menuary-container py-10">{children}</div>
      <footer className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] py-8 text-center text-xs text-[var(--menuary-muted)]">
        <p>
          Portale riservato ai titolari dei locali in contratto con Menuary. Pagamenti con carta
          tramite Stripe saranno disponibili a breve; oggi è previsto il bonifico SEPA.
        </p>
      </footer>
    </div>
  );
}
