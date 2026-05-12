import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/tenant-provider";
import { Hero } from "@/components/hero";
import { ThreeSouls } from "@/components/three-souls";
import { SignatureDishes } from "@/components/signature-dishes";
import { FixedMenus } from "@/components/fixed-menus";
import { ReviewsSection } from "@/components/reviews-section";
import { FindUs } from "@/components/find-us";
import { DeliveryStrip } from "@/components/delivery-strip";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";

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

  return (
    <TenantProvider tenant={tenant}>
      <Hero />
      <ThreeSouls />
      <SignatureDishes />
      <FixedMenus />
      <ReviewsSection />
      <FindUs />
      <DeliveryStrip />
    </TenantProvider>
  );
}
