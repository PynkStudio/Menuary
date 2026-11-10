import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { ComponiBody } from "@/app/componi/componi-body";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { resolveTenantFeatures } from "@/lib/tenant-modules";
import { getTenantDishRecipes } from "@/lib/dish-builder/tenant-recipes";
import { dishText } from "@/lib/dish-builder/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}): Promise<Metadata> {
  const tenant = resolveTenantFromPreviewSlug((await params).previewSlug);
  const recipe = tenant ? getTenantDishRecipes(tenant.id)[0] : null;
  return {
    title: recipe ? `${dishText(recipe.title, "it")} · ${tenant?.name}` : "Componi",
    robots: { index: false, follow: false },
  };
}

export default async function PreviewTenantComponi({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  const isLocalPreviewDev = host?.includes("localhost") || host?.includes("127.0.0.1");
  if (mode !== "preview" && !isLocalPreviewDev) notFound();

  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (!tenant || tenant.previewSlug !== previewSlug) notFound();
  if (!resolveTenantFeatures(tenant.features).dishBuilder || getTenantDishRecipes(tenant.id).length === 0) notFound();
  const themeVars = tenantThemeCssVars(tenant.theme);

  return (
    <TenantProvider tenant={tenant}>
      <div className="tenant-preview-surface min-h-screen" data-tenant-surface={tenant.id} style={themeVars as React.CSSProperties}>
        <ComponiBody />
      </div>
    </TenantProvider>
  );
}
