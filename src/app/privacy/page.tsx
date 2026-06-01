import type { Metadata } from "next";
import { DynamicPolicyDocument } from "@/components/legal/dynamic-policy-document";
import { tenantPolicyMetadata } from "@/lib/legal/tenant-policy-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return tenantPolicyMetadata("privacy");
}

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-pork-ink pt-28 pb-14 text-pork-cream md:pt-36 md:pb-20">
        <div className="container-wide">
          <span className="chip-mustard">Privacy</span>
          <h1 className="headline mt-4 max-w-3xl text-5xl text-balance sm:text-6xl md:text-7xl">
            Informativa sulla privacy
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pork-cream/75">
            Trasparenza sul trattamento dei dati in relazione al sito e ai servizi digitali del
            locale. Alcune parti si adattano automaticamente ai moduli attivi (asporto, tavolo,
            cucina).
          </p>
        </div>
      </section>

      <section className="bg-pork-cream py-16 md:py-24">
        <div className="container-wide max-w-3xl">
          <DynamicPolicyDocument variant="privacy" />
        </div>
      </section>
    </>
  );
}
