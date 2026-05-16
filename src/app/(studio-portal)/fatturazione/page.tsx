import { headers } from "next/headers";
import type { Metadata } from "next";
import { getPlatformModeFromHost } from "@/lib/platform";
import { StudioBillingForm } from "@/components/studio/studio-billing-form";
import { MOCK_STUDIO_BILLING } from "@/lib/studio-mock-data";
import { BizeryStudioBillingForm } from "@/components/bizery-studio/bizery-studio-billing-form";
import { MOCK_BIZERY_STUDIO_BILLING } from "@/lib/bizery-studio-mock-data";

export const metadata: Metadata = {
  title: "Fatturazione",
};

export default async function StudioFatturazionePage() {
  const mode = getPlatformModeFromHost((await headers()).get("host"));

  if (mode === "studio-bizery") {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--bs-accent)]">Dati ufficiali</p>
        <h1
          className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
        >
          Fatturazione del servizio
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--bs-muted)]">
          Questi dati compaiono sulle fatture elettroniche emesse da Bizery nei tuoi confronti e sui
          documenti contabili. Aggiornali in caso di variazioni societarie o di indirizzo PEC/SDI.
        </p>
        <div className="mt-10">
          <BizeryStudioBillingForm initial={MOCK_BIZERY_STUDIO_BILLING} />
        </div>
      </div>
    );
  }

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
