import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GestioneStaffManager } from "@/components/gestione/gestione-staff-manager";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { isDemoHost } from "@/lib/platform";
import { TENANTS } from "@/lib/tenant-registry";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";

export default async function StaffPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant || !getGestioneModuleAccess(tenant.features).canManageStaff) notFound();

  const host = (await headers()).get("host");
  const demo = isDemoHost(host);
  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));

  const staff = await (async () => {
    if (demo) return [] as Array<{ id: string; email: string; role: string; display_name: string | null; permissions: unknown; enabled: boolean }>;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`https://login.menuary.it?from=gestione.${tenantSlug}`);
    const { data } = await supabase
      .from("employee")
      .select("id, email, role, display_name, permissions, enabled, created_at")
      .eq("tenant_id", tenantSlug)
      .order("created_at", { ascending: true });
    return data ?? [];
  })();

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">
        Account staff
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Gestione dipendenti</h1>
      <p className="mt-3 max-w-2xl opacity-70">
        Invita nuovi dipendenti via email. Riceveranno un link per impostare la password
        e accedere al pannello. Puoi revocare l&apos;accesso in qualsiasi momento —
        l&apos;account utente rimarrà attivo come cliente.
      </p>

      <div className="mt-8">
        <GestioneStaffManager
          tenantSlug={tenantSlug}
          initialStaff={staff.map((row) => ({
            id: row.id,
            email: row.email,
            role: row.role,
            displayName: row.display_name,
            permissions: (row.permissions as Record<string, boolean>) ?? {},
            enabled: row.enabled,
          }))}
        />
      </div>
    </div>
  );
}
