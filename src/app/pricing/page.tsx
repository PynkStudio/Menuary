import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { fetchPricingAddons, fetchPricingPlans } from "@/lib/marketing-data";
import { DEFAULT_MARKET, MARKET_HEADER, normalizeMarketCode } from "@/lib/markets";
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
  const h = await headers();
  if (getPlatformModeFromHost(h.get("host")) !== "marketing") {
    notFound();
  }
  const market = normalizeMarketCode(h.get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const [plans, addons] = await Promise.all([
    fetchPricingPlans(market),
    fetchPricingAddons(market),
  ]);
  return (
    <MarketingShell>
      <MarketingPricingPage plans={plans} aiAddon={addons[0]} />
      <FAQSection
        items={PRICING_FAQ}
        title="Tutto quello che vuoi sapere prima di iniziare."
      />
      <FinalCTASection />
    </MarketingShell>
  );
}
