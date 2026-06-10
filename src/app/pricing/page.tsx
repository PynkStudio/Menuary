import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { fetchPricingAddons, fetchPricingPlans } from "@/lib/marketing-data";
import { DEFAULT_MARKET, MARKET_HEADER, getMarket, normalizeMarketCode } from "@/lib/markets";
import { getLocale, getTranslations } from "@/i18n";
import {
  MENUARY_MARKETING_DESCRIPTION,
  MENUARY_ORIGIN,
  marketingLanguageAlternates,
} from "@/lib/marketing-seo";
import { MarketingPricingPage } from "@/components/marketing/pages/pricing";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  FAQSection,
  FinalCTASection,
} from "@/components/marketing/marketing-sections";

export const metadata: Metadata = {
  title: "Prezzi siti web per ristoranti",
  description:
    `Tre piani Menuary per ristoranti, bar e pizzerie: sito su misura, menu digitale, prenotazioni e gestionale completo. ${MENUARY_MARKETING_DESCRIPTION}`,
  alternates: {
    canonical: `${MENUARY_ORIGIN}/pricing`,
    languages: {
      ...marketingLanguageAlternates(MENUARY_ORIGIN, "/pricing"),
      "x-default": `${MENUARY_ORIGIN}/pricing`,
    },
  },
};

export default async function PricingPage() {
  const h = await headers();
  if (getPlatformModeFromHost(h.get("host")) !== "marketing") {
    notFound();
  }
  const market = normalizeMarketCode(h.get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const locale = await getLocale();
  const marketing = await getTranslations("marketing");
  const pricingCopy = marketing.pricing;
  const [plans, addons] = await Promise.all([
    fetchPricingPlans(market),
    fetchPricingAddons(market),
  ]);
  return (
    <MarketingShell>
      <MarketingPricingPage
        plans={plans}
        aiAddon={addons[0]}
        locale={locale}
        priceLocale={getMarket(market).locale}
        copy={pricingCopy}
      />
      <FAQSection items={pricingCopy.faq.items} title={pricingCopy.faq.title} />
      <FinalCTASection />
    </MarketingShell>
  );
}
