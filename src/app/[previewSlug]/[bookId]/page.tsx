import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { LibritechBookDetailPage } from "@/components/tenants/libritech/pages/book-detail";
import { ValentinaOrciuoliStaticPage } from "@/components/tenants/valentina-orciuoli/pages/static-page";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { libritechCatalog } from "@/lib/libritech-catalog";

const valentinaPages = new Set(["libri", "autrice", "eventi", "contatti", "link"]);

export default async function BookDetailRoute({
  params,
}: {
  params: Promise<{ previewSlug: string; bookId: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  const isLocalPreviewDev =
    host?.includes("localhost") || host?.includes("127.0.0.1");

  if (mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo" && !isLocalPreviewDev) notFound();

  const { previewSlug, bookId } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug, host);

  if (tenant.previewSlug !== previewSlug) notFound();

  const themeVars = tenantThemeCssVars(tenant.theme);

  if (tenant.id === "valentina-orciuoli" && valentinaPages.has(bookId)) {
    return (
      <TenantProvider tenant={tenant}>
        <div
          className="min-h-screen"
          data-tenant-surface={tenant.id}
          style={themeVars as React.CSSProperties}
        >
          <ValentinaOrciuoliStaticPage page={bookId as "libri" | "autrice" | "eventi" | "contatti" | "link"} />
        </div>
      </TenantProvider>
    );
  }

  if (tenant.id !== "libritech" || !tenant.features.shop) notFound();
  if (!libritechCatalog.find((b) => b.id === bookId)) notFound();

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
