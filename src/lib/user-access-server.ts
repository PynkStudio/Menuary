import "server-only";

import type { EmployeeRole, SiteadminRole } from "@/lib/store-roles";
import { TENANTS } from "@/lib/tenant-registry";
import { buildTenantDemoManagementUrl, buildTenantManagementUrl } from "@/lib/login-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { PortalEntry, UserAccess } from "@/lib/user-access";

export const EMPTY_USER_ACCESS: UserAccess = {
  isSiteadmin: false,
  siteadminRole: null,
  tenantId: null,
  employeeRole: null,
  isCustomer: false,
};

export async function resolveUserAccessForUserId(userId: string): Promise<UserAccess> {
  const service = createSupabaseServiceClient();
  if (!service) return EMPTY_USER_ACCESS;

  const [{ data: sa }, { data: ta }, { data: emp }, { data: cust }] = await Promise.all([
    service.from("siteadmin").select("role").eq("user_id", userId).eq("enabled", true).maybeSingle(),
    service.from("tenantadmin").select("tenant_id").eq("user_id", userId).eq("enabled", true).maybeSingle(),
    service.from("employee").select("tenant_id,role").eq("user_id", userId).eq("enabled", true).maybeSingle(),
    service.from("clients").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    isSiteadmin: !!sa,
    siteadminRole: (sa?.role as SiteadminRole | null) ?? null,
    tenantId: ta?.tenant_id ?? emp?.tenant_id ?? null,
    employeeRole: (emp?.role as EmployeeRole | null) ?? null,
    isCustomer: !!cust,
  };
}

export async function resolveCurrentUserAccess(cookieDomain?: string): Promise<UserAccess | null> {
  const supabase = await createSupabaseServerClient(cookieDomain);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return resolveUserAccessForUserId(user.id);
}

export function portalEntriesForAccess(access: UserAccess): PortalEntry[] {
  const portals: PortalEntry[] = [];

  if (access.isCustomer) {
    portals.push({
      key: "clienti",
      label: "Area clienti",
      description: "Prenotazioni, ordini e preferenze",
      href: "https://clienti.menuary.it",
    });
  }

  if (access.tenantId) {
    const tenant = TENANTS.find((t) => t.id === access.tenantId);
    const customManagementUrl = buildTenantManagementUrl(access.tenantId);
    portals.push({
      key: "gestione",
      label: tenant?.name ?? "Gestione locale",
      description: "Pannello operativo del tuo locale",
      href: customManagementUrl ?? buildTenantDemoManagementUrl(access.tenantId),
    });
  }

  if (access.isSiteadmin) {
    portals.push({
      key: "admin",
      label: "Admin panel",
      description: "Pannello amministrazione Menuary",
      href: "https://admin.menuary.it/admin",
    });
  }

  return portals;
}
