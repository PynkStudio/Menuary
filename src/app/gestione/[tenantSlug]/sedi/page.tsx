import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { TENANTS } from "@/lib/tenant-registry";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchLocations } from "@/lib/location";
import { GestioneLocationsManager } from "@/components/gestione/gestione-locations-manager";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { getGestioneBaseHref, getGestioneModuleAccess } from "@/lib/gestione-routing";

export default async function SediPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant || !getGestioneModuleAccess(tenant.features).canManageLocations) notFound();

  const host = (await headers()).get("host");
  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`https://login.menuary.it?from=gestione.${tenantSlug}`);

  // Solo admin (tenantadmin o siteadmin) può gestire le sedi
  const [{ data: ta }, { data: sa }] = await Promise.all([
    supabase.from("tenantadmin").select("id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    supabase.from("siteadmin").select("id").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
  ]);
  if (!ta && !sa) redirect(getGestioneBaseHref(host, tenant) || "/");

  const locations = await fetchLocations(supabase, tenantSlug);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">
        Configurazione
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Sedi</h1>
      <p className="mt-3 max-w-2xl opacity-70">
        Gestisci le sedi del locale. Ogni sede ha il proprio indirizzo, orari e URL dedicato.
      </p>

      <div className="mt-8">
        <GestioneLocationsManager
          tenantId={tenantSlug}
          initialLocations={locations}
          multiLocationEnabled={tenant.features.multiLocation}
        />
      </div>
    </div>
  );
}
