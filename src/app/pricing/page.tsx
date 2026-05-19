import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { fetchPricingPlans } from "@/lib/marketing-data";
import { MarketingPricingPage, PRICING_FAQ } from "@/components/marketing/pages/pricing";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  FAQSection,
  FinalCTASection,
} from "@/components/marketing/marketing-sections";

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
  return (
    <MarketingShell>
      <MarketingPricingPage plans={plans} />
      <FAQSection
        items={PRICING_FAQ}
        title="Tutto quello che vuoi sapere prima di iniziare."
      />
      <FinalCTASection />
    </MarketingShell>
  );
}
