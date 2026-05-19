import { fetchBizeryPricingPlans } from "@/lib/marketing-data";
import { BizeryPricingPage } from "@/components/bizery/pages/pricing";
import { BizeryShell } from "@/components/bizery/bizery-shell";

export default async function BizeryPricing() {
  const plans = await fetchBizeryPricingPlans();
  return (
    <BizeryShell>
      <BizeryPricingPage plans={plans} />
    </BizeryShell>
  );
}
