import {
  findTenantByDomain,
  findTenantByPreviewSlug,
  getDefaultTenantForVertical,
} from "./tenant-registry";
import { getPlatformModeFromHost } from "./platform";
import type { TenantProfile } from "./tenant";

function verticalFromMode(mode: ReturnType<typeof getPlatformModeFromHost>): TenantProfile["vertical"] {
  return mode === "marketing-bizery" || mode === "preview-bizery" || mode === "gestione-bizery"
    ? "services"
    : "food";
}

export function resolveTenantFromHost(host: string | null | undefined): TenantProfile {
  if (!host) return getDefaultTenantForVertical("food");
  const tenant = findTenantByDomain(host);
  if (tenant) return tenant;
  const vertical = verticalFromMode(getPlatformModeFromHost(host));
  return getDefaultTenantForVertical(vertical);
}

export function resolveTenantFromPreviewSlug(
  slug: string | null | undefined,
  host?: string | null,
): TenantProfile {
  if (!slug) return getDefaultTenantForVertical(host ? verticalFromMode(getPlatformModeFromHost(host)) : "food");
  return findTenantByPreviewSlug(slug) ?? getDefaultTenantForVertical(
    host ? verticalFromMode(getPlatformModeFromHost(host)) : "food",
  );
}

/** Sede opzionale da query (?loc=slug) per multi-sede senza cambiare host. */
export function resolveLocationSlugFromSearchParams(
  searchParams: URLSearchParams | null | undefined,
): string | null {
  if (!searchParams) return null;
  return searchParams.get("loc") ?? searchParams.get("location");
}
