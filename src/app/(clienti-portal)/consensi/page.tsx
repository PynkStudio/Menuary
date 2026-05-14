import type { Metadata } from "next";
import Link from "next/link";
import { ClientsConsentPanel } from "@/components/clients/clients-consent-panel";
import { MOCK_MARKETING_CONSENTS, MOCK_SHARED_RESTAURANTS } from "@/lib/clients-mock-data";

export const metadata: Metadata = {
  title: "Privacy e consensi",
};

export default function ClientiConsensiPage() {
  return (
    <div>
      <p className="menuary-section-label">Trattamento dati</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">Privacy e consensi</h1>
      <p className="mt-3 max-w-2xl text-[var(--menuary-muted)]">
        Gestisci i consensi per finalità di marketing. Le informative complete restano su{" "}
        <Link href="https://menuary.it/privacy" className="menuary-link text-sm">
          menuary.it/privacy
        </Link>{" "}
        e sulle policy dei singoli ristoranti.
      </p>
      <div className="mt-10">
        <ClientsConsentPanel
          initial={MOCK_MARKETING_CONSENTS}
          restaurants={MOCK_SHARED_RESTAURANTS}
        />
      </div>
    </div>
  );
}
