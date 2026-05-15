import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GestioneShell } from "@/components/gestione/gestione-shell";
import { GestioneLoginGate } from "@/components/gestione/gestione-login-gate";
import { PortalSwitcher } from "@/components/portal-switcher/portal-switcher";
import type { Database } from "@/lib/supabase/types";

interface Props {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function GestioneLayout({ children, params }: Props) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();

  const host = (await headers()).get("host") ?? "";
  const isBizery =
    host.endsWith(".bizery.it") || host.endsWith(".bizery.localhost");

  // Bizery: cookie origin-scoped (set via popup postMessage + set-session).
  // Menuary: cookie condiviso su .menuary.it (redirect-based login).
  const cookieDomain = isBizery ? undefined : ".menuary.it";
  const supabase = await createSupabaseServerClient(cookieDomain);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (isBizery) {
      // Cross-domain: non si può fare redirect + aspettarsi il cookie .bizery.it.
      // Mostriamo il login gate client-side che apre il popup su login.menuary.it.
      const cssVars = tenantThemeCssVars(tenant.theme);
      return (
        <div
          style={{
            ...cssVars,
            backgroundColor: tenant.theme.cream,
            color: tenant.theme.ink,
            minHeight: "100vh",
          } as React.CSSProperties}
        >
          <GestioneLoginGate
            tenantSlug={tenantSlug}
            tenantName={tenant.name}
            accentColor={tenant.theme.red}
          />
        </div>
      );
    }
    const next = encodeURIComponent("/");
    redirect(`https://login.menuary.it?from=gestione.${tenantSlug}&next=${next}`);
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role, tenant_id, permissions, display_name, email")
    .eq("auth_user_id", user.id)
    .eq("enabled", true)
    .single();

  // Authorization: platform_admin può vedere tutto, altrimenti il tenant deve combaciare
  const isPlatformAdmin =
    adminRow?.role === "platform_admin" || adminRow?.role === "tenant_admin";
  const isOwnTenant = adminRow?.tenant_id === tenantSlug;

  if (!isPlatformAdmin && !isOwnTenant) {
    if (isBizery) {
      const cssVars = tenantThemeCssVars(tenant.theme);
      return (
        <div
          style={{
            ...cssVars,
            backgroundColor: tenant.theme.cream,
            color: tenant.theme.ink,
            minHeight: "100vh",
          } as React.CSSProperties}
        >
          <GestioneLoginGate
            tenantSlug={tenantSlug}
            tenantName={tenant.name}
            accentColor={tenant.theme.red}
          />
        </div>
      );
    }
    redirect(`https://login.menuary.it?from=gestione.${tenantSlug}`);
  }

  const cssVars = tenantThemeCssVars(tenant.theme);

  return (
    <div
      data-gestione-tenant={tenantSlug}
      style={{
        ...cssVars,
        backgroundColor: tenant.theme.cream,
        color: tenant.theme.ink,
        minHeight: "100vh",
      } as React.CSSProperties}
    >
      <GestioneShell
        tenant={{ id: tenant.id, name: tenant.name, theme: tenant.theme }}
        currentUser={{
          email: adminRow?.email ?? user.email ?? "",
          displayName: adminRow?.display_name ?? null,
          role: adminRow?.role ?? null,
          permissions: (adminRow?.permissions as Record<string, boolean>) ?? {},
        }}
      >
        {children}
      </GestioneShell>
      <PortalSwitcher current="gestione" cookieDomain={isBizery ? undefined : ".menuary.it"} />
    </div>
  );
}

export type GestioneTenantTheme = (typeof TENANTS)[number]["theme"];
export type GestioneCurrentUser = {
  email: string;
  displayName: string | null;
  role: Database["public"]["Enums"]["admin_role"] | null;
  permissions: Record<string, boolean>;
};
