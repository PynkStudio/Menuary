import type { Metadata } from "next";
import { headers } from "next/headers";
import { DynamicPolicyDocument } from "@/components/legal/dynamic-policy-document";
import { tenantPolicyMetadata } from "@/lib/legal/tenant-policy-metadata";
import { getPlatformModeFromHost } from "@/lib/platform";
import { MenuaryCookiePage } from "@/components/marketing/pages/legal";
import { MENUARY_ORIGIN } from "@/lib/marketing-seo";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  if (getPlatformModeFromHost(host) === "marketing") {
    return {
      title: "Cookie policy",
      description:
        "Quali cookie usa il sito menuary.it, a cosa servono e come gestirli: solo cookie tecnici di lingua e mercato, statistiche senza cookie.",
      alternates: { canonical: `${MENUARY_ORIGIN}/cookie` },
    };
  }
  return tenantPolicyMetadata("cookie");
}

export default async function CookiePolicyPage() {
  const host = (await headers()).get("host");
  // menuary.it non ha un prefisso di route dedicato (a differenza di bizery.it
  // e weuseorpheo.com): senza questo branch la route mostrerebbe la cookie
  // policy del tenant demo di default invece di quella della piattaforma.
  if (getPlatformModeFromHost(host) === "marketing") {
    return <MenuaryCookiePage />;
  }

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
            decidi di usare durante la navigazione.
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
