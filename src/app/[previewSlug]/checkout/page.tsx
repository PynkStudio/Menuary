import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { LibritechCheckoutPage } from "@/components/tenants/libritech/pages/checkout";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";

export default async function CheckoutRoute({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);

  if (mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo") notFound();

  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug);

  if (!tenant || tenant.previewSlug !== previewSlug) notFound();
  if (tenant.id !== "libritech" || !tenant.features.shop) notFound();

  const themeVars = tenantThemeCssVars(tenant.theme);

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="min-h-screen"
        data-tenant-surface={tenant.id}
        style={themeVars as React.CSSProperties}
      >
        <LibritechCheckoutPage />
      </div>
    </TenantProvider>
  );
}
