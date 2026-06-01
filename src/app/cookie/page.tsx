import type { Metadata } from "next";
import { DynamicPolicyDocument } from "@/components/legal/dynamic-policy-document";
import { tenantPolicyMetadata } from "@/lib/legal/tenant-policy-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return tenantPolicyMetadata("cookie");
}

export default function CookiePolicyPage() {
  return (
    <>
      <section className="bg-pork-ink pt-28 pb-14 text-pork-cream md:pt-36 md:pb-20">
        <div className="container-wide">
          <span className="chip-mustard">Cookie</span>
          <h1 className="headline mt-4 max-w-3xl text-5xl text-balance sm:text-6xl md:text-7xl">
            Cookie e tecnologie locali
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pork-cream/75">
            Come utilizziamo cookie, storage del browser e strumenti collegati alle funzioni che
            decidi di usare (menu, preferiti, ordine). Le sezioni operative variano se asporto o
            tavolo sono attivi.
          </p>
        </div>
      </section>

      <section className="bg-pork-cream py-16 md:py-24">
        <div className="container-wide max-w-3xl">
          <DynamicPolicyDocument variant="cookie" />
        </div>
      </section>
    </>
  );
}
