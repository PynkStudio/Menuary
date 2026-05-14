import { Hero } from "@/components/hero";
import { ThreeSouls } from "@/components/three-souls";
import { SignatureDishes } from "@/components/signature-dishes";
import { FixedMenus } from "@/components/fixed-menus";
import { ReviewsSection } from "@/components/reviews-section";
import { FindUs } from "@/components/find-us";
import { DeliveryStrip } from "@/components/delivery-strip";

export function TenantHomePage() {
  return (
    <>
      <Hero />
      <ThreeSouls />
      <SignatureDishes />
      <FixedMenus />
      <ReviewsSection />
      <FindUs />
      <DeliveryStrip />
    </>
  );
}
