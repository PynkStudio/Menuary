import type { TenantFeatureFlags, TenantProfile } from "@/lib/tenant";
import { getPlatformModeFromHost } from "@/lib/platform";
import { buildTenantDemoManagementUrl, buildTenantManagementUrl } from "@/lib/login-url";
import { resolveTenantFeatures } from "@/lib/tenant-modules";

export function getGestioneBaseHref(host: string | null | undefined, tenant: TenantProfile): string {
  const mode = getPlatformModeFromHost(host);
  if (mode === "gestione-custom") return "";
  if (mode === "preview" || mode === "preview-bizery" || mode === "preview-orpheo") return `/${tenant.id}/gestione`;
  return `/gestione/${tenant.id}`;
}

export function getTenantGestioneExternalHref(tenantId: string): string {
  return buildTenantManagementUrl(tenantId) ?? buildTenantDemoManagementUrl(tenantId);
}

function hasActivePublicDomain(tenant: TenantProfile): boolean {
  return tenant.domains.some(
    (domain) =>
      !domain.includes("localhost") &&
      !domain.endsWith(".local") &&
      domain !== "127.0.0.1",
  );
}

export function getTenantAdminGestioneExternalHref(tenant: TenantProfile): string {
  const demoOnly =
    !hasActivePublicDomain(tenant) &&
    Boolean(tenant.previewSlug || tenant.status === "trial" || tenant.status === "trattativa");

  if (demoOnly) return buildTenantDemoManagementUrl(tenant.id);
  return buildTenantManagementUrl(tenant.id) ?? buildTenantDemoManagementUrl(tenant.id);
}

export function getGestioneModuleAccess(features: TenantFeatureFlags) {
  const modules = resolveTenantFeatures(features);
  const hasOrders = modules.takeaway || modules.tableOrders || modules.orderKiosk;
  const hasGoogleBusiness =
    modules.website || modules.reservations || modules.reviews || modules.analytics;

  return {
    modules,
    hasOrders,
    hasGoogleBusiness,
    canManageActivity: modules.website,
    canManageMenu: modules.onlineMenu,
    canManageTables: modules.tablePlanner,
    canManageReservations: modules.reservations,
    canManageCheckout: modules.cashRegister,
    canManageShifts: modules.staffRoles,
    canManageStaff: modules.staffRoles,
    canViewAnalytics: modules.analytics,
    canManageLocations: modules.multiLocation,
    canManageFidelity: modules.crm,
  };
}
