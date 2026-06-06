import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import { BIZERY_ORIGIN, MENUARY_ORIGIN, ORPHEO_ORIGIN } from "@/lib/marketing-seo";
import { siteConfig } from "@/lib/site-config";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  const origin =
    mode === "marketing"
      ? MENUARY_ORIGIN
      : mode === "marketing-bizery"
        ? BIZERY_ORIGIN
        : mode === "marketing-orpheo"
          ? ORPHEO_ORIGIN
          : siteConfig.url;
  const isPreview = mode === "preview" || mode === "preview-bizery";

  return {
    rules: {
      userAgent: "*",
      ...(isPreview ? { disallow: "/" } : { allow: "/" }),
    },
    ...(isPreview ? {} : { sitemap: `${origin}/sitemap.xml` }),
  };
}
