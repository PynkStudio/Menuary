import type { Metadata } from "next";
import { headers } from "next/headers";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import {
  BIZERY_MARKETING_DESCRIPTION,
  BIZERY_ORIGIN,
  MENUARY_MARKETING_DESCRIPTION,
  MENUARY_ORIGIN,
  marketingLanguageAlternates,
} from "@/lib/marketing-seo";
import { MarketingContactsPage } from "@/components/marketing/pages/contatti";
import { BeporkContactsPage } from "@/components/tenants/bepork/pages/contatti";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  return mode === "marketing"
    ? {
        title: "Contatti per siti web ristoranti",
        description: `Raccontaci il tuo ristorante, bar o pizzeria e scopri come Menuary può trasformarlo in un sito su misura. ${MENUARY_MARKETING_DESCRIPTION}`,
        alternates: {
          canonical: `${MENUARY_ORIGIN}/contatti`,
          languages: {
            ...marketingLanguageAlternates(MENUARY_ORIGIN, "/contatti"),
            "x-default": `${MENUARY_ORIGIN}/contatti`,
          },
        },
      }
    : mode === "marketing-bizery"
      ? {
        title: "Contatti per siti web aziende",
        description: `Raccontaci il tuo studio, salone o azienda di servizi e scopri come Bizery può trasformarlo in un sito su misura. ${BIZERY_MARKETING_DESCRIPTION}`,
        alternates: {
          canonical: `${BIZERY_ORIGIN}/contatti`,
          languages: {
            ...marketingLanguageAlternates(BIZERY_ORIGIN, "/contatti"),
            "x-default": `${BIZERY_ORIGIN}/contatti`,
          },
        },
      }
    : {
        title: "Contatti & Prenotazioni",
        description:
          "Prenota da Be Pork su WhatsApp o chiamaci. Via Quintino Sella 128, 70123 Bari. Orari, mappa, social.",
      };
}

export default async function ContattiPage() {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  return mode === "marketing" ? <MarketingContactsPage /> : <BeporkContactsPage />;
}
