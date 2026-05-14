import { Hero } from "@/components/tenants/_shared/hero";
import { ThreeSouls } from "@/components/tenants/_shared/three-souls";
import { SignatureDishes } from "@/components/tenants/_shared/signature-dishes";
import { FixedMenus } from "@/components/tenants/_shared/fixed-menus";
import { ReviewsSection } from "@/components/modules/reviews/reviews-section";
import { FindUs } from "@/components/modules/reservations/find-us";
import { DeliveryStrip } from "@/components/modules/shop/delivery-strip";

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
