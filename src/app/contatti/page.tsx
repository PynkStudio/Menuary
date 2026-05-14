import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPlatformModeFromHost } from "@/lib/platform";
import { MarketingContactsPage } from "@/components/marketing/pages/contatti";
import { BeporkContactsPage } from "@/components/tenants/bepork/pages/contatti";

export async function generateMetadata(): Promise<Metadata> {
  const mode = getPlatformModeFromHost((await headers()).get("host"));
  return mode === "marketing"
    ? {
        title: "Contatti",
        description:
          "Raccontaci il tuo ristorante e scopri come Menuary può trasformarlo in un sito su misura.",
      }
    : {
        title: "Contatti & Prenotazioni",
        description:
          "Prenota da Be Pork su WhatsApp o chiamaci. Via Quintino Sella 128, 70123 Bari. Orari, mappa, social.",
      };
}

export default async function ContattiPage() {
  const mode = getPlatformModeFromHost((await headers()).get("host"));
  return mode === "marketing" ? <MarketingContactsPage /> : <BeporkContactsPage />;
}
