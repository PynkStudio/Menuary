import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import { BIZERY_ORIGIN, MENUARY_ORIGIN, ORPHEO_ORIGIN } from "@/lib/marketing-seo";
import { siteConfig } from "@/lib/site-config";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  const host = h.get("host");
  // Stesso calcolo origin di sitemap.ts: sui domini custom dei tenant serve l'host
  // reale, non siteConfig.url (fallback demo BePork) altrimenti il robots.txt
  // dichiara la sitemap di un altro tenant.
  const origin =
    mode === "marketing"
      ? MENUARY_ORIGIN
      : mode === "marketing-bizery"
        ? BIZERY_ORIGIN
        : mode === "marketing-orpheo"
          ? ORPHEO_ORIGIN
          : (() => {
              const tenant = resolveTenantFromHost(host);
              const tenantLocaleConfig = getTenantLocaleConfig(tenant.id);
              return tenantLocaleConfig && host
                ? `${host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https"}://${host}`
                : siteConfig.url;
            })();
  const isPreview = mode === "preview" || mode === "preview-bizery" || mode === "preview-orpheo";

  return {
    rules: {
      userAgent: "*",
      ...(isPreview ? { disallow: "/" } : { allow: "/" }),
    },
    ...(isPreview ? {} : { sitemap: `${origin}/sitemap.xml` }),
  };
}
