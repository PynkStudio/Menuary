import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { LibritechBookDetailPage } from "@/components/tenants/libritech/pages/book-detail";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { libritechCatalog } from "@/lib/libritech-catalog";

export default async function BookDetailRoute({
  params,
}: {
  params: Promise<{ previewSlug: string; bookId: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);

  if (mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo") notFound();

  const { previewSlug, bookId } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug, host);

  if (tenant.previewSlug !== previewSlug) notFound();
  if (tenant.id !== "libritech" || !tenant.features.shop) notFound();
  if (!libritechCatalog.find((b) => b.id === bookId)) notFound();

  const themeVars = tenantThemeCssVars(tenant.theme);

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="min-h-screen"
        data-tenant-surface={tenant.id}
        style={themeVars as React.CSSProperties}
      >
        <LibritechBookDetailPage bookId={bookId} />
      </div>
    </TenantProvider>
  );
}
