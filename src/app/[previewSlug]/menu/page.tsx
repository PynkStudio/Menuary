import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/tenant-provider";
import { MenuPageShell } from "@/components/menu-page-shell";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";

export default async function PreviewTenantMenu({
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
        <MenuPageShell />
      </div>
    </TenantProvider>
  );
}
