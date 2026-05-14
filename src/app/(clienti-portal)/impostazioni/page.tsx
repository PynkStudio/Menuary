import type { Metadata } from "next";
import { ClientsSettingsPanel } from "@/components/clients/clients-settings-panel";

export const metadata: Metadata = {
  title: "Impostazioni — Menuary",
};

export default function ImpostazioniPage() {
  return (
    <div>
      <p className="menuary-section-label">Account</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">
        Impostazioni
      </h1>
      <p className="mt-3 max-w-xl text-[var(--menuary-muted)]">
        Gestisci la sicurezza del tuo account e i tuoi dati personali.
      </p>
      <div className="mt-10">
        <ClientsSettingsPanel />
      </div>
    </div>
  );
}
