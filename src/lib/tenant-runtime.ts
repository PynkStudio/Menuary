import {
  findTenantByDomain,
  findTenantByPreviewSlug,
  getDefaultTenant,
} from "./tenant-registry";
import type { TenantProfile } from "./tenant";

export function resolveTenantFromHost(host: string | null | undefined): TenantProfile {
  if (!host) return getDefaultTenant();
  return findTenantByDomain(host) ?? getDefaultTenant();
}

export function resolveTenantFromPreviewSlug(
  slug: string | null | undefined,
): TenantProfile {
  if (!slug) return getDefaultTenant();
  return findTenantByPreviewSlug(slug) ?? getDefaultTenant();
}
