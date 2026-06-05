"use client";

import { usePathname } from "next/navigation";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { useTenantLanguagePreference } from "@/lib/tenant-i18n";
import { localizeTenantHref, tenantLocaleFromPath } from "@/lib/tenant-localized-path";

export function useTenantLocalizedHref() {
  const pathname = usePathname() ?? "/";
  const tenant = useTenant();
  const config = getTenantLocaleConfig(tenant.id);
  const isPreviewPath = !!tenant.previewSlug && pathname.startsWith(`/${tenant.previewSlug}`);
  const previewSlug = isPreviewPath ? tenant.previewSlug : undefined;
  const preferredLocale = useTenantLanguagePreference({
    tenantId: tenant.id,
    defaultLanguage: config?.defaultLocale ?? "it",
    supportedLanguages: config?.locales ?? ["it"],
  });
  const locale =
    tenantLocaleFromPath(pathname, tenant.id, previewSlug) ??
    preferredLocale ??
    config?.defaultLocale ??
    null;

  return (href: string) =>
    config && locale
      ? localizeTenantHref({ href, locale, previewSlug })
      : href;
}
