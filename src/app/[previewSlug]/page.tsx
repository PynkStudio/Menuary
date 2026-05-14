import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { Hero } from "@/components/tenants/_shared/hero";
import { ThreeSouls } from "@/components/tenants/_shared/three-souls";
import { SignatureDishes } from "@/components/tenants/_shared/signature-dishes";
import { FixedMenus } from "@/components/tenants/_shared/fixed-menus";
import { ReviewsSection } from "@/components/modules/reviews/reviews-section";
import { FindUs } from "@/components/modules/reservations/find-us";
import { DeliveryStrip } from "@/components/modules/shop/delivery-strip";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";

export default async function PreviewTenantHome({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const host = (await headers()).get("host");
  if (getPlatformModeFromHost(host) !== "preview") notFound();

  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (tenant.previewSlug !== previewSlug) notFound();
  const themeVars = tenantThemeCssVars(tenant.theme);

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="tenant-preview-surface min-h-screen"
        data-tenant-surface={tenant.id}
        style={themeVars as React.CSSProperties}
      >
        <Hero />
        <ThreeSouls />
        <SignatureDishes />
        <FixedMenus />
        <ReviewsSection />
        <FindUs />
        <DeliveryStrip />
      </div>
    </TenantProvider>
  );
}
