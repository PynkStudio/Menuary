import type { Metadata } from "next";
import { headers } from "next/headers";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import {
  BIZERY_ORIGIN,
  MENUARY_ORIGIN,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale } from "@/i18n";
import { MarketingAboutPage } from "@/components/marketing/pages/chi-siamo";
import { BizeryAboutPage } from "@/components/bizery/pages/chi-siamo";
import { BeporkAboutPage } from "@/components/tenants/bepork/pages/chi-siamo";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  if (mode === "marketing") {
    return {
      title: "Studio per siti web ristoranti",
      description:
        "Menuary è uno studio digitale per ristoranti, bar, pizzerie e locali. Disegniamo siti web su misura e li teniamo vivi nel tempo.",
      alternates: marketingAlternates(MENUARY_ORIGIN, "/chi-siamo", await getLocale()),
    };
  }
  if (mode === "marketing-bizery") {
    return {
      title: "Studio per siti web aziende di servizi",
      description:
        "Bizery è la piattaforma digitale per studi medici, saloni, barbieri, studi legali, commercialisti e aziende di servizi. Siti su misura, appuntamenti e presenza locale in un posto solo.",
      alternates: marketingAlternates(BIZERY_ORIGIN, "/chi-siamo", await getLocale()),
    };
  }
  return {
    title: "Chi siamo",
    description:
      "Be Pork è un ristorante, pizzeria e burger house nel centro di Bari. Tre anime, una casa: Burger House, Pizza House e cucina pugliese.",
  };
}

export default async function ChiSiamoPage() {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  if (mode === "marketing") return <MarketingAboutPage />;
  if (mode === "marketing-bizery") return <BizeryAboutPage />;
  return <BeporkAboutPage />;
}
