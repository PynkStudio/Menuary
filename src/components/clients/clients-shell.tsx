import type { ReactNode } from "react";
import { ClientsNav } from "@/components/clients/clients-nav";

export function ClientsShell({ children }: { children: ReactNode }) {
  return (
    <div className="menuary-shell min-h-screen bg-[var(--menuary-paper)] text-[var(--menuary-ink)]">
      <ClientsNav />
      <div className="menuary-container py-10">{children}</div>
      <footer className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] py-8 text-center text-xs text-[var(--menuary-muted)]">
        <p>
          Portale clienti Menuary — i dati sono trattati secondo l&apos;informativa privacy. Le
          funzioni di salvataggio e revoca saranno collegate a Supabase.
        </p>
      </footer>
    </div>
  );
}
