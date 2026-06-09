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
import { getTenantById } from "@/lib/data/tenant";
import { getModuleLabel, getVerticalMeta } from "@/lib/vertical";
import { getGestioneBaseHref, getGestioneModuleAccess } from "@/lib/gestione-routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoHost } from "@/lib/platform";
import { getTenantDemoControl } from "@/lib/demo-controls";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { TENANT_MODULES } from "@/lib/tenant-modules";
import { demoDashboardKpis } from "@/lib/demo-fixtures";
import { getGestioneTranslations, interpolate, type GestioneMessages } from "@/i18n/gestione";

type Kpi = {
  label: string;
  value: string | null;
  hint?: string;
};

async function loadKpis(tenantSlug: string, isDemo: boolean, features: ReturnType<typeof getGestioneModuleAccess>, vertical: "food" | "services" | "creative", t: GestioneMessages["dashboard"]): Promise<Kpi[]> {
  const operationalVertical = vertical === "food" ? "food" : "services";
  if (isDemo) {
    const k = demoDashboardKpis(operationalVertical);
    const out: Kpi[] = [
      { label: operationalVertical === "services" ? t.kpi.appointmentsToday : t.kpi.reservationsToday, value: String(k.reservationsToday) },
      { label: t.kpi.reviews7d, value: String(k.reviews7d), hint: t.kpi.reviewsAvg },
    ];
    if (features.canManageStaff) {
      out.push({ label: t.kpi.staffActive, value: String(k.staffActive) });
    }
    return out;
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
      label: t.kpi.reservationsToday,
      value: features.canManageReservations ? String(reservations.count ?? 0) : null,
      hint: features.canManageReservations ? undefined : t.kpi.inactiveModule,
    },
    {
      label: t.kpi.reviews7d,
      value: features.hasGoogleBusiness ? String(reviews.count ?? 0) : null,
      hint: features.hasGoogleBusiness ? undefined : t.kpi.inactiveModule,
    },
    {
      label: t.kpi.staffActive,
      value: String(staff.count ?? 0),
    },
    {
      label: t.kpi.activeModules,
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
  const tenant = await getTenantById(tenantSlug);
  if (!tenant) return null;
  const gt = await getGestioneTranslations();
  const t = gt.dashboard;

  const host = (await headers()).get("host") ?? "";
  const isDemoHostname = isDemoHost(host);
  const demoControl = isDemoHostname ? await getTenantDemoControl(tenantSlug).catch(() => null) : null;
  const isDemo = isDemoHostname && !demoControl?.backendLive;
  const vertical = getVerticalMeta(tenant.vertical);
  const access = getGestioneModuleAccess(tenant.features);
  const base = getGestioneBaseHref(host, tenant) || `/gestione/${tenant.id}`;

  const menuLabel = getModuleLabel("onlineMenu", tenant.vertical);
  const reservationsLabel = getModuleLabel("reservations", tenant.vertical);
  const worksLabel =
    tenant.vertical === "creative" ? getModuleLabel("worksCatalog", tenant.vertical) : menuLabel;
  const bookingLabel =
    tenant.vertical === "creative" ? getModuleLabel("creativeBooking", tenant.vertical) : reservationsLabel;
  const audienceLabel =
    tenant.vertical === "creative" ? getModuleLabel("fanbaseCommunity", tenant.vertical) : t.actions.analytics.label;

  const dashboardCopy =
    tenant.vertical === "services" || tenant.vertical === "creative"
      ? interpolate(t.copyServices, {
          menuLabel: worksLabel.toLowerCase(),
          reservationsLabel: bookingLabel.toLowerCase(),
          businessNoun: vertical.businessNoun,
        })
      : t.copyFood;

  const kpis = await loadKpis(tenantSlug, isDemo, access, tenant.vertical, t);

  const quickActions: { href: string; label: string; hint: string; icon: React.ReactNode; show: boolean }[] = [
    {
      href: `${base}/impostazioni`,
      label: t.actions.activity.label,
      hint: t.actions.activity.hint,
      icon: <Settings size={16} strokeWidth={2} />,
      show: access.canManageActivity,
    },
    {
      href: `${base}/prenotazioni`,
      label: bookingLabel,
      hint: t.actions.reservations.hint,
      icon: <CalendarDays size={16} strokeWidth={2} />,
      show: access.canManageReservations,
    },
    {
      href: `${base}/listino`,
      label: worksLabel,
      hint: t.actions.menu.hint,
      icon: <UtensilsCrossed size={16} strokeWidth={2} />,
      show: access.canManageMenu,
    },
    {
      href: `${base}/ordini`,
      label: t.actions.orders.label,
      hint: t.actions.orders.hint,
      icon: <ClipboardList size={16} strokeWidth={2} />,
      show: access.hasOrders,
    },
    {
      href: `${base}/staff`,
      label: t.actions.staff.label,
      hint: t.actions.staff.hint,
      icon: <Users size={16} strokeWidth={2} />,
      show: access.canManageStaff,
    },
    {
      href: `${base}/google`,
      label: t.actions.google.label,
      hint: t.actions.google.hint,
      icon: <Star size={16} strokeWidth={2} />,
      show: access.hasGoogleBusiness,
    },
    {
      href: `${base}/analytics`,
      label: audienceLabel,
      hint: t.actions.analytics.hint,
      icon: <BarChart3 size={16} strokeWidth={2} />,
      show: access.canViewAnalytics,
    },
    {
      href: `${base}/sedi`,
      label: t.actions.locations.label,
      hint: t.actions.locations.hint,
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
        <span className="ga-eyebrow">{t.eyebrow}</span>
        <h1 className="ga-heading">{interpolate(t.welcome, { tenantName: tenant.name })}</h1>
        <p className="ga-lead">{dashboardCopy}</p>
      </header>

      <section className="ga-section" aria-labelledby="ga-kpi-title">
        <div className="ga-section-head">
          <h2 id="ga-kpi-title" className="ga-section-title">{t.todayTitle}</h2>
          {isDemo && <span className="ga-section-hint">{t.demoHint}</span>}
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
            <h2 id="ga-quick-title" className="ga-section-title">{t.shortcuts}</h2>
            <span className="ga-section-hint">{interpolate(t.availableAreas, { count: quickActions.length })}</span>
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
          <h2 id="ga-modules-title" className="ga-section-title">{t.modulesDiagnostic}</h2>
          <span className="ga-section-hint">{interpolate(t.activeModules, { count: enabledModules.length })}</span>
        </div>
        {enabledModules.length === 0 ? (
          <div className="ga-empty">
            {t.noModules}
          </div>
        ) : (
          <div className="ga-modules-grid">
            {enabledModules.map((m) => (
              <div key={m.key} className="ga-module">
                <span className="ga-module-name">{m.name}</span>
                <span className="ga-module-status" data-status={m.status}>
                  {m.status === "ok" ? t.moduleStatus.online : m.status === "warn" ? t.moduleStatus.check : t.moduleStatus.issue}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
