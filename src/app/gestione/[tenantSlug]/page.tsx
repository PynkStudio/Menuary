import { TENANTS } from "@/lib/tenant-registry";
import { getModuleLabel, getVerticalMeta } from "@/lib/vertical";

export default async function GestioneDashboardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  const vertical = tenant ? getVerticalMeta(tenant.vertical) : null;
  const menuLabel = tenant ? getModuleLabel("onlineMenu", tenant.vertical).toLowerCase() : "menu";
  const reservationsLabel = tenant
    ? getModuleLabel("reservations", tenant.vertical).toLowerCase()
    : "prenotazioni";
  const dashboardCopy =
    tenant?.vertical === "services"
      ? `Da qui gestisci sito, ${menuLabel}, ${reservationsLabel}, clienti, dati attività e fatturazione della tua ${vertical?.businessNoun ?? "azienda"}.`
      : "Da qui gestisci ordini, menu, prenotazioni, staff e fatturazione del tuo locale.";

  return (
    <div>
      <span className="ga-eyebrow">Pannello di controllo</span>
      <h1 className="ga-heading">Benvenuto su {tenant?.name}</h1>
      <p className="ga-lead">{dashboardCopy}</p>
    </div>
  );
}
