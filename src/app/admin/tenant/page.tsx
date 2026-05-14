"use client";

import { RotateCcw, ShieldCheck, Power } from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
import { useTenant } from "@/components/core/tenant-provider";
import {
  mergeTenantOverrides,
  useTenantAdminStore,
} from "@/store/tenant-admin-store";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import {
  formatFeatureDependencies,
  getMissingFeatureDependencies,
  TENANT_MODULES,
  TENANT_MODULE_BY_KEY,
  TENANT_MODULE_CATEGORIES,
} from "@/lib/tenant-modules";

export default function AdminTenantPage() {
  const mode = usePlatformMode();
  const activeTenant = useTenant();
  const overrides = useTenantAdminStore((state) => state.overrides);
  const setTenantEnabled = useTenantAdminStore(
    (state) => state.setTenantEnabled,
  );
  const setFeatureEnabled = useTenantAdminStore(
    (state) => state.setFeatureEnabled,
  );
  const resetTenant = useTenantAdminStore((state) => state.resetTenant);

  if (mode !== "platform-admin") {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 ring-1 ring-pork-ink/10">
        <p className="impact-title text-xs text-pork-red">Accesso limitato</p>
        <h1 className="headline mt-2 text-4xl">Console tenant riservata</h1>
        <p className="mt-3 text-pork-ink/65">
          Questa sezione appartiene al controllo centrale Menuary e non viene
          esposta nell&apos;area gestionale del singolo ristorante.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="impact-title text-xs text-pork-red">Piattaforma</p>
        <h1 className="headline text-4xl">Tenant</h1>
        <p className="mt-2 text-pork-ink/65">
          Gestione dei profili cliente e dei moduli abilitati da Menuary. Il locale può solo
          sospendere temporaneamente i servizi dal proprio pannello, mentre l’inclusione nel piano
          si decide qui. Il tenant corrente, risolto dal dominio, è{" "}
          <strong>{activeTenant.label}</strong>.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        {TENANTS.map((tenant) => {
          const effective = mergeTenantOverrides(tenant, overrides[tenant.id]);
          const current = tenant.id === activeTenant.id;

          return (
            <section
              key={tenant.id}
              className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="headline text-3xl">{tenant.name}</h2>
                    {current && (
                      <span className="rounded-full bg-pork-mustard px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-pork-ink">
                        Corrente
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-pork-ink/55">
                    {tenant.domains.join(" · ")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setTenantEnabled(tenant.id, !effective.enabled)}
                  className={
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition " +
                    (effective.enabled
                      ? "bg-pork-green text-white"
                      : "bg-pork-ink/10 text-pork-ink/60")
                  }
                >
                  <Power size={16} />
                  {effective.enabled ? "Tenant attivo" : "Tenant spento"}
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-pork-cream p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-pork-ink">
                  <ShieldCheck size={16} className="text-pork-red" />
                  Moduli inclusi nel piano
                </div>
                <div className="mt-4 space-y-5">
                  {TENANT_MODULE_CATEGORIES.map((category) => (
                    <div key={category}>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-pork-ink/45">
                        {category}
                      </p>
                      <div className="space-y-3">
                        {TENANT_MODULES.filter(
                          (feature) => feature.category === category,
                        ).map((feature) => {
                          const enabled = effective.features[feature.key];
                          const missing = getMissingFeatureDependencies(
                            effective.features,
                            feature.key,
                          );
                          const dependencyNote = formatFeatureDependencies(feature.key);
                          return (
                            <div
                              key={feature.key}
                              className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-pork-ink/5 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="font-bold">{feature.label}</p>
                                <p className="mt-1 text-sm text-pork-ink/60">
                                  {feature.description}
                                </p>
                                {dependencyNote && (
                                  <p className="mt-2 text-xs font-bold text-pork-ink/45">
                                    {dependencyNote}
                                  </p>
                                )}
                                {missing.length > 0 && (
                                  <p className="mt-2 rounded-xl bg-pork-mustard/25 px-3 py-2 text-xs font-bold text-pork-ink/70">
                                    Bloccato: attiva{" "}
                                    {missing
                                      .map(
                                        (dependency) =>
                                          TENANT_MODULE_BY_KEY[dependency].label,
                                      )
                                      .join(" oppure ")}
                                    .
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setFeatureEnabled(
                                    tenant.id,
                                    feature.key,
                                    !enabled,
                                  )
                                }
                                className={
                                  "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition " +
                                  (enabled
                                    ? "bg-pork-red text-white"
                                    : "bg-pork-ink/10 text-pork-ink/55")
                                }
                              >
                              {enabled ? "Incluso" : "Escluso"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-pork-ink/55">
                  Questi toggle sono commerciali: decidono cosa il tenant può usare o sospendere.
                </p>
                <button
                  type="button"
                  onClick={() => resetTenant(tenant.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 font-bold text-pork-ink/70 transition hover:border-pork-red/40 hover:text-pork-red"
                >
                  <RotateCcw size={15} />
                  Ripristina profilo
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
