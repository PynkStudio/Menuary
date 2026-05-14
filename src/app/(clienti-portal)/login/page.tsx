import type { Metadata } from "next";
import { ClientsLoginTabs } from "@/components/clients/clients-login-tabs";

export const metadata: Metadata = {
  title: "Accedi",
};

export default function ClientiLoginPage() {
  return (
    <div>
      <p className="menuary-section-label">Accesso</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">Accedi a Menuary</h1>
      <p className="mt-3 max-w-xl text-[var(--menuary-muted)]">
        Clienti del servizio e titolari/staff: canali diversi, stessa piattaforma.
      </p>
      <div className="mt-10">
        <ClientsLoginTabs />
      </div>
    </div>
  );
}
