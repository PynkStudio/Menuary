import { fetchBizeryPricingPlans } from "@/lib/marketing-data";
import { BizeryPricingPage } from "@/components/bizery/pages/pricing";

export default async function BizeryPricing() {
  const plans = await fetchBizeryPricingPlans();
  return <BizeryPricingPage plans={plans} />;
}
