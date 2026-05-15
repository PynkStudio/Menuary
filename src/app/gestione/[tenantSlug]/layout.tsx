import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GestioneShell } from "@/components/gestione/gestione-shell";
import type { Database } from "@/lib/supabase/types";

interface Props {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function GestioneLayout({ children, params }: Props) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();

  // Verifica sessione + ruolo per questo tenant
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const host = (await headers()).get("host");
    const next = encodeURIComponent("/");
    redirect(
      `https://login.menuary.it?from=gestione.${tenantSlug}&next=${next}${host ? "" : ""}`,
    );
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
