"use client";

import { usePathname } from "next/navigation";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { localizeTenantHref, tenantLocaleFromPath } from "@/lib/tenant-localized-path";

export function useTenantLocalizedHref() {
  const pathname = usePathname() ?? "/";
  const tenant = useTenant();
  const config = getTenantLocaleConfig(tenant.id);
  const isPreviewPath = !!tenant.previewSlug && pathname.startsWith(`/${tenant.previewSlug}`);
  const previewSlug = isPreviewPath ? tenant.previewSlug : undefined;
  const locale =
    tenantLocaleFromPath(pathname, tenant.id, previewSlug) ??
    config?.defaultLocale ??
    null;

  return (href: string) =>
    config && locale
      ? localizeTenantHref({ href, locale, previewSlug })
      : href;
}

