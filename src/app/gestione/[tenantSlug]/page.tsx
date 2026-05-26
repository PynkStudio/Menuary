import Link from "next/link";
import { headers } from "next/headers";
import {
  Settings,
  ClipboardList,
  UtensilsCrossed,
  CalendarDays,
  Users,
  Star,
  BarChart3,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
import { getModuleLabel, getVerticalMeta } from "@/lib/vertical";
import { getGestioneBaseHref, getGestioneModuleAccess } from "@/lib/gestione-routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoHost } from "@/lib/platform";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { TENANT_MODULES } from "@/lib/tenant-modules";
import { demoDashboardKpis } from "@/lib/demo-fixtures";

type Kpi = {
  label: string;
  value: string | null;
  hint?: string;
};

async function loadKpis(tenantSlug: string, isDemo: boolean, features: ReturnType<typeof getGestioneModuleAccess>, vertical: "food" | "services"): Promise<Kpi[]> {
  if (isDemo) {
    const k = demoDashboardKpis(vertical);
    return [
      { label: vertical === "services" ? "Appuntamenti oggi" : "Prenotazioni oggi", value: String(k.reservationsToday) },
      { label: "Recensioni 7gg", value: String(k.reviews7d), hint: "★ 4.7 di media" },
      { label: "Staff attivo", value: String(k.staffActive) },
      { label: "Moduli attivi", value: String(Object.values(features.modules).filter(Boolean).length) },
    ];
  }

  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain((await headers()).get("host") ?? ""));
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [reservations, reviews, staff] = await Promise.all([
    features.canManageReservations
      ? supabase
          .from("reservation_requests")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantSlug)
          .gte("reservation_date", dayStart)
      : Promise.resolve({ count: null } as { count: number | null }),
    features.hasGoogleBusiness
      ? supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantSlug)
          .gte("created_at", weekAgo)
      : Promise.resolve({ count: null } as { count: number | null }),
    supabase
      .from("employee")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantSlug)
      .eq("enabled", true),
  ]);

  const enabledCount = Object.values(features.modules).filter(Boolean).length;

  return [
    {
      label: "Prenotazioni oggi",
      value: features.canManageReservations ? String(reservations.count ?? 0) : null,
      hint: features.canManageReservations ? undefined : "Modulo non attivo",
    },
    {
      label: "Recensioni 7gg",
      value: features.hasGoogleBusiness ? String(reviews.count ?? 0) : null,
      hint: features.hasGoogleBusiness ? undefined : "Modulo non attivo",
    },
    {
      label: "Staff attivo",
      value: String(staff.count ?? 0),
    },
    {
      label: "Moduli attivi",
      value: String(enabledCount),
    },
  ];
}

export default async function GestioneDashboardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) return null;

  const host = (await headers()).get("host") ?? "";
  const isDemo = isDemoHost(host);
  const vertical = getVerticalMeta(tenant.vertical);
  const access = getGestioneModuleAccess(tenant.features);
  const base = getGestioneBaseHref(host, tenant) || `/gestione/${tenant.id}`;

  const menuLabel = getModuleLabel("onlineMenu", tenant.vertical);
  const reservationsLabel = getModuleLabel("reservations", tenant.vertical);

  const dashboardCopy =
    tenant.vertical === "services"
      ? `Da qui gestisci sito, ${menuLabel.toLowerCase()}, ${reservationsLabel.toLowerCase()}, clienti, dati attività e fatturazione della tua ${vertical.businessNoun}.`
      : "Da qui gestisci ordini, menu, prenotazioni, staff e fatturazione del tuo locale.";

  const kpis = await loadKpis(tenantSlug, isDemo, access);

  const quickActions: { href: string; label: string; hint: string; icon: React.ReactNode; show: boolean }[] = [
    {
      href: `${base}/attivita`,
      label: "Dati attività",
      hint: "Sito, contatti, orari",
      icon: <Settings size={16} strokeWidth={2} />,
      show: access.canManageActivity,
    },
    {
      href: `${base}/prenotazioni`,
      label: reservationsLabel,
      hint: "Calendario e richieste",
      icon: <CalendarDays size={16} strokeWidth={2} />,
      show: access.canManageReservations,
    },
    {
      href: `${base}/listino`,
      label: menuLabel,
      hint: "Voci, categorie, prezzi",
      icon: <UtensilsCrossed size={16} strokeWidth={2} />,
      show: access.canManageMenu,
    },
    {
      href: `${base}/ordini`,
      label: "Ordini",
      hint: "Sala e asporto",
      icon: <ClipboardList size={16} strokeWidth={2} />,
      show: access.hasOrders,
    },
    {
      href: `${base}/staff`,
      label: "Staff",
      hint: "Inviti e permessi",
      icon: <Users size={16} strokeWidth={2} />,
      show: access.canManageStaff,
    },
    {
      href: `${base}/google`,
      label: "Google business",
      hint: "Recensioni e profilo",
      icon: <Star size={16} strokeWidth={2} />,
      show: access.hasGoogleBusiness,
    },
    {
      href: `${base}/analytics`,
      label: "Analytics",
      hint: "Numeri del locale",
      icon: <BarChart3 size={16} strokeWidth={2} />,
      show: access.canViewAnalytics,
    },
    {
      href: `${base}/sedi`,
      label: "Sedi",
      hint: "Multi-location",
      icon: <MapPin size={16} strokeWidth={2} />,
      show: access.canManageLocations,
    },
  ].filter((a) => a.show);

  // Moduli effettivamente attivati per il tenant dal control panel di
  // admin.menuary.it (passa per resolveTenantFeatures dentro getGestioneModuleAccess,
  // così rispettiamo dependency e implies). Stato di default "ok": la diagnostica
  // reale (warn/error) verrà popolata in seguito.
  type ModuleStatus = "ok" | "warn" | "error";
  const enabledModules = TENANT_MODULES.filter((mod) => access.modules[mod.key]).map((mod) => ({
    key: mod.key,
    name: getModuleLabel(mod.key, tenant.vertical),
    status: "ok" as ModuleStatus,
    note: null as string | null,
  }));

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Pannello di controllo</span>
        <h1 className="ga-heading">Benvenuto su {tenant.name}</h1>
        <p className="ga-lead">{dashboardCopy}</p>
      </header>

      <section className="ga-section" aria-labelledby="ga-kpi-title">
        <div className="ga-section-head">
          <h2 id="ga-kpi-title" className="ga-section-title">Oggi a colpo d&apos;occhio</h2>
          {isDemo && <span className="ga-section-hint">Demo: i numeri sono nascosti</span>}
        </div>
        <div className="ga-kpi-grid">
          {kpis.map((k) => (
            <div key={k.label} className="ga-kpi">
              <span className="ga-kpi-label">{k.label}</span>
              <span className="ga-kpi-value" data-empty={k.value === null}>
                {k.value ?? "—"}
              </span>
              {k.hint && <span className="ga-kpi-hint">{k.hint}</span>}
            </div>
          ))}
        </div>
      </section>

      {quickActions.length > 0 && (
        <section className="ga-section" aria-labelledby="ga-quick-title">
          <div className="ga-section-head">
            <h2 id="ga-quick-title" className="ga-section-title">Scorciatoie</h2>
            <span className="ga-section-hint">{quickActions.length} aree disponibili</span>
          </div>
          <div className="ga-quick-grid">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href} className="ga-quick">
                <span className="ga-quick-icon">{a.icon}</span>
                <span className="ga-quick-meta">
                  <span>{a.label}</span>
                  <span className="ga-quick-hint">{a.hint}</span>
                </span>
                <ArrowRight size={14} strokeWidth={2} style={{ marginLeft: "auto", opacity: 0.4 }} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="ga-section" aria-labelledby="ga-modules-title">
        <div className="ga-section-head">
          <h2 id="ga-modules-title" className="ga-section-title">Diagnostica moduli</h2>
          <span className="ga-section-hint">{enabledModules.length} attivi</span>
        </div>
        {enabledModules.length === 0 ? (
          <div className="ga-empty">
            Nessun modulo attivato per questo tenant. Abilitali da admin.menuary.it.
          </div>
        ) : (
          <div className="ga-modules-grid">
            {enabledModules.map((m) => (
              <div key={m.key} className="ga-module">
                <span className="ga-module-name">{m.name}</span>
                <span className="ga-module-status" data-status={m.status}>
                  {m.status === "ok" ? "online" : m.status === "warn" ? "verifica" : "problema"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
