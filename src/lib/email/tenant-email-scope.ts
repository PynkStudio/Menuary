import type { TenantProfile } from "@/lib/tenant";

export type TenantEmailScope = {
  tenantId: string;
};

export function buildTenantEmailScope(tenant: Pick<TenantProfile, "id">): TenantEmailScope {
  return { tenantId: tenant.id };
}
