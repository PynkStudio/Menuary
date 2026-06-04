import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { MenuPageShell } from "@/components/modules/menu/menu-page-shell";
import { Footer } from "@/components/tenant-shell/footer";
import { Navbar } from "@/components/tenant-shell/navbar";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";

export default async function PreviewTenantMenu({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  const isLocalPreviewDev =
    host?.includes("localhost") || host?.includes("127.0.0.1");
  if (mode !== "preview" && !isLocalPreviewDev) notFound();

  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug, host);
  if (tenant.previewSlug !== previewSlug) notFound();
  const themeVars = tenantThemeCssVars(tenant.theme);

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="tenant-preview-surface min-h-screen"
        data-tenant-surface={tenant.id}
        style={themeVars as React.CSSProperties}
      >
        <Navbar />
        <MenuPageShell />
        <Footer />
      </div>
    </TenantProvider>
  );
}
