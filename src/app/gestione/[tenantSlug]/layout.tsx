import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GestioneShell } from "@/components/gestione/gestione-shell";
import { GestioneLoginGate } from "@/components/gestione/gestione-login-gate";
import { PortalSwitcher } from "@/components/portal-switcher/portal-switcher";
import type { EmployeeRole } from "@/lib/store-roles";

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

  const [{ data: sa }, { data: ta }, { data: emp }] = await Promise.all([
    supabase.from("siteadmin").select("role").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    supabase.from("tenantadmin").select("email, display_name").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    supabase.from("employee").select("email, display_name, role, permissions").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
  ]);

  const isSiteadmin = !!sa;
  const isTenantAdmin = !!ta;
  const hasAccess = isSiteadmin || isTenantAdmin || !!emp;

  if (!hasAccess) {
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
          email: ta?.email ?? emp?.email ?? user.email ?? "",
          displayName: ta?.display_name ?? emp?.display_name ?? null,
          role: (emp?.role as EmployeeRole | null) ?? null,
          permissions: (emp?.permissions as Record<string, boolean>) ?? {},
          isTenantAdmin: isTenantAdmin || isSiteadmin,
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
  role: EmployeeRole | null;
  permissions: Record<string, boolean>;
  isTenantAdmin: boolean;
};
