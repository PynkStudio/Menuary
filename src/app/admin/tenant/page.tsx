"use client";

import Link from "next/link";
import { RotateCcw, ShieldCheck, Power, ExternalLink, ChevronDown, MapPin, CreditCard, Plug } from "lucide-react";
import { useState } from "react";
import { HubriseIntegrationModal } from "@/components/admin/tenant/hubrise-integration-modal";
import type { TenantStatus } from "@/lib/tenant";
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
  TENANT_MODULE_CATEGORIES,
} from "@/lib/tenant-modules";
import { AdminTenantLocationsPanel } from "@/components/admin/tenant-locations-panel";
import { PLATFORM_LEADS, PLATFORM_SUBSCRIPTIONS } from "@/lib/platform-admin-data";
import { getModuleCopy } from "@/lib/vertical";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";

const PREVIEW_HOST: Record<string, string> = {
  food: "https://demo.menuary.it",
  services: "https://demo.bizery.it",
};

const STATUS_BADGE: Record<TenantStatus, { label: string; className: string }> = {
  active:     { label: "Attivo",      className: "bg-pork-green text-white" },
  trial:      { label: "Trial",       className: "bg-pork-mustard text-pork-ink" },
  offline:    { label: "Offline",     className: "bg-pork-ink/20 text-pork-ink/60" },
  trattativa: { label: "Trattativa",  className: "bg-amber-100 text-amber-800" },
};

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
  const [demoDisabled, setDemoDisabled] = useState<Record<string, boolean>>({});
  const [hubriseOpenFor, setHubriseOpenFor] = useState<string | null>(null);

  function persistTenantEnabled(tenantId: string, enabled: boolean) {
    setTenantEnabled(tenantId, enabled);
    void fetch("/api/admin/tenant-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, enabled }),
    });
  }

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
          const lead = PLATFORM_LEADS.find((item) => item.tenant_id === tenant.id);
          const subscription = lead
            ? PLATFORM_SUBSCRIPTIONS.find((item) => item.lead_id === lead.id)
            : null;

          return (
            <details
              key={tenant.id}
              open={current}
              className="group rounded-3xl bg-white p-6 ring-1 ring-pork-ink/10"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="headline text-3xl">{tenant.name}</h2>
                    {current && (
                      <span className="rounded-full bg-pork-mustard px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-pork-ink">
                        Corrente
                      </span>
                    )}
                    {(() => {
                      const badge = STATUS_BADGE[tenant.status];
                      return badge ? (
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${badge.className}`}>
                          {badge.label}
                        </span>
                      ) : null;
                    })()}
                    <ChevronDown size={18} className="text-pork-ink/30 transition group-open:rotate-180" />
                  </div>
                  <p className="mt-1 text-sm text-pork-ink/55">
                    {tenant.domains.length > 0
                      ? tenant.domains.join(" · ")
                      : <span className="italic text-pork-ink/35">nessun dominio — solo preview</span>}
                  </p>
                  {tenant.previewSlug && !demoDisabled[tenant.id] && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <a
                        href={`${PREVIEW_HOST[tenant.vertical] ?? "https://demo.menuary.it"}/${tenant.previewSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-pork-red hover:underline"
                      >
                        <ExternalLink size={12} />
                        Link demo
                      </a>
                      {tenant.domains.length > 0 && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            setDemoDisabled((prev) => ({ ...prev, [tenant.id]: true }));
                          }}
                          className="rounded-full bg-pork-ink/5 px-2 py-1 text-[10px] font-black uppercase text-pork-ink/45 hover:bg-pork-ink/10"
                        >
                          Disattiva demo
                        </button>
                      )}
                    </div>
                  )}
                  {tenant.previewSlug && demoDisabled[tenant.id] && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        setDemoDisabled((prev) => ({ ...prev, [tenant.id]: false }));
                      }}
                      className="mt-1.5 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-700 hover:bg-indigo-100"
                    >
                      Riattiva demo temporanea
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={getTenantGestioneExternalHref(tenant.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/70 hover:border-pork-red/30 hover:text-pork-red"
                  >
                    Gestione tenant <ExternalLink size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      persistTenantEnabled(tenant.id, !effective.enabled);
                    }}
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
              </summary>

              {lead && (
                <div className="mt-5 grid gap-3 rounded-2xl bg-pork-cream p-4 md:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-pork-ink/40">Origine CRM</p>
                    <Link href={`/admin/crm/${lead.id}`} className="mt-1 inline-flex items-center gap-1 text-sm font-black text-pork-red hover:underline">
                      Apri lead <ExternalLink size={12} />
                    </Link>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-pork-ink/40">Contatto</p>
                    <p className="mt-1 text-sm font-semibold">{lead.contact_name} · {lead.contact_email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-pork-ink/40">Sedi</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">
                      <MapPin size={13} /> {lead.locations.length}
                    </p>
                  </div>
                  {subscription?.package && (
                    <div className="md:col-span-3">
                      <p className="text-[10px] font-black uppercase text-pork-ink/40">Piano ereditato</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">
                        <CreditCard size={13} />
                        {tenant.vertical === "services" && subscription.package.adapted_name
                          ? `${subscription.package.adapted_name} (${subscription.package.name})`
                          : subscription.package.name}
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                                <p className="font-bold">{getModuleCopy(feature.key, tenant.vertical).label}</p>
                                <p className="mt-1 text-sm text-pork-ink/60">
                                  {getModuleCopy(feature.key, tenant.vertical).description}
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
                                          getModuleCopy(dependency, tenant.vertical).label,
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

              <div className="mt-4">
                <AdminTenantLocationsPanel
                  tenantId={tenant.id}
                  multiLocationEnabled={effective.features.multiLocation}
                />
              </div>

              <div className="mt-4 rounded-2xl bg-pork-cream p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-pork-ink">
                  <Plug size={16} className="text-pork-red" />
                  Integrazioni esterne
                </div>
                <p className="mt-1 text-xs text-pork-ink/55">
                  Connettori verso piattaforme di terze parti. La configurazione resta sotto Menuary, il tenant non vede né modifica nulla.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      if (!effective.features.hubriseSync) return;
                      setHubriseOpenFor(tenant.id);
                    }}
                    disabled={!effective.features.hubriseSync}
                    className={
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition " +
                      (effective.features.hubriseSync
                        ? "bg-white ring-1 ring-pork-ink/15 hover:ring-pork-red/40 hover:text-pork-red"
                        : "bg-pork-ink/5 text-pork-ink/35 cursor-not-allowed")
                    }
                    title={
                      effective.features.hubriseSync
                        ? "Gestisci collegamento HubRise per sede"
                        : "Attiva prima il modulo 'Integrazione HubRise' nei moduli"
                    }
                  >
                    <Plug size={14} />
                    HubRise
                  </button>
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {hubriseOpenFor && (
        <HubriseIntegrationModal
          tenantId={hubriseOpenFor}
          tenantName={TENANTS.find((t) => t.id === hubriseOpenFor)?.label ?? hubriseOpenFor}
          open
          onClose={() => setHubriseOpenFor(null)}
        />
      )}
    </div>
  );
}
