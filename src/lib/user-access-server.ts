import "server-only";

import type { EmployeeRole, SiteadminRole } from "@/lib/store-roles";
import { TENANTS } from "@/lib/tenant-registry";
import { buildTenantDemoManagementUrl, buildTenantManagementUrl } from "@/lib/login-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PortalEntry, UserAccess } from "@/lib/user-access";

export async function resolveUserAccessForUserId(userId: string): Promise<UserAccess> {
  const admin = createSupabaseAdminClient();
  const [{ data: sa }, { data: ta }, { data: emp }, { data: cust }] = await Promise.all([
    admin.from("siteadmin").select("role").eq("user_id", userId).eq("enabled", true).maybeSingle(),
    admin.from("tenantadmin").select("tenant_id").eq("user_id", userId).eq("enabled", true).maybeSingle(),
    admin.from("employee").select("tenant_id,role").eq("user_id", userId).eq("enabled", true).maybeSingle(),
    admin.from("clients").select("user_id").eq("user_id", userId).maybeSingle(),
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
