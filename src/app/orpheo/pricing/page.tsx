import type { Metadata } from "next";
import { headers } from "next/headers";
import { fetchOrpheoPricingPlans, fetchPricingAddons } from "@/lib/marketing-data";
import { DEFAULT_MARKET, MARKET_HEADER, getMarket, normalizeMarketCode } from "@/lib/markets";
import { OrpheoPricingPage } from "@/components/orpheo/pages/pricing";
import { OrpheoShell } from "@/components/orpheo/orpheo-shell";
import {
  ORPHEO_MARKETING_DESCRIPTION,
  ORPHEO_ORIGIN,
  marketingLanguageAlternates,
} from "@/lib/marketing-seo";

export const metadata: Metadata = {
  title: "Prezzi Orpheo per artisti, autori e creativi",
  description: `Piani Orpheo per artisti, autori, musicisti, attori, registi e professionisti creativi: press kit, catalogo opere, booking, diritti, royalty, recensioni e fanbase. ${ORPHEO_MARKETING_DESCRIPTION}`,
  alternates: {
    canonical: `${ORPHEO_ORIGIN}/pricing`,
    languages: {
      ...marketingLanguageAlternates(ORPHEO_ORIGIN, "/pricing"),
      "x-default": `${ORPHEO_ORIGIN}/pricing`,
    },
  },
};

export default async function OrpheoPricing() {
  const market = normalizeMarketCode((await headers()).get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const [plans, addons] = await Promise.all([
    fetchOrpheoPricingPlans(market),
    fetchPricingAddons(market),
  ]);
  return (
    <OrpheoShell>
      <OrpheoPricingPage plans={plans} aiAddon={addons[0]} priceLocale={getMarket(market).locale} />
    </OrpheoShell>
  );
}
