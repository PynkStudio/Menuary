import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import { BIZERY_ORIGIN, MENUARY_ORIGIN, marketingSitemap } from "@/lib/marketing-seo";
import { siteConfig } from "@/lib/site-config";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  if (mode === "marketing") return marketingSitemap(MENUARY_ORIGIN);
  if (mode === "marketing-bizery") return marketingSitemap(BIZERY_ORIGIN);
  if (mode === "preview" || mode === "preview-bizery") return [];

  const host = h.get("host");
  const tenant = resolveTenantFromHost(host);
  const tenantLocaleConfig = getTenantLocaleConfig(tenant.id);
  const base =
    tenantLocaleConfig && host
      ? `${host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https"}://${host}`
      : siteConfig.url;
  const routes = [
    "",
    "/menu",
    "/chi-siamo",
    "/galleria",
    "/recensioni",
    "/contatti",
    "/privacy",
    "/cookie",
  ];
  const localizedRoutes = tenantLocaleConfig
    ? tenantLocaleConfig.locales.flatMap((locale) => routes.map((path) => `/${locale}${path}`))
    : routes;
  return localizedRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/menu" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
