import type { ReactNode } from "react";
import { BizeryStudioNav } from "@/components/bizery-studio/bizery-studio-nav";

// Palette blu professionale Bizery — sovrascrive i token menuary-* per i
// componenti condivisi che li usano, e definisce alias bs-* per i componenti
// esclusivi di questo portale.
const BIZERY_STUDIO_VARS: Record<string, string> = {
  "--bs-ink":        "#0F172A",
  "--bs-paper":      "#FFFFFF",
  "--bs-porcelain":  "#F0F5FF",
  "--bs-muted":      "#64748B",
  "--bs-line":       "#E2E8F0",
  "--bs-accent":     "#2563EB",
  "--bs-success":    "#10B981",
};

export function BizeryStudioShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[var(--bs-paper)] text-[var(--bs-ink)]"
      style={BIZERY_STUDIO_VARS as React.CSSProperties}
    >
      <BizeryStudioNav />
      <div className="menuary-container py-10">{children}</div>
      <footer className="border-t border-[var(--bs-line)] bg-[var(--bs-porcelain)] py-8 text-center text-xs text-[var(--bs-muted)]">
        <p>
          Portale riservato ai titolari delle aziende in contratto con Bizery. Pagamenti con carta
          tramite Stripe saranno disponibili a breve; oggi è previsto il bonifico SEPA.
        </p>
      </footer>
    </div>
  );
}
