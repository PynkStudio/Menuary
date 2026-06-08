"use client";

import Link from "next/link";
import {
  CreditCard,
  ExternalLink,
  Eye,
  Filter,
  MapPin,
  Plug,
  Power,
  RotateCcw,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { HubriseIntegrationModal } from "@/components/admin/tenant/hubrise-integration-modal";
import { StripeIntegrationModal } from "@/components/admin/tenant/stripe-integration-modal";
import { HubriseInboxBanner } from "@/components/admin/tenant/hubrise-inbox-banner";
import { AdminTenantLocationsPanel } from "@/components/admin/tenant-locations-panel";
import { useTenant } from "@/components/core/tenant-provider";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import type {
  TenantFeatureFlags,
  TenantFeatureKey,
  TenantProfile,
  TenantStatus,
  TenantVertical,
} from "@/lib/tenant";
import { TENANTS } from "@/lib/tenant-registry";
import {
  formatFeatureDependencies,
  getMissingFeatureDependencies,
  getTenantModulesForVertical,
  isTenantModuleVerticalAware,
  TENANT_MODULE_CATEGORIES,
  type TenantModuleDefinition,
} from "@/lib/tenant-modules";
import { getModuleCopy, getVerticalMeta } from "@/lib/vertical";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import { PLATFORM_LEADS, PLATFORM_SUBSCRIPTIONS } from "@/lib/platform-admin-data";
import {
  mergeTenantOverrides,
  useTenantAdminStore,
} from "@/store/tenant-admin-store";

const PREVIEW_HOST: Record<TenantVertical, string> = {
  food: "https://demo.menuary.it",
  services: "https://demo.bizery.it",
  creative: "https://demo.weuseorpheo.com",
};

const STATUS_BADGE: Record<TenantStatus, { label: string; className: string }> = {
  active: { label: "Attivo", className: "bg-pork-green text-white" },
  trial: { label: "Trial", className: "bg-pork-mustard text-pork-ink" },
  offline: { label: "Offline", className: "bg-pork-ink/20 text-pork-ink/60" },
  trattativa: { label: "Trattativa", className: "bg-amber-100 text-amber-800" },
};

const VERTICAL_FILTERS: Array<{ value: "all" | TenantVertical; label: string }> = [
  { value: "all", label: "Tutti" },
  { value: "food", label: "Menuary" },
  { value: "services", label: "Bizery" },
  { value: "creative", label: "Orpheo" },
];

type DemoControl = {
  tenantId: string;
  enabled: boolean;
  backendLive: boolean;
};

type TenantAdvancedModalProps = {
  tenant: TenantProfile;
  effective: TenantProfile;
  lead: (typeof PLATFORM_LEADS)[number] | undefined;
  subscription: (typeof PLATFORM_SUBSCRIPTIONS)[number] | null;
  showAllModules: boolean;
  onToggleShowAllModules: () => void;
  onClose: () => void;
  onResetTenant: () => void;
  onSetFeatureEnabled: (
    tenantId: string,
    feature: TenantFeatureKey,
    enabled: boolean,
  ) => void;
  onOpenHubrise: () => void;
  onOpenStripe: () => void;
};

export default function AdminTenantPage() {
  const mode = usePlatformMode();
  const activeTenant = useTenant();
  const overrides = useTenantAdminStore((state) => state.overrides);
  const setTenantEnabled = useTenantAdminStore((state) => state.setTenantEnabled);
  const setFeatureEnabled = useTenantAdminStore((state) => state.setFeatureEnabled);
  const resetTenant = useTenantAdminStore((state) => state.resetTenant);
  const [verticalFilter, setVerticalFilter] = useState<"all" | TenantVertical>("all");
  const [advancedOpenFor, setAdvancedOpenFor] = useState<string | null>(null);
  const [showAllModules, setShowAllModules] = useState(false);
  const [demoControls, setDemoControls] = useState<Record<string, DemoControl>>({});
  const [demoSaving, setDemoSaving] = useState<Record<string, boolean>>({});
  const [demoError, setDemoError] = useState<string | null>(null);
  const [hubriseOpenFor, setHubriseOpenFor] = useState<string | null>(null);
  const [stripeOpenFor, setStripeOpenFor] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/demo-status", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { controls?: DemoControl[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Impossibile caricare lo stato delle demo.");
        setDemoControls(
          Object.fromEntries((payload.controls ?? []).map((control) => [control.tenantId, control])),
        );
      })
      .catch((error) => {
        setDemoError(error instanceof Error ? error.message : "Impossibile caricare lo stato delle demo.");
      });
  }, []);

  const filteredTenants = useMemo(
    () =>
      TENANTS.filter((tenant) => verticalFilter === "all" || tenant.vertical === verticalFilter),
    [verticalFilter],
  );

  const advancedTenant = advancedOpenFor
    ? TENANTS.find((tenant) => tenant.id === advancedOpenFor)
    : undefined;
  const advancedEffective = advancedTenant
    ? mergeTenantOverrides(advancedTenant, overrides[advancedTenant.id])
    : undefined;
  const advancedLead = advancedTenant
    ? PLATFORM_LEADS.find((item) => item.tenant_id === advancedTenant.id)
    : undefined;
  const advancedSubscription = advancedLead
    ? PLATFORM_SUBSCRIPTIONS.find((item) => item.lead_id === advancedLead.id) ?? null
    : null;

  function persistTenantEnabled(tenantId: string, enabled: boolean) {
    setTenantEnabled(tenantId, enabled);
    void fetch("/api/admin/tenant-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, enabled }),
    });
  }

  async function patchDemoControl(tenantId: string, patch: { enabled?: boolean; backendLive?: boolean }) {
    setDemoSaving((previous) => ({ ...previous, [tenantId]: true }));
    setDemoError(null);
    try {
      const response = await fetch("/api/admin/demo-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...patch }),
      });
      const payload = (await response.json()) as { control?: DemoControl; error?: string };
      if (!response.ok || !payload.control) {
        throw new Error(payload.error ?? "Impossibile aggiornare lo stato della demo.");
      }
      setDemoControls((previous) => ({ ...previous, [tenantId]: payload.control! }));
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : "Impossibile aggiornare lo stato della demo.");
    } finally {
      setDemoSaving((previous) => ({ ...previous, [tenantId]: false }));
    }
  }

  const persistDemoEnabled = (tenantId: string, enabled: boolean) =>
    patchDemoControl(tenantId, { enabled });
  const persistBackendLive = (tenantId: string, backendLive: boolean) =>
    patchDemoControl(tenantId, { backendLive });

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
      <header className="max-w-4xl">
        <p className="impact-title text-xs text-pork-red">Piattaforma</p>
        <h1 className="headline text-4xl">Tenant</h1>
        <p className="mt-2 text-pork-ink/65">
          Lista operativa dei profili cliente. Le righe mostrano solo dati base e azioni rapide;
          moduli, sedi e integrazioni restano nelle impostazioni avanzate.
        </p>
      </header>

      <HubriseInboxBanner />

      {demoError && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {demoError}
        </p>
      )}

      <section className="rounded-3xl bg-white p-4 ring-1 ring-pork-ink/10 sm:p-5">
        <div className="flex flex-col gap-4 border-b border-pork-ink/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-black text-pork-ink">
              <Filter size={16} className="text-pork-red" />
              Filtro vertical
            </div>
            <p className="mt-1 text-xs text-pork-ink/50">
              {filteredTenants.length} tenant visibili su {TENANTS.length}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {VERTICAL_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setVerticalFilter(filter.value)}
                className={
                  "rounded-full px-4 py-2 text-sm font-black transition " +
                  (verticalFilter === filter.value
                    ? "bg-pork-red text-white"
                    : "bg-pork-cream text-pork-ink/65 hover:text-pork-red")
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 divide-y divide-pork-ink/10">
          {filteredTenants.map((tenant) => {
            const effective = mergeTenantOverrides(tenant, overrides[tenant.id]);
            const current = tenant.id === activeTenant.id;
            const demoEnabled = demoControls[tenant.id]?.enabled ?? true;
            const backendLive = demoControls[tenant.id]?.backendLive ?? false;
            const isDemoSaving = demoSaving[tenant.id] ?? false;
            const enabledModules = Object.values(effective.features).filter(Boolean).length;
            const verticalMeta = getVerticalMeta(tenant.vertical);

            return (
              <article key={tenant.id} className="grid gap-4 py-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="headline text-2xl">{tenant.name}</h2>
                    {current && (
                      <span className="rounded-full bg-pork-mustard px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-pork-ink">
                        Corrente
                      </span>
                    )}
                    <StatusBadge status={tenant.status} />
                    <span className="rounded-full bg-pork-cream px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-pork-ink/55">
                      {verticalMeta.productName}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-pork-ink/55">
                    {tenant.domains.length > 0
                      ? tenant.domains.join(" · ")
                      : "Nessun dominio, solo preview"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-pork-ink/45">
                    <span>ID: {tenant.id}</span>
                    <span>{enabledModules} moduli inclusi</span>
                    <span>{effective.enabled ? "Produzione abilitata" : "Produzione spenta"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tenant.previewSlug && (
                    <>
                      <a
                        href={`${PREVIEW_HOST[tenant.vertical]}/${tenant.previewSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-3 py-2 text-sm font-bold text-pork-ink/70 hover:border-pork-red/30 hover:text-pork-red"
                      >
                        <Eye size={14} />
                        Demo
                      </a>
                      <button
                        type="button"
                        disabled={isDemoSaving}
                        onClick={() => persistDemoEnabled(tenant.id, !demoEnabled)}
                        className={
                          "rounded-full px-3 py-2 text-xs font-black uppercase transition disabled:cursor-wait disabled:opacity-50 " +
                          (demoEnabled
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-pork-ink/10 text-pork-ink/55 hover:bg-pork-ink/15")
                        }
                      >
                        {isDemoSaving ? "..." : demoEnabled ? "Demo online" : "Demo offline"}
                      </button>
                      <button
                        type="button"
                        disabled={isDemoSaving}
                        onClick={() => persistBackendLive(tenant.id, !backendLive)}
                        title="Quando attivo, la gestione demo usa Supabase reale."
                        className={
                          "rounded-full px-3 py-2 text-xs font-black uppercase transition disabled:cursor-wait disabled:opacity-50 " +
                          (backendLive
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-pork-ink/5 text-pork-ink/45 hover:bg-pork-ink/10")
                        }
                      >
                        {isDemoSaving ? "..." : backendLive ? "Backend live" : "Backend demo"}
                      </button>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                  <Link
                    href={getTenantGestioneExternalHref(tenant.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/70 hover:border-pork-red/30 hover:text-pork-red"
                  >
                    Gestione <ExternalLink size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => persistTenantEnabled(tenant.id, !effective.enabled)}
                    className={
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition " +
                      (effective.enabled
                        ? "bg-pork-green text-white"
                        : "bg-pork-ink/10 text-pork-ink/60")
                    }
                  >
                    <Power size={16} />
                    {effective.enabled ? "Attivo" : "Spento"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAllModules(false);
                      setAdvancedOpenFor(tenant.id);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-pork-red px-4 py-2 text-sm font-bold text-white transition hover:bg-pork-red-dark"
                  >
                    <Settings size={16} />
                    Avanzate
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {advancedTenant && advancedEffective && (
        <TenantAdvancedModal
          tenant={advancedTenant}
          effective={advancedEffective}
          lead={advancedLead}
          subscription={advancedSubscription}
          showAllModules={showAllModules}
          onToggleShowAllModules={() => setShowAllModules((value) => !value)}
          onClose={() => setAdvancedOpenFor(null)}
          onResetTenant={() => resetTenant(advancedTenant.id)}
          onSetFeatureEnabled={setFeatureEnabled}
          onOpenHubrise={() => setHubriseOpenFor(advancedTenant.id)}
          onOpenStripe={() => setStripeOpenFor(advancedTenant.id)}
        />
      )}

      {hubriseOpenFor && (
        <HubriseIntegrationModal
          tenantId={hubriseOpenFor}
          tenantName={TENANTS.find((t) => t.id === hubriseOpenFor)?.label ?? hubriseOpenFor}
          open
          onClose={() => setHubriseOpenFor(null)}
        />
      )}
      {stripeOpenFor && (
        <StripeIntegrationModal
          tenantId={stripeOpenFor}
          tenantName={TENANTS.find((t) => t.id === stripeOpenFor)?.label ?? stripeOpenFor}
          open
          onClose={() => setStripeOpenFor(null)}
        />
      )}
    </div>
  );
}

function TenantAdvancedModal({
  tenant,
  effective,
  lead,
  subscription,
  showAllModules,
  onToggleShowAllModules,
  onClose,
  onResetTenant,
  onSetFeatureEnabled,
  onOpenHubrise,
  onOpenStripe,
}: TenantAdvancedModalProps) {
  const primaryModules = getTenantModulesForVertical(tenant.vertical);
  const otherModules = getTenantModulesForVertical(tenant.vertical, { includeOtherVerticals: true })
    .filter((module) => !isTenantModuleVerticalAware(module, tenant.vertical));
  const verticalMeta = getVerticalMeta(tenant.vertical);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pork-ink/45 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tenant-advanced-title"
        className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl ring-1 ring-pork-ink/10"
      >
        <div className="sticky top-0 z-10 flex flex-col gap-4 rounded-t-3xl border-b border-pork-ink/10 bg-white/95 p-5 backdrop-blur md:flex-row md:items-start md:justify-between">
          <div>
            <p className="impact-title text-xs text-pork-red">Impostazioni avanzate</p>
            <h2 id="tenant-advanced-title" className="headline text-3xl">
              {tenant.name}
            </h2>
            <p className="mt-1 text-sm text-pork-ink/55">
              {verticalMeta.productName} · {tenant.domains.length > 0 ? tenant.domains.join(" · ") : "solo preview"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pork-cream text-pork-ink/70 transition hover:text-pork-red"
            aria-label="Chiudi impostazioni avanzate"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {lead && (
              <section className="rounded-2xl bg-pork-cream p-4">
                <div className="grid gap-3 md:grid-cols-3">
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
              </section>
            )}

            <section className="rounded-2xl bg-pork-cream p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-pork-ink">
                  <ShieldCheck size={16} className="text-pork-red" />
                  Moduli {verticalMeta.productName}
                </div>
                {otherModules.length > 0 && (
                  <button
                    type="button"
                    onClick={onToggleShowAllModules}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-pork-ink/60 ring-1 ring-pork-ink/10 transition hover:text-pork-red"
                  >
                    {showAllModules ? "Nascondi altri vertical" : "Mostra tutti"}
                  </button>
                )}
              </div>

              <ModuleCategoryList
                modules={primaryModules}
                features={effective.features}
                tenant={tenant}
                onSetFeatureEnabled={onSetFeatureEnabled}
              />

              {showAllModules && otherModules.length > 0 && (
                <div className="mt-6 border-t border-pork-ink/10 pt-5">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-pork-ink/45">
                    Moduli altri vertical riusabili
                  </p>
                  <ModuleCategoryList
                    modules={otherModules}
                    features={effective.features}
                    tenant={tenant}
                    onSetFeatureEnabled={onSetFeatureEnabled}
                  />
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl bg-pork-cream p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-pork-ink">
                <MapPin size={16} className="text-pork-red" />
                Sedi
              </div>
              <div className="mt-3">
                <AdminTenantLocationsPanel
                  tenantId={tenant.id}
                  multiLocationEnabled={effective.features.multiLocation}
                />
              </div>
            </section>

            <section className="rounded-2xl bg-pork-cream p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-pork-ink">
                <Plug size={16} className="text-pork-red" />
                Integrazioni esterne
              </div>
              <p className="mt-1 text-xs text-pork-ink/55">
                Connettori verso piattaforme di terze parti configurati dal controllo centrale.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onOpenHubrise}
                  disabled={!effective.features.hubriseSync}
                  className={
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition " +
                    (effective.features.hubriseSync
                      ? "bg-white ring-1 ring-pork-ink/15 hover:ring-pork-red/40 hover:text-pork-red"
                      : "cursor-not-allowed bg-pork-ink/5 text-pork-ink/35")
                  }
                  title={
                    effective.features.hubriseSync
                      ? "Gestisci collegamento HubRise per sede"
                      : "Attiva prima il modulo Integrazione HubRise"
                  }
                >
                  <Plug size={14} />
                  HubRise
                </button>
                <button
                  type="button"
                  onClick={onOpenStripe}
                  disabled={!effective.features.payments}
                  className={
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition " +
                    (effective.features.payments
                      ? "bg-white ring-1 ring-pork-ink/15 hover:ring-pork-red/40 hover:text-pork-red"
                      : "cursor-not-allowed bg-pork-ink/5 text-pork-ink/35")
                  }
                  title={
                    effective.features.payments
                      ? "Collega l'account Stripe del tenant"
                      : "Attiva prima il modulo Pagamenti Stripe"
                  }
                >
                  <Plug size={14} />
                  Stripe
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-pork-cream p-4">
              <p className="text-sm text-pork-ink/55">
                I toggle sono commerciali: decidono cosa il tenant può usare o sospendere.
              </p>
              <button
                type="button"
                onClick={onResetTenant}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-pork-ink/15 bg-white px-4 py-2 text-sm font-bold text-pork-ink/70 transition hover:border-pork-red/40 hover:text-pork-red"
              >
                <RotateCcw size={15} />
                Ripristina profilo
              </button>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

function ModuleCategoryList({
  modules,
  features,
  tenant,
  onSetFeatureEnabled,
}: {
  modules: TenantModuleDefinition[];
  features: TenantFeatureFlags;
  tenant: TenantProfile;
  onSetFeatureEnabled: (
    tenantId: string,
    feature: TenantFeatureKey,
    enabled: boolean,
  ) => void;
}) {
  return (
    <div className="mt-4 space-y-5">
      {TENANT_MODULE_CATEGORIES.map((category) => {
        const categoryModules = modules.filter((feature) => feature.category === category);
        if (categoryModules.length === 0) return null;

        return (
          <div key={category}>
            <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-pork-ink/45">
              {category}
            </p>
            <div className="space-y-3">
              {categoryModules.map((feature) => {
                const enabled = features[feature.key];
                const missing = getMissingFeatureDependencies(features, feature.key);
                const dependencyNote = formatFeatureDependencies(feature.key);
                const moduleCopy = getModuleCopy(feature.key, tenant.vertical);

                return (
                  <div
                    key={feature.key}
                    className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-pork-ink/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-bold">{moduleCopy.label}</p>
                      <p className="mt-1 text-sm text-pork-ink/60">{moduleCopy.description}</p>
                      {dependencyNote && (
                        <p className="mt-2 text-xs font-bold text-pork-ink/45">
                          {dependencyNote}
                        </p>
                      )}
                      {missing.length > 0 && (
                        <p className="mt-2 rounded-xl bg-pork-mustard/25 px-3 py-2 text-xs font-bold text-pork-ink/70">
                          Bloccato: attiva{" "}
                          {missing
                            .map((dependency) => getModuleCopy(dependency, tenant.vertical).label)
                            .join(" oppure ")}
                          .
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSetFeatureEnabled(tenant.id, feature.key, !enabled)}
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
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: TenantStatus }) {
  const badge = STATUS_BADGE[status];
  if (!badge) return null;

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${badge.className}`}>
      {badge.label}
    </span>
  );
}
