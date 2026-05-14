import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPlatformModeFromHost } from "@/lib/platform";
import { MarketingAboutPage } from "@/components/marketing/pages/chi-siamo";
import { BeporkAboutPage } from "@/components/tenants/bepork/pages/chi-siamo";

export async function generateMetadata(): Promise<Metadata> {
  const mode = getPlatformModeFromHost((await headers()).get("host"));
  return mode === "marketing"
    ? {
        title: "Studio",
        description:
          "Menuary è uno studio digitale per ristoranti. Disegniamo siti su misura e li teniamo vivi nel tempo, un locale alla volta.",
      }
    : {
        title: "Chi siamo",
        description:
          "Be Pork è un ristorante, pizzeria e burger house nel centro di Bari. Tre anime, una casa: Burger House, Pizza House e cucina pugliese.",
      };
}

export default async function ChiSiamoPage() {
  const mode = getPlatformModeFromHost((await headers()).get("host"));
  return mode === "marketing" ? <MarketingAboutPage /> : <BeporkAboutPage />;
}
