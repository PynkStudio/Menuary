"use client";

import { RotateCcw, ShieldCheck, Power } from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
import type { TenantFeatureKey } from "@/lib/tenant";
import { useTenant } from "@/components/tenant-provider";
import {
  mergeTenantOverrides,
  useTenantAdminStore,
} from "@/store/tenant-admin-store";
import { usePlatformMode } from "@/components/platform-mode-provider";

const FEATURE_ROWS: Array<{
  key: TenantFeatureKey;
  label: string;
  description: string;
}> = [
  {
    key: "takeaway",
    label: "Ordini da asporto",
    description: "Abilita percorso ordine e checkout da ritiro.",
  },
  {
    key: "tableOrders",
    label: "Ordini al tavolo",
    description: "Abilita QR, sessioni tavolo e checkout condiviso.",
  },
  {
    key: "kitchenDisplay",
    label: "Schermo cucina",
    description: "Rende disponibile la vista operativa per la brigata.",
  },
  {
    key: "dinerSeparation",
    label: "Commensali distinti",
    description: "Separa gli ordini dei clienti all'interno della sessione tavolo.",
  },
  {
    key: "favorites",
    label: "Preferiti",
    description: "Mantiene attivo il layer di salvataggio piatti preferiti.",
  },
  {
    key: "reviews",
    label: "Recensioni",
    description: "Consente la pubblicazione del modulo recensioni.",
  },
  {
    key: "gallery",
    label: "Galleria",
    description: "Consente la pubblicazione del modulo gallery.",
  },
];

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
          Gestione dei profili cliente e dei moduli disponibili. Il tenant corrente,
          risolto dal dominio, è <strong>{activeTenant.label}</strong>.
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
                  Moduli disponibili
                </div>
                <div className="mt-4 space-y-3">
                  {FEATURE_ROWS.map((feature) => {
                    const enabled = effective.features[feature.key];
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
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFeatureEnabled(tenant.id, feature.key, !enabled)
                          }
                          className={
                            "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition " +
                            (enabled
                              ? "bg-pork-red text-white"
                              : "bg-pork-ink/10 text-pork-ink/55")
                          }
                        >
                          {enabled ? "Attivo" : "Spento"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-pork-ink/55">
                  Override locali separati dalla configurazione seed del tenant.
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
