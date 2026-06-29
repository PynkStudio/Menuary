import type { Metadata } from "next";
import { fetchBizeryPricingPlans, fetchPricingAddons } from "@/lib/marketing-data";
import { BizeryPricingPage } from "@/components/bizery/pages/pricing";
import { BizeryShell } from "@/components/bizery/bizery-shell";
import { headers } from "next/headers";
import { DEFAULT_MARKET, MARKET_HEADER, getMarket, normalizeMarketCode } from "@/lib/markets";
import { getLocale, getTranslations } from "@/i18n";
import {
  BIZERY_ORIGIN,
  marketingAlternates,
} from "@/lib/marketing-seo";

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getTranslations("bizery")).seo.pricing;
  return {
    title: seo.title,
    description: seo.description,
    alternates: marketingAlternates(BIZERY_ORIGIN, "/pricing", await getLocale()),
  };
}

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
