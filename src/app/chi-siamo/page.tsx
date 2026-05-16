import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPlatformModeFromHost } from "@/lib/platform";
import { MarketingAboutPage } from "@/components/marketing/pages/chi-siamo";
import { BizeryAboutPage } from "@/components/bizery/pages/chi-siamo";
import { BeporkAboutPage } from "@/components/tenants/bepork/pages/chi-siamo";

export async function generateMetadata(): Promise<Metadata> {
  const mode = getPlatformModeFromHost((await headers()).get("host"));
  if (mode === "marketing") {
    return {
      title: "Studio",
      description:
        "Menuary è uno studio digitale per ristoranti. Disegniamo siti su misura e li teniamo vivi nel tempo, un locale alla volta.",
    };
  }
  if (mode === "marketing-bizery") {
    return {
      title: "Studio",
      description:
        "Bizery è la piattaforma digitale per studi professionali e aziende di servizi. Siti su misura, appuntamenti e presenza locale gestita in un posto solo.",
    };
  }
  return {
    title: "Chi siamo",
    description:
      "Be Pork è un ristorante, pizzeria e burger house nel centro di Bari. Tre anime, una casa: Burger House, Pizza House e cucina pugliese.",
  };
}

export default async function ChiSiamoPage() {
  const mode = getPlatformModeFromHost((await headers()).get("host"));
  if (mode === "marketing") return <MarketingAboutPage />;
  if (mode === "marketing-bizery") return <BizeryAboutPage />;
  return <BeporkAboutPage />;
}
