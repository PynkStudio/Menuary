import type { SiteadminRole, EmployeeRole } from "@/lib/store-roles";
import { TENANTS } from "@/lib/tenant-registry";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type PortalKey = "clienti" | "gestione" | "admin";

export type PortalEntry = {
  key: PortalKey;
  label: string;
  description: string;
  href: string;
};

export type UserAccess = {
  isSiteadmin: boolean;
  siteadminRole: SiteadminRole | null;
  tenantId: string | null;
  employeeRole: EmployeeRole | null;
  isCustomer: boolean;
};

type AnySupabase =
  | Awaited<ReturnType<typeof createSupabaseServerClient>>
  | ReturnType<typeof createSupabaseBrowserClient>;

/** Risolve l'accesso completo dell'utente corrente interrogando le 4 nuove tabelle in parallelo. */
export async function resolveUserAccess(
  supabase: AnySupabase,
  userId: string,
): Promise<UserAccess> {
  const [{ data: sa }, { data: ta }, { data: emp }, { data: cust }] = await Promise.all([
    supabase.from("siteadmin").select("role").eq("user_id", userId).eq("enabled", true).maybeSingle(),
    supabase.from("tenantadmin").select("tenant_id").eq("user_id", userId).eq("enabled", true).maybeSingle(),
    supabase.from("employee").select("tenant_id,role").eq("user_id", userId).eq("enabled", true).maybeSingle(),
    supabase.from("customer").select("consumer_active").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    isSiteadmin: !!sa,
    siteadminRole: (sa?.role as SiteadminRole | null) ?? null,
    tenantId: ta?.tenant_id ?? emp?.tenant_id ?? null,
    employeeRole: (emp?.role as EmployeeRole | null) ?? null,
    isCustomer: cust?.consumer_active ?? false,
  };
}

/** Costruisce i portali accessibili all'utente corrente. */
export async function getUserPortalAccess(supabase: AnySupabase): Promise<PortalEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const access = await resolveUserAccess(supabase, user.id);
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
    const isBizery = tenant?.vertical === "services";
    portals.push({
      key: "gestione",
      label: tenant?.name ?? "Gestione locale",
      description: "Pannello operativo del tuo locale",
      href: isBizery
        ? `https://gestione.bizery.it/${access.tenantId}`
        : `https://gestione.menuary.it/${access.tenantId}`,
    });
  }

  if (access.isSiteadmin) {
    portals.push({
      key: "admin",
      label: "Admin panel",
      description: "Pannello amministrazione Menuary",
      href: "https://admin.menuary.it",
    });
  }

  return portals;
}
