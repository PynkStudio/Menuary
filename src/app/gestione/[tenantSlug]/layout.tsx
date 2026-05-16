import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GestioneShell } from "@/components/gestione/gestione-shell";
import { GestioneLoginGate } from "@/components/gestione/gestione-login-gate";
import { PortalSwitcher } from "@/components/portal-switcher/portal-switcher";
import type { EmployeeRole } from "@/lib/store-roles";
import { fetchLocations, fetchStaffAllowedLocationIds, filterAllowedLocations } from "@/lib/location";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveSessionCookieDomain, usesSharedMenuarySession } from "@/lib/session-cookie-domain";
import type { LoginFrom } from "@/lib/login-url";
import { getGestioneBaseHref } from "@/lib/gestione-routing";
import { buildTenantIconSet } from "@/lib/favicon";

interface Props {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) return {};

  return {
    title: { absolute: `${tenant.name} · gestione` },
    robots: { index: false, follow: false },
    icons: buildTenantIconSet(tenant),
  };
}

export default async function GestioneLayout({ children, params }: Props) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();

  const host = (await headers()).get("host") ?? "";
  const mode = getPlatformModeFromHost(host);
  const isDemoGestione =
    host === "demo.menuary.it" || host === "demo.menuary.localhost";
  const loginFrom: LoginFrom =
    mode === "gestione-bizery"
      ? `gestione-bizery.${tenantSlug}`
      : mode === "gestione-custom"
        ? `gestione-custom.${tenantSlug}`
        : isDemoGestione
          ? `gestione-demo.${tenantSlug}`
          : `gestione.${tenantSlug}`;
  const usesPopupLogin = !usesSharedMenuarySession(host) || isDemoGestione;

  // Bizery: cookie origin-scoped (set via popup postMessage + set-session).
  // Menuary: cookie condiviso su .menuary.it (redirect-based login).
  const cookieDomain = resolveSessionCookieDomain(host);
  const supabase = await createSupabaseServerClient(cookieDomain);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (usesPopupLogin) {
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
            loginFrom={loginFrom}
            brandLabel={tenant.name}
          />
        </div>
      );
    }
    const next = encodeURIComponent("/");
    redirect(`https://login.menuary.it?from=${encodeURIComponent(loginFrom)}&next=${next}`);
  }

  const [{ data: sa }, { data: ta }, { data: emp }, adminUserRow] = await Promise.all([
    supabase.from("siteadmin").select("role").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    supabase.from("tenantadmin").select("email, display_name").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    supabase.from("employee").select("email, display_name, role, permissions").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    supabase.from("admin_users").select("id").eq("auth_user_id", user.id).eq("tenant_id", tenantSlug).maybeSingle(),
  ]);

  const isSiteadmin = !!sa;
  const isTenantAdmin = !!ta;
  const hasAccess = isSiteadmin || isTenantAdmin || !!emp;

  if (!hasAccess) {
    if (usesPopupLogin) {
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
            loginFrom={loginFrom}
            brandLabel={tenant.name}
          />
        </div>
      );
    }
    redirect(`https://login.menuary.it?from=${encodeURIComponent(loginFrom)}`);
  }

  const cssVars = tenantThemeCssVars(tenant.theme);
  const navBaseHref = getGestioneBaseHref(host, tenant);

  // Sedi: solo se il tenant ha multiLocation abilitato.
  const allLocations = tenant.features.multiLocation
    ? await fetchLocations(supabase, tenantSlug)
    : [];

  // Staff con restrizioni di sede vede solo le sedi assegnate.
  // Admin (isTenantAdmin) vede sempre tutto.
  const isAdmin = isTenantAdmin || isSiteadmin;
  const visibleLocations = isAdmin
    ? allLocations
    : await (async () => {
        const adminId = adminUserRow?.data?.id;
        if (!adminId) return allLocations;
        const allowed = await fetchStaffAllowedLocationIds(supabase, adminId);
        return filterAllowedLocations(allLocations, allowed);
      })();

  return (
    <div
      className="gestione-admin"
      data-gestione-tenant={tenantSlug}
      style={{
        ["--ga-accent" as string]: tenant.theme.red,
        ["--ga-accent-soft" as string]: `${tenant.theme.red}24`,
        ["--ga-accent-ring" as string]: `${tenant.theme.red}52`,
      } as React.CSSProperties}
    >
      <GestioneShell
        tenant={{
          id: tenant.id,
          name: tenant.name,
          vertical: tenant.vertical,
          theme: tenant.theme,
          features: tenant.features,
        }}
        currentUser={{
          email: ta?.email ?? emp?.email ?? user.email ?? "",
          displayName: ta?.display_name ?? emp?.display_name ?? null,
          role: (emp?.role as EmployeeRole | null) ?? null,
          permissions: (emp?.permissions as Record<string, boolean>) ?? {},
          isTenantAdmin: isTenantAdmin || isSiteadmin,
        }}
        locations={visibleLocations}
        navBaseHref={navBaseHref}
        loginFrom={loginFrom}
      >
        {children}
      </GestioneShell>
      <PortalSwitcher current="gestione" cookieDomain={cookieDomain} />
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
