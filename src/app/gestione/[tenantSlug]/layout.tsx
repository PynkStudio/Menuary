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
import { getPlatformModeFromHost, isDemoHost } from "@/lib/platform";
import { DemoModeInstaller } from "@/components/gestione/demo-mode-installer";
import { getTenantDemoControl } from "@/lib/demo-controls";
import { resolveSessionCookieDomain, usesSharedMenuarySession } from "@/lib/session-cookie-domain";
import type { LoginFrom } from "@/lib/login-url";
import { getGestioneBaseHref } from "@/lib/gestione-routing";
import { buildTenantIconSet } from "@/lib/favicon";
import { TenantProvider } from "@/components/core/tenant-provider";
import { getGestioneTranslations } from "@/i18n/gestione";

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
  const messages = await getGestioneTranslations();

  const host = (await headers()).get("host") ?? "";
  const mode = getPlatformModeFromHost(host);
  const isDemoHostname = isDemoHost(host);
  // "Backend live": override siteadmin-only che, su host demo, fa parlare la
  // gestione con Supabase invece dei fixture localStorage. Login resta bypassato
  // (test-friendly), ma le query e le scritture sono reali.
  const demoControl = isDemoHostname ? await getTenantDemoControl(tenantSlug).catch(() => null) : null;
  const backendLive = Boolean(demoControl?.backendLive);
  const isDemo = isDemoHostname && !backendLive;
  const skipAuthGate = isDemoHostname; // copre sia demo classico sia demo+backendLive
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
  const { data: { user } } = skipAuthGate
    ? { data: { user: null } }
    : await supabase.auth.getUser();

  if (!user && !skipAuthGate) {
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

  const [{ data: sa }, { data: ta }, { data: emp }, adminUserRow] = skipAuthGate
    ? [
        { data: null as null },
        { data: null as null },
        { data: null as null },
        { data: null as null },
      ]
    : await Promise.all([
        supabase.from("siteadmin").select("role").eq("user_id", user!.id).eq("enabled", true).maybeSingle(),
        supabase.from("tenantadmin").select("email, display_name, first_name, last_name").eq("user_id", user!.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
        supabase.from("employee").select("email, display_name, first_name, last_name, role, permissions").eq("user_id", user!.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
        supabase.from("admin_users").select("id").eq("auth_user_id", user!.id).eq("tenant_id", tenantSlug).maybeSingle(),
      ]);

  const isSiteadmin = skipAuthGate || !!sa;
  const isTenantAdmin = skipAuthGate || !!ta;
  const hasAccess = skipAuthGate || isSiteadmin || isTenantAdmin || !!emp;

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

  const navBaseHref = getGestioneBaseHref(host, tenant);
  const cssVars = tenantThemeCssVars(tenant.theme);

  // Sedi: solo se il tenant ha multiLocation abilitato.
  // Su demo non interroghiamo il DB: l'idratazione avviene client-side da localStorage.
  const allLocations = isDemo
    ? []
    : tenant.features.multiLocation
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
      data-tenant-surface={tenantSlug}
      data-backend-live={backendLive ? "true" : "false"}
      style={{
        ...cssVars,
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
          email:
            ta?.email
            ?? emp?.email
            ?? user?.email
            ?? (isDemo ? "demo@menuary.it" : backendLive ? "backend-live@menuary.it" : ""),
          displayName:
            (
              [ta?.first_name, ta?.last_name].filter(Boolean).join(" ").trim()
              || [emp?.first_name, emp?.last_name].filter(Boolean).join(" ").trim()
              || ta?.display_name
              || emp?.display_name
            )
            ?? (isDemo ? "Demo" : backendLive ? "Backend live" : null),
          role: (emp?.role as EmployeeRole | null) ?? null,
          permissions: (emp?.permissions as Record<string, boolean>) ?? {},
          isTenantAdmin: isTenantAdmin || isSiteadmin,
        }}
        locations={visibleLocations}
        navBaseHref={navBaseHref}
        loginFrom={loginFrom}
        isDemo={isDemo}
        messages={messages}
      >
        <TenantProvider tenant={tenant}>{children}</TenantProvider>
      </GestioneShell>
      {!isDemoHostname && <PortalSwitcher current="gestione" cookieDomain={cookieDomain} />}
      {isDemo && <DemoModeInstaller />}
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
