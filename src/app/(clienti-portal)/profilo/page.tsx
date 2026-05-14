import type { Metadata } from "next";
import { ClientsProfileForm } from "@/components/clients/clients-profile-form";
import { MOCK_CLIENT_PROFILE } from "@/lib/clients-mock-data";

export const metadata: Metadata = {
  title: "Profilo",
};

export default function ClientiProfiloPage() {
  return (
    <div>
      <p className="menuary-section-label">Dati personali</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">Il tuo profilo</h1>
      <p className="mt-3 max-w-2xl text-[var(--menuary-muted)]">
        Informazioni usate per personalizzare menu e ordini e per contattarti. Allergie e preferenze
        sono condivise con i locali solo in base ai consensi e alle interazioni che scegli.
      </p>
      <div className="mt-10">
        <ClientsProfileForm initial={MOCK_CLIENT_PROFILE} />
      </div>
    </div>
  );
}
