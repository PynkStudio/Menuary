import type { Metadata } from "next";
import { headers } from "next/headers";
import { fetchOrpheoPricingPlans, fetchPricingAddons } from "@/lib/marketing-data";
import { DEFAULT_MARKET, MARKET_HEADER, getMarket, normalizeMarketCode } from "@/lib/markets";
import { OrpheoPricingPage } from "@/components/orpheo/pages/pricing";
import { OrpheoShell } from "@/components/orpheo/orpheo-shell";
import {
  ORPHEO_ORIGIN,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale, getTranslations } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getTranslations("orpheo")).seo.pricing;
  return {
    title: seo.title,
    description: seo.description,
    alternates: marketingAlternates(ORPHEO_ORIGIN, "/pricing", await getLocale()),
  };
}

export default async function OrpheoPricing() {
  const market = normalizeMarketCode((await headers()).get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const [plans, addons, locale] = await Promise.all([
    fetchOrpheoPricingPlans(market),
    fetchPricingAddons(market),
    getLocale(),
  ]);
  return (
    <OrpheoShell>
      <OrpheoPricingPage
        plans={plans}
        aiAddon={addons[0]}
        priceLocale={getMarket(market).locale}
        locale={locale}
      />
    </OrpheoShell>
  );
}
