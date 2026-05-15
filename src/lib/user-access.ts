import { PLATFORM_ROLES, STORE_ROLES } from "@/lib/store-roles";
import { TENANTS } from "@/lib/tenant-registry";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

export type PortalKey = "clienti" | "gestione" | "admin";

export type PortalEntry = {
  key: PortalKey;
  label: string;
  description: string;
  href: string;
};

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function getUserPortalAccess(supabase: Supabase): Promise<PortalEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: adminRow }, { data: profile }] = await Promise.all([
    supabase
      .from("admin_users")
      .select("role, tenant_id")
      .eq("auth_user_id", user.id)
      .eq("enabled", true)
      .single(),
    supabase
      .from("user_profiles")
      .select("consumer_enabled")
      .eq("user_id", user.id)
      .single(),
  ]);

  const portals: PortalEntry[] = [];

  if (profile?.consumer_enabled) {
    portals.push({
      key: "clienti",
      label: "Area clienti",
      description: "Prenotazioni, ordini e preferenze",
      href: "https://clienti.menuary.it",
    });
  }

  const role = adminRow?.role ?? null;

  if (role && STORE_ROLES.includes(role as never) && adminRow?.tenant_id) {
    const tenant = TENANTS.find((t) => t.id === adminRow.tenant_id);
    const isBizery = tenant?.vertical === "services";
    portals.push({
      key: "gestione",
      label: tenant?.name ?? "Gestione locale",
      description: "Pannello operativo del tuo locale",
      href: isBizery
        ? `https://gestione.bizery.it/${adminRow.tenant_id}`
        : `https://gestione.menuary.it/${adminRow.tenant_id}`,
    });
  }

  if (role && PLATFORM_ROLES.includes(role as never)) {
    portals.push({
      key: "admin",
      label: "Admin panel",
      description: "Pannello amministrazione Menuary",
      href: "https://admin.menuary.it",
    });
  }

  return portals;
}
