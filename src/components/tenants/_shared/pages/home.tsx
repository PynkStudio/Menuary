"use client";

import { Hero } from "@/components/tenants/_shared/hero";
import { ThreeSouls } from "@/components/tenants/_shared/three-souls";
import { SignatureDishes } from "@/components/tenants/_shared/signature-dishes";
import { FixedMenus } from "@/components/tenants/_shared/fixed-menus";
import { ReviewsSection } from "@/components/modules/reviews/reviews-section";
import { FindUs } from "@/components/modules/reservations/find-us";
import { DeliveryStrip } from "@/components/modules/shop/delivery-strip";
import { useTenant } from "@/components/core/tenant-provider";
import { DocaAbout } from "@/components/tenants/doca/doca-about";

export function TenantHomePage() {
  const tenant = useTenant();

  return (
    <>
      <Hero />
      <ThreeSouls />
      {tenant.id === "doca" && <DocaAbout />}
      {tenant.id !== "doca" && <SignatureDishes />}
      {tenant.id === "bepork" && <FixedMenus />}
      <ReviewsSection />
      <FindUs />
      <DeliveryStrip />
    </>
  );
}
