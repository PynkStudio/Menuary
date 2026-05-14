import type { Metadata } from "next";
import { StudioBillingForm } from "@/components/studio/studio-billing-form";
import { MOCK_STUDIO_BILLING } from "@/lib/studio-mock-data";

export const metadata: Metadata = {
  title: "Fatturazione",
};

export default function StudioFatturazionePage() {
  return (
    <div>
      <p className="menuary-section-label">Dati ufficiali</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">Fatturazione del servizio</h1>
      <p className="mt-3 max-w-2xl text-[var(--menuary-muted)]">
        Questi dati compaiono sulle fatture elettroniche emesse da Menuary nei tuoi confronti e sui
        documenti contabili. Aggiornali in caso di variazioni societarie o di indirizzo PEC/SDI.
      </p>
      <div className="mt-10">
        <StudioBillingForm initial={MOCK_STUDIO_BILLING} />
      </div>
    </div>
  );
}
