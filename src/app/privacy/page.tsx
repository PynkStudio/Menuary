import type { Metadata } from "next";
import { headers } from "next/headers";
import { DynamicPolicyDocument } from "@/components/legal/dynamic-policy-document";
import { tenantPolicyMetadata } from "@/lib/legal/tenant-policy-metadata";
import { getPlatformModeFromHost } from "@/lib/platform";
import { MenuaryPrivacyPage } from "@/components/marketing/pages/legal";
import { MENUARY_ORIGIN } from "@/lib/marketing-seo";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  if (getPlatformModeFromHost(host) === "marketing") {
    return {
      title: "Informativa sulla privacy",
      description:
        "Come Menuary tratta i dati personali raccolti attraverso il sito menuary.it: dati, finalità, conservazione e diritti degli interessati.",
      alternates: { canonical: `${MENUARY_ORIGIN}/privacy` },
    };
  }
  return tenantPolicyMetadata("privacy");
}

export default async function PrivacyPage() {
  const host = (await headers()).get("host");
  // menuary.it non ha un prefisso di route dedicato (a differenza di bizery.it
  // e weuseorpheo.com): senza questo branch la route mostrerebbe la privacy
  // del tenant demo di default invece di quella della piattaforma.
  if (getPlatformModeFromHost(host) === "marketing") {
    return <MenuaryPrivacyPage />;
  }

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
            locale.
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
