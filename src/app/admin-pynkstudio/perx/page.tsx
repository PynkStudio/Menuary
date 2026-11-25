import { Building2, Users, ServerCrash, Globe } from "lucide-react";
import { perxApi, type PerxAdminOverview, type PerxTenant } from "@/lib/perx/client";

type DashboardData = {
  overview: PerxAdminOverview;
  tenants: PerxTenant[];
};

async function loadDashboard(): Promise<{ data: DashboardData } | { error: string }> {
  try {
    const [overview, tenants] = await Promise.all([
      perxApi.getOverview(),
      perxApi.listTenants(),
    ]);
    return { data: { overview, tenants } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

export default async function PerxPortalPage() {
  const result = await loadDashboard();

  if ("error" in result) {
    return (
      <div>
        <h1 className="pynk-admin-page-title">PerX</h1>
        <p className="pynk-admin-page-subtitle">Pannello di controllo PerX</p>
        <div className="pynk-admin-card mt-6 p-6 text-center">
          <p className="text-sm text-red-500">Errore di connessione: {result.error}</p>
          <p className="mt-2 text-xs text-[var(--pa-muted)]">
            Verifica che PERX_ADMIN_API_URL e PERX_ADMIN_API_KEY siano configurate sul progetto
            Vercel di BePork e che la stessa chiave sia impostata come PLATFORM_ADMIN_API_KEY su
            Render per il servizio perx-api.
          </p>
        </div>
      </div>
    );
  }

  const { overview, tenants } = result.data;
  const { counts } = overview;

  const kpis = [
    { label: "Tenant", value: counts.tenants, detail: undefined, icon: Building2 },
    { label: "Utenti", value: counts.users, detail: `${counts.active_users} attivi`, icon: Users },
    {
      label: "Errori non risolti",
      value: counts.unresolved_errors,
      detail:
        counts.unresolved_critical_errors > 0
          ? `${counts.unresolved_critical_errors} critici`
          : undefined,
      icon: ServerCrash,
    },
    {
      label: "Domain routes",
      value: counts.domain_routes,
      detail: `${counts.active_domain_routes} attive`,
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="pynk-admin-page-title">PerX</h1>
        <p className="pynk-admin-page-subtitle">Pannello di controllo PerX (accesso platform-admin)</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700">
            API {overview.api_version} connessa
          </span>
          <span className="rounded-full bg-[var(--pa-surface)] px-3 py-1 text-[var(--pa-muted)]">
            {overview.single_tenant_mode ? "Modalità single-tenant" : "Modalità multi-tenant"}
          </span>
        </div>
      </div>

      <section>
        <div className="pynk-admin-kpi-grid">
          {kpis.map(({ label, value, detail, icon: Icon }) => (
            <div key={label} className="pynk-admin-kpi">
              <div className="flex items-center gap-2 text-xs text-[var(--pa-muted)]">
                <Icon size={14} />
                {label}
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--pa-ink)]">{value}</div>
              {detail && <div className="mt-1 text-xs text-[var(--pa-muted)]">{detail}</div>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--pa-muted)]">
          Tenant
        </h2>
        <div className="pynk-admin-card overflow-hidden">
          <table className="pynk-crm-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={2} className="pynk-crm-empty">Nessun tenant trovato</td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="pynk-crm-row">
                    <td className="pynk-crm-row-name">{t.name}</td>
                    <td className="pynk-crm-row-secondary">{t.slug}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--pa-muted)]">
          Capacità API
        </h2>
        <div className="pynk-admin-card overflow-hidden">
          <table className="pynk-crm-table">
            <thead>
              <tr>
                <th>Risorsa</th>
                <th>Lettura</th>
                <th>Creazione</th>
                <th>Modifica</th>
                <th>Eliminazione</th>
              </tr>
            </thead>
            <tbody>
              {overview.capabilities.map((capability) => (
                <tr key={capability.resource} className="pynk-crm-row">
                  <td className="pynk-crm-row-name">{capability.resource.replaceAll("_", " ")}</td>
                  {[capability.read, capability.create, capability.update, capability.delete].map(
                    (enabled, index) => (
                      <td key={index} className="pynk-crm-row-secondary">
                        {enabled ? "Sì" : "—"}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
