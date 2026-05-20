import { fetchBizeryPricingPlans, fetchPricingAddons } from "@/lib/marketing-data";
import { BizeryPricingPage } from "@/components/bizery/pages/pricing";
import { BizeryShell } from "@/components/bizery/bizery-shell";
import { headers } from "next/headers";
import { DEFAULT_MARKET, MARKET_HEADER, normalizeMarketCode } from "@/lib/markets";

export default async function BizeryPricing() {
  const market = normalizeMarketCode((await headers()).get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const [plans, addons] = await Promise.all([
    fetchBizeryPricingPlans(market),
    fetchPricingAddons(market),
  ]);
  return (
    <BizeryShell>
      <BizeryPricingPage plans={plans} aiAddon={addons[0]} />
    </BizeryShell>
  );
}
