import type { Metadata } from "next";
import { fetchBizeryPricingPlans, fetchPricingAddons } from "@/lib/marketing-data";
import { BizeryPricingPage } from "@/components/bizery/pages/pricing";
import { BizeryShell } from "@/components/bizery/bizery-shell";
import { headers } from "next/headers";
import { DEFAULT_MARKET, MARKET_HEADER, getMarket, normalizeMarketCode } from "@/lib/markets";
import { getLocale } from "@/i18n";
import {
  BIZERY_MARKETING_DESCRIPTION,
  BIZERY_ORIGIN,
  marketingLanguageAlternates,
} from "@/lib/marketing-seo";

export const metadata: Metadata = {
  title: "Prezzi siti web per studi, saloni e aziende",
  description: `Piani Bizery per studi medici, saloni di bellezza, barbieri, studi legali, commercialisti e aziende di servizi: sito, appuntamenti, listino e CRM. ${BIZERY_MARKETING_DESCRIPTION}`,
  alternates: {
    canonical: `${BIZERY_ORIGIN}/pricing`,
    languages: {
      ...marketingLanguageAlternates(BIZERY_ORIGIN, "/pricing"),
      "x-default": `${BIZERY_ORIGIN}/pricing`,
    },
  },
};

export default async function BizeryPricing() {
  const market = normalizeMarketCode((await headers()).get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const locale = await getLocale();
  const [plans, addons] = await Promise.all([
    fetchBizeryPricingPlans(market),
    fetchPricingAddons(market),
  ]);
  return (
    <BizeryShell>
      <BizeryPricingPage plans={plans} aiAddon={addons[0]} locale={locale} priceLocale={getMarket(market).locale} />
    </BizeryShell>
  );
}
