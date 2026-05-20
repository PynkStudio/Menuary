import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import { BIZERY_ORIGIN, MENUARY_ORIGIN, marketingSitemap } from "@/lib/marketing-seo";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  if (mode === "marketing") return marketingSitemap(MENUARY_ORIGIN);
  if (mode === "marketing-bizery") return marketingSitemap(BIZERY_ORIGIN);

  const base = siteConfig.url;
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
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/menu" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
