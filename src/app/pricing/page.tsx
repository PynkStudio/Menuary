import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { fetchPricingPlans } from "@/lib/marketing-data";
import { MarketingPricingPage } from "@/components/marketing/pages/pricing";

export const metadata: Metadata = {
  title: "Offerta",
  description:
    "Tre piani Menuary per ristoranti di ogni dimensione: sito su misura, prenotazioni e gestionale completo. Prezzi chiari, zero commissioni.",
};

export default async function PricingPage() {
  if (getPlatformModeFromHost((await headers()).get("host")) !== "marketing") {
    notFound();
  }
  const plans = await fetchPricingPlans();
  return <MarketingPricingPage plans={plans} />;
}
