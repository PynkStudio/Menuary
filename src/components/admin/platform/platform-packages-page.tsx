"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Pencil,
  ChevronUp,
  ChevronDown,
  Euro,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  Check,
  ExternalLink,
  Globe,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformPackage } from "@/lib/platform-crm-types";
import { TENANT_MODULES, TENANT_MODULE_CATEGORIES } from "@/lib/tenant-modules";
import type { TenantFeatureKey } from "@/lib/tenant";
import { PRICING_PLANS } from "@/lib/platform-pricing";
import { MARKETS, type MarketCode } from "@/lib/markets";

// ─── Tipo esteso con campi marketing ─────────────────────────────────────────

type PlatformPackageExtended = PlatformPackage & {
  package_kind?: "base" | "addon";
  min_package_slug?: string | null;
  settings?: Record<string, unknown> | null;
  marketing_name: string | null;
  tagline: string | null;
  marketing_description: string | null;
  price_monthly_billing: number | null; // prezzo con fatturazione mensile
  setup_from: string | null;
  marketing_items: string[];
  is_featured: boolean;
  cta_label: string | null;
  market_prices?: PackageMarketPrice[];
};

type PackageMarketPrice = {
  country_code: MarketCode;
  currency: string;
  price_monthly: number | null;
  price_monthly_billing: number | null;
  setup_from: string | null;
};

// ─── Mock dati (da platform-pricing.ts come fonte) ───────────────────────────

const MOCK_PACKAGES: PlatformPackageExtended[] = PRICING_PLANS.map((p, i) => ({
  id: `pkg-${p.slug}`,
  name: p.slug,
  slug: p.slug,
  description: p.description,
  vertical: "both",
  adapted_name: p.slug === "prenotazioni" ? "Appuntamenti" : null,
  price_monthly: p.price_annual,
  price_yearly: p.price_annual * 10,
  currency: "EUR",
  modules: p.slug === "vetrina"
    ? ["website", "onlineMenu", "reservations"] as TenantFeatureKey[]
    : p.slug === "operativita"
    ? ["website", "onlineMenu", "reservations", "takeaway", "tableOrders",
       "reviews", "gallery", "favorites", "crm", "analytics", "upselling",
       "kitchenDisplay", "printStations", "productAvailability", "takeawaySlots",
       "deliveryHub", "inventoryFoodCost", "staffRoles", "tablePlanner"] as TenantFeatureKey[]
    : TENANT_MODULES.map((m) => m.key),
  is_active: true,
  sort_order: i + 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  // Campi marketing
  marketing_name: p.marketing_name,
  tagline: p.tagline,
  marketing_description: p.description,
  price_monthly_billing: p.price_monthly,
  setup_from: p.setup_from,
  marketing_items: p.marketing_items,
  is_featured: p.is_featured ?? false,
  cta_label: p.cta_label ?? null,
}));

// ─── Tipo form ────────────────────────────────────────────────────────────────

type PackageForm = {
  // Commerciale
  marketing_name: string;
  tagline: string;
  marketing_description: string;
  price_annual: string;        // price_monthly nel DB = canone annuale/mese
  price_monthly_billing: string;
  setup_from: string;
  marketing_items_raw: string; // newline-separated
  is_featured: boolean;
  cta_label: string;
  package_kind: "base" | "addon";
  min_package_slug: string;
  included_minutes: string;
  overage_mode: "cost" | "fixed";
  voice_cloning: boolean;
  channels_raw: string;
  languages_raw: string;
  market_prices: Record<MarketCode, {
    currency: string;
    price_monthly: string;
    price_monthly_billing: string;
    setup_from: string;
  }>;
  // Tecnico
  slug: string;
  modules: TenantFeatureKey[];
  is_active: boolean;
};

function emptyForm(): PackageForm {
  return {
    marketing_name: "",
    tagline: "",
    marketing_description: "",
    price_annual: "",
    price_monthly_billing: "",
    setup_from: "",
    marketing_items_raw: "",
    is_featured: false,
    cta_label: "",
    package_kind: "base",
    min_package_slug: "",
    included_minutes: "",
    overage_mode: "cost",
    voice_cloning: false,
    channels_raw: "",
    languages_raw: "",
    market_prices: emptyMarketPrices(),
    slug: "",
    modules: [],
    is_active: true,
  };
}

function emptyMarketPrices() {
  return Object.fromEntries(
    MARKETS.map((market) => [
      market.code,
      {
        currency: market.currency,
        price_monthly: "",
        price_monthly_billing: "",
        setup_from: "",
      },
    ]),
  ) as PackageForm["market_prices"];
}

function pkgToForm(p: PlatformPackageExtended): PackageForm {
  const marketPrices = emptyMarketPrices();
  for (const price of p.market_prices ?? []) {
    marketPrices[price.country_code] = {
      currency: price.currency,
      price_monthly: price.price_monthly != null ? String(price.price_monthly) : "",
      price_monthly_billing:
        price.price_monthly_billing != null ? String(price.price_monthly_billing) : "",
      setup_from: price.setup_from ?? "",
    };
  }
  const settings = (p.settings ?? {}) as Record<string, unknown>;
  return {
    marketing_name: p.marketing_name ?? "",
    tagline: p.tagline ?? "",
    marketing_description: p.marketing_description ?? "",
    price_annual: String(p.price_monthly),
    price_monthly_billing: p.price_monthly_billing != null ? String(p.price_monthly_billing) : "",
    setup_from: p.setup_from ?? "",
    marketing_items_raw: p.marketing_items.join("\n"),
    is_featured: p.is_featured,
    cta_label: p.cta_label ?? "",
    package_kind: p.package_kind === "addon" ? "addon" : "base",
    min_package_slug: p.min_package_slug ?? "",
    included_minutes: settings.includedMinutes != null ? String(settings.includedMinutes) : "",
    overage_mode: settings.overageMode === "fixed" ? "fixed" : "cost",
    voice_cloning: settings.voiceCloning === true,
    channels_raw: Array.isArray(settings.channels) ? settings.channels.join(", ") : "",
    languages_raw: Array.isArray(settings.languages) ? settings.languages.join(", ") : "",
    market_prices: marketPrices,
    slug: p.slug,
    modules: [...p.modules],
    is_active: p.is_active,
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PlatformPackagesPage() {
  const [packages, setPackages] = useState<PlatformPackageExtended[]>(MOCK_PACKAGES);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm());
  const [tab, setTab] = useState<"marketing" | "tech">("marketing");
  const [kindFilter, setKindFilter] = useState<"base" | "addon">("base");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/packages")
      .then((res) => res.json())
      .then((json: { packages?: PlatformPackageExtended[]; market_prices?: PackageMarketPrice[]; error?: string }) => {
        if (!alive) return;
        if (json.error) throw new Error(json.error);
        const marketPrices = json.market_prices ?? [];
        setPackages(
          (json.packages ?? []).map((pkg) => ({
            ...pkg,
            market_prices: marketPrices.filter((price) => price.country_code && (price as PackageMarketPrice & { package_slug?: string }).package_slug === pkg.slug),
          })),
        );
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Non riesco a caricare i pacchetti.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function startNew() {
    setForm(emptyForm());
    setEditing("new");
    setTab("marketing");
  }

  function startEdit(pkg: PlatformPackageExtended) {
    setForm(pkgToForm(pkg));
    setEditing(pkg.id);
    setTab("marketing");
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function savePackage() {
    setSaving(true);
    setError(null);
    const annual = parseFloat(form.price_annual) || 0;
    const monthly = form.price_monthly_billing ? parseFloat(form.price_monthly_billing) : null;
    const items = form.marketing_items_raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const marketPrices = MARKETS.map((market) => ({
      country_code: market.code,
      currency: form.market_prices[market.code].currency,
      price_monthly: form.market_prices[market.code].price_monthly || null,
      price_monthly_billing: form.market_prices[market.code].price_monthly_billing || null,
      setup_from: form.market_prices[market.code].setup_from || null,
    })).filter((row) => row.price_monthly || row.price_monthly_billing || row.setup_from);

    try {
      const res = await fetch("/api/admin/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing === "new" ? null : editing,
          slug: form.slug,
          marketing_name: form.marketing_name,
          tagline: form.tagline,
          marketing_description: form.marketing_description,
          price_monthly: annual,
          price_monthly_billing: monthly,
          setup_from: form.setup_from || null,
          marketing_items: items,
          is_featured: form.is_featured,
          cta_label: form.cta_label || null,
          package_kind: form.package_kind,
          min_package_slug: form.min_package_slug || null,
          settings: {
            includedMinutes: form.included_minutes ? Number(form.included_minutes) : undefined,
            overageMode: form.overage_mode,
            voiceCloning: form.voice_cloning,
            channels: form.channels_raw.split(",").map((item) => item.trim()).filter(Boolean),
            languages: form.languages_raw.split(",").map((item) => item.trim()).filter(Boolean),
          },
          modules: form.modules,
          is_active: form.is_active,
          sort_order: editing === "new" ? packages.length + 1 : packages.find((p) => p.id === editing)?.sort_order,
          market_prices: marketPrices,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; package?: PlatformPackageExtended; market_prices?: PackageMarketPrice[] };
      if (!res.ok || json.error || !json.package) throw new Error(json.error ?? "Salvataggio non riuscito.");
      const saved = { ...json.package, market_prices: json.market_prices ?? [] };
      setPackages((prev) =>
        editing === "new"
          ? [...prev, saved]
          : prev.map((p) => (p.id === editing ? saved : p)),
      );
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Salvataggio non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  function toggleModule(key: TenantFeatureKey) {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.includes(key)
        ? prev.modules.filter((m) => m !== key)
        : [...prev.modules, key],
    }));
  }

  function moveUp(id: string) {
    setPackages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((p, i) => ({ ...p, sort_order: i + 1 }));
    });
  }

  function moveDown(id: string) {
    setPackages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((p, i) => ({ ...p, sort_order: i + 1 }));
    });
  }

  function toggleActive(id: string) {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)),
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Piattaforma</p>
          <h1 className="headline text-4xl">Pacchetti</h1>
          <p className="mt-1 text-pork-ink/60">
            Gestisci i piani commerciali esposti su{" "}
            <a
              href="https://menuary.it/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-pork-red hover:underline"
            >
              menuary.it/pricing <ExternalLink size={12} />
            </a>
            . I nuovi moduli del catalogo sono immediatamente selezionabili.
          </p>
        </div>
        {!editing && (
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-2.5 font-bold text-white transition hover:bg-pork-red/90"
          >
            <Plus size={16} /> Nuovo pacchetto
          </button>
        )}
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-pork-ink/60 ring-1 ring-pork-ink/10">
          <Loader2 size={16} className="animate-spin" />
          Caricamento pacchetti da Supabase…
        </div>
      )}

      <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-pork-ink/10">
        {(["base", "addon"] as const).map((kind) => (
          <button
            key={kind}
            onClick={() => setKindFilter(kind)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-black transition",
              kindFilter === kind ? "bg-pork-ink text-white" : "text-pork-ink/55 hover:text-pork-ink",
            )}
          >
            {kind === "base" ? "Piani principali" : "Piani aggiuntivi"}
          </button>
        ))}
      </div>

      {/* Form */}
      {editing && (
        <PackageFormPanel
          form={form}
          tab={tab}
          isNew={editing === "new"}
          onChange={setForm}
          onToggleModule={toggleModule}
          onSave={savePackage}
          saving={saving}
          basePackages={packages.filter((p) => (p.package_kind ?? "base") === "base")}
          onCancel={cancelEdit}
          onTabChange={setTab}
        />
      )}

      {/* Lista */}
      <div className="space-y-4">
        {packages.filter((pkg) => (pkg.package_kind ?? "base") === kindFilter).map((pkg, idx, visible) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            isFirst={idx === 0}
            isLast={idx === visible.length - 1}
            isEditing={editing === pkg.id}
            onEdit={() => startEdit(pkg)}
            onMoveUp={() => moveUp(pkg.id)}
            onMoveDown={() => moveDown(pkg.id)}
            onToggleActive={() => toggleActive(pkg.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Card pacchetto ───────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  isFirst,
  isLast,
  isEditing,
  onEdit,
  onMoveUp,
  onMoveDown,
  onToggleActive,
}: {
  pkg: PlatformPackageExtended;
  isFirst: boolean;
  isLast: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleActive: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const saving = pkg.price_monthly_billing != null
    ? (pkg.price_monthly_billing - pkg.price_monthly) * 12
    : null;

  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-6 ring-1 transition",
        isEditing ? "ring-pork-red/40" : "ring-pork-ink/10",
        !pkg.is_active && "opacity-50",
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        {/* Ordinamento */}
        <div className="flex flex-col gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className="rounded-lg p-1 text-pork-ink/30 hover:text-pork-ink disabled:opacity-20">
            <ChevronUp size={16} />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="rounded-lg p-1 text-pork-ink/30 hover:text-pork-ink disabled:opacity-20">
            <ChevronDown size={16} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Package size={16} className="text-pork-red" />
            <h2 className="headline text-2xl">{pkg.marketing_name ?? pkg.name}</h2>
            {pkg.tagline && (
              <span className="text-sm text-pork-ink/50">{pkg.tagline}</span>
            )}
            {pkg.is_featured && (
              <span className="rounded-full bg-pork-mustard/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-pork-ink">
                In evidenza
              </span>
            )}
            {!pkg.is_active && (
              <span className="rounded-full bg-pork-ink/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-pork-ink/50">
                Inattivo
              </span>
            )}
          </div>

          {/* Prezzi */}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="rounded-xl bg-pork-cream px-3 py-1.5">
              <span className="text-xs text-pork-ink/50">Annuale: </span>
              <span className="font-black">€{pkg.price_monthly}/mese</span>
            </div>
            {pkg.price_monthly_billing != null && (
              <div className="rounded-xl bg-pork-ink/5 px-3 py-1.5">
                <span className="text-xs text-pork-ink/50">Mensile: </span>
                <span className="font-black">€{pkg.price_monthly_billing}/mese</span>
              </div>
            )}
            {saving != null && saving > 0 && (
              <span className="text-xs text-pork-green font-semibold">
                risparmio annuale €{saving}
              </span>
            )}
            {pkg.setup_from && (
              <span className="text-xs text-pork-ink/50">Setup: {pkg.setup_from}</span>
            )}
          </div>

          {/* Link sito */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-pork-ink/40">
            <Globe size={11} />
            Esposto su menuary.it/pricing come <strong>{pkg.marketing_name ?? pkg.slug}</strong>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex items-center gap-2">
          <button onClick={onToggleActive} title={pkg.is_active ? "Disattiva" : "Attiva"}>
            {pkg.is_active
              ? <ToggleRight size={22} className="text-pork-green" />
              : <ToggleLeft size={22} className="text-pork-ink/40" />}
          </button>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-full border border-pork-ink/15 px-3 py-1.5 text-sm font-bold text-pork-ink/60 hover:border-pork-red/30 hover:text-pork-red"
          >
            <Pencil size={13} /> Modifica
          </button>
        </div>
      </div>

      {/* Moduli (collassabili) */}
      <div className="mt-4">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-xs font-bold text-pork-ink/40 hover:text-pork-ink"
        >
          {expanded ? "Nascondi" : "Mostra"} moduli ({pkg.modules.length})
        </button>
        {expanded && (
          <div className="mt-3 flex flex-wrap gap-2">
            {TENANT_MODULES.map((m) => (
              <span
                key={m.key}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  pkg.modules.includes(m.key)
                    ? "bg-pork-red/10 text-pork-red"
                    : "bg-pork-ink/5 text-pork-ink/30",
                )}
              >
                {pkg.modules.includes(m.key) && <Check size={10} className="mr-1 inline" />}
                {m.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Form panel ───────────────────────────────────────────────────────────────

function PackageFormPanel({
  form,
  tab,
  isNew,
  onChange,
  onToggleModule,
  onSave,
  saving,
  basePackages,
  onCancel,
  onTabChange,
}: {
  form: PackageForm;
  tab: "marketing" | "tech";
  isNew: boolean;
  onChange: (f: PackageForm) => void;
  onToggleModule: (k: TenantFeatureKey) => void;
  onSave: () => void;
  saving: boolean;
  basePackages: PlatformPackageExtended[];
  onCancel: () => void;
  onTabChange: (t: "marketing" | "tech") => void;
}) {
  function set(field: keyof PackageForm, value: unknown) {
    onChange({ ...form, [field]: value });
  }

  return (
    <div className="rounded-3xl bg-pork-cream p-6 ring-2 ring-pork-red/20">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="headline text-2xl">
          {isNew ? "Nuovo pacchetto" : `Modifica — ${form.marketing_name || form.slug}`}
        </h2>
        <button onClick={onCancel} className="text-pork-ink/40 hover:text-pork-ink">
          <X size={20} />
        </button>
      </div>

      {/* Tab marketing / tecnico */}
      <div className="mb-6 flex gap-1 rounded-xl bg-pork-ink/5 p-1 w-fit">
        {(["marketing", "tech"] as const).map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-bold transition",
              tab === t ? "bg-white text-pork-ink shadow-sm" : "text-pork-ink/55",
            )}
          >
            {t === "marketing" ? "Presentazione (sito)" : "Tecnico (moduli)"}
          </button>
        ))}
      </div>

      {tab === "marketing" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nome commerciale *">
              <input value={form.marketing_name} onChange={(e) => set("marketing_name", e.target.value)} className="input-base" placeholder="Es. Operatività" />
            </FormField>
            <FormField label="Tipo piano">
              <select value={form.package_kind} onChange={(e) => set("package_kind", e.target.value === "addon" ? "addon" : "base")} className="input-base">
                <option value="base">Piano principale</option>
                <option value="addon">Piano aggiuntivo / add-on</option>
              </select>
            </FormField>
            <FormField label="Tagline breve">
              <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className="input-base" placeholder="Es. Sito + gestionale" />
            </FormField>
            <FormField label="Prezzo annuale/mese (€) *" hint="Mostrato sul sito con fatturazione annuale">
              <div className="relative">
                <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pork-ink/40" />
                <input type="number" value={form.price_annual} onChange={(e) => set("price_annual", e.target.value)} className="input-base pl-8" placeholder="82" />
              </div>
            </FormField>
            <FormField label="Prezzo mensile/mese (€)" hint="Mostrato con fatturazione mensile">
              <div className="relative">
                <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pork-ink/40" />
                <input type="number" value={form.price_monthly_billing} onChange={(e) => set("price_monthly_billing", e.target.value)} className="input-base pl-8" placeholder="99" />
              </div>
            </FormField>
            <FormField label="Costo attivazione">
              <input value={form.setup_from} onChange={(e) => set("setup_from", e.target.value)} className="input-base" placeholder="da € 1.490" />
            </FormField>
            <FormField label="Label CTA">
              <input value={form.cta_label} onChange={(e) => set("cta_label", e.target.value)} className="input-base" placeholder="Inizia con Operatività" />
            </FormField>
          </div>

          <FormField label="Descrizione (visibile sul sito)" className="">
            <textarea value={form.marketing_description} onChange={(e) => set("marketing_description", e.target.value)} className="input-base resize-none" rows={3} placeholder="Descrizione commerciale del pacchetto…" />
          </FormField>

          <FormField label="Feature list (una per riga)">
            <textarea
              value={form.marketing_items_raw}
              onChange={(e) => set("marketing_items_raw", e.target.value)}
              className="input-base resize-none font-mono text-xs"
              rows={6}
              placeholder={"Sito su misura, dominio personalizzato\nMenu digitale aggiornabile\nHosting, SSL, backup inclusi"}
            />
            <p className="mt-1 text-[11px] text-pork-ink/40">Ogni riga diventa un bullet nella card del sito.</p>
          </FormField>

          {form.package_kind === "addon" && (
            <div className="grid gap-4 rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10 sm:grid-cols-2">
              <FormField label="Piano minimo richiesto">
                <select value={form.min_package_slug} onChange={(e) => set("min_package_slug", e.target.value)} className="input-base">
                  <option value="">Nessuno</option>
                  {basePackages.map((pkg) => (
                    <option key={pkg.slug} value={pkg.slug}>{pkg.marketing_name ?? pkg.slug}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Minuti inclusi / mese">
                <input type="number" value={form.included_minutes} onChange={(e) => set("included_minutes", e.target.value)} className="input-base" placeholder="120" />
              </FormField>
              <FormField label="Extra minuti">
                <select value={form.overage_mode} onChange={(e) => set("overage_mode", e.target.value === "fixed" ? "fixed" : "cost")} className="input-base">
                  <option value="cost">Prezzo di costo</option>
                  <option value="fixed">Listino fisso concordato</option>
                </select>
              </FormField>
              <FormField label="Cloning vocale">
                <button
                  type="button"
                  onClick={() => set("voice_cloning", !form.voice_cloning)}
                  className={cn("rounded-full px-4 py-3 text-sm font-bold", form.voice_cloning ? "bg-pork-green/15 text-pork-green" : "bg-pork-ink/5 text-pork-ink/50")}
                >
                  {form.voice_cloning ? "Incluso / disponibile" : "Non incluso"}
                </button>
              </FormField>
              <FormField label="Canali" hint="Separati da virgola">
                <input value={form.channels_raw} onChange={(e) => set("channels_raw", e.target.value)} className="input-base" placeholder="phone, whatsapp" />
              </FormField>
              <FormField label="Lingue" hint="Codici separati da virgola">
                <input value={form.languages_raw} onChange={(e) => set("languages_raw", e.target.value)} className="input-base" placeholder="it, en, fr, es, de" />
              </FormField>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("is_featured", !form.is_featured)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                form.is_featured ? "bg-pork-mustard/30 text-pork-ink" : "bg-pork-ink/5 text-pork-ink/50",
              )}
            >
              {form.is_featured ? "★ In evidenza" : "☆ Segna come consigliato"}
            </button>
          </div>

          <MarketPricesEditor form={form} onChange={onChange} />
        </div>
      )}

      {tab === "tech" && (
        <div className="space-y-5">
          <FormField label="Slug tecnico (ID interno)">
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="input-base font-mono" placeholder="operativita" />
          </FormField>

          <div>
            <p className="mb-3 text-sm font-bold">
              Moduli inclusi ({form.modules.length} / {TENANT_MODULES.length})
            </p>
            <div className="space-y-4">
              {TENANT_MODULE_CATEGORIES.map((cat) => (
                <div key={cat}>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-pork-ink/45">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {TENANT_MODULES.filter((m) => m.category === cat).map((m) => {
                      const active = form.modules.includes(m.key);
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => onToggleModule(m.key)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-bold transition",
                            active
                              ? "bg-pork-red text-white"
                              : "bg-white text-pork-ink/60 ring-1 ring-pork-ink/10 hover:ring-pork-red/30",
                          )}
                        >
                          {active && <Check size={10} className="mr-1 inline" />}
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onSave}
          disabled={saving || !form.marketing_name || !form.price_annual}
          className="inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-2.5 font-bold text-white disabled:opacity-40"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isNew ? "Crea pacchetto" : "Salva modifiche"}
        </button>
        <button onClick={onCancel} className="rounded-full border border-pork-ink/15 px-5 py-2.5 font-bold text-pork-ink/60">
          Annulla
        </button>
      </div>
    </div>
  );
}

// ─── Primitivi ────────────────────────────────────────────────────────────────

function MarketPricesEditor({
  form,
  onChange,
}: {
  form: PackageForm;
  onChange: (f: PackageForm) => void;
}) {
  function setMarket(
    code: MarketCode,
    field: keyof PackageForm["market_prices"][MarketCode],
    value: string,
  ) {
    onChange({
      ...form,
      market_prices: {
        ...form.market_prices,
        [code]: {
          ...form.market_prices[code],
          [field]: value,
        },
      },
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-black text-pork-ink">Listini per paese</p>
          <p className="mt-1 text-xs text-pork-ink/45">
            Se un campo resta vuoto, quel mercato usa il prezzo base del pacchetto.
          </p>
        </div>
      </div>
      <div className="grid gap-3">
        {MARKETS.map((market) => {
          const row = form.market_prices[market.code];
          return (
            <div
              key={market.code}
              className="grid gap-2 rounded-2xl border border-pork-ink/10 p-3 md:grid-cols-[1.2fr_0.7fr_1fr_1fr_1.2fr]"
            >
              <div className="flex items-center gap-2 text-sm font-black">
                <span>{market.flag}</span>
                <span>{market.name}</span>
              </div>
              <input
                value={row.currency}
                onChange={(event) => setMarket(market.code, "currency", event.target.value.toUpperCase())}
                className="input-base font-mono text-xs"
                placeholder={market.currency}
              />
              <input
                type="number"
                value={row.price_monthly}
                onChange={(event) => setMarket(market.code, "price_monthly", event.target.value)}
                className="input-base text-xs"
                placeholder="annuale/mese"
              />
              <input
                type="number"
                value={row.price_monthly_billing}
                onChange={(event) => setMarket(market.code, "price_monthly_billing", event.target.value)}
                className="input-base text-xs"
                placeholder="mensile/mese"
              />
              <input
                value={row.setup_from}
                onChange={(event) => setMarket(market.code, "setup_from", event.target.value)}
                className="input-base text-xs"
                placeholder={`setup ${market.currency}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-bold text-pork-ink/60">{label}</label>
      {hint && <p className="mb-1.5 text-[11px] text-pork-ink/40">{hint}</p>}
      {children}
    </div>
  );
}
