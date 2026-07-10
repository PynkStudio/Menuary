import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTenantContent } from "@/lib/tenant-content";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { tenantLanguageAlternates } from "@/lib/tenant-localized-path";
import { findTenantById } from "@/lib/tenant-registry";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";

export async function tenantPolicyMetadata(
  page: "privacy" | "cookie",
): Promise<Metadata> {
  const h = await headers();
  const host = h.get("host");
  const tenant =
    findTenantById(h.get("x-preview-tenant-id") ?? "") ??
    resolveTenantFromHost(host);
  if (!tenant) {
    return {
      title: page === "privacy" ? "Privacy policy" : "Cookie policy",
      robots: { index: false, follow: false },
    };
  }
  const isPreview = Boolean(h.get("x-preview-tenant-id"));
  const content = getTenantContent(tenant.id);
  const localeConfig = getTenantLocaleConfig(tenant.id);
  const publicPath = h.get("x-tenant-public-path") ?? `/${page}`;
  const origin =
    localeConfig && host
      ? `${host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https"}://${host}`
      : content.url;
  const previewSlug =
    tenant.previewSlug && publicPath.startsWith(`/${tenant.previewSlug}/`)
      ? tenant.previewSlug
      : undefined;

  return {
    title: page === "privacy" ? "Privacy policy" : "Cookie policy",
    description:
      page === "privacy"
        ? `Informativa sul trattamento dei dati personali - ${tenant.name}.`
        : `Cookie e tecnologie sul dispositivo - ${tenant.name}.`,
    ...(isPreview
      ? {
          robots: {
            index: false,
            follow: false,
            nocache: true,
          },
        }
      : {}),
    alternates: {
      canonical: `${origin}${publicPath}`,
      ...(localeConfig
        ? {
            languages: tenantLanguageAlternates({
              origin,
              pathname: publicPath,
              previewSlug,
              locales: localeConfig.locales,
              defaultLocale: localeConfig.defaultLocale,
            }),
          }
        : {}),
    },
  };
}
