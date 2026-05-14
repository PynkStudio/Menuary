import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { MarketingPricingPage } from "@/components/marketing/pages/pricing";

export const metadata: Metadata = {
  title: "Offerta",
  description:
    "Tre piani Menuary per ristoranti di ogni dimensione: sito su misura, prenotazioni, ordini e gestione completa. Prezzi chiari, zero commissioni su ordini e prenotazioni.",
};

export default async function PricingPage() {
  if (getPlatformModeFromHost((await headers()).get("host")) !== "marketing") {
    notFound();
  }
  return <MarketingPricingPage />;
}
