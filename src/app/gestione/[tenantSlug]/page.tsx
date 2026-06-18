import { headers } from "next/headers";
import { getTenantById } from "@/lib/data/tenant";
import { getModuleLabel, getVerticalMeta } from "@/lib/vertical";
import { getGestioneBaseHref, getGestioneModuleAccess } from "@/lib/gestione-routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoHost } from "@/lib/platform";
import { getTenantDemoControl } from "@/lib/demo-controls";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { getTenantModuleGroups } from "@/lib/tenant-modules";
import { DashboardQuickActions } from "@/components/gestione/dashboard-quick-actions";
import { getGestioneTranslations, interpolate, type GestioneMessages } from "@/i18n/gestione";
import { getActiveGestioneLocation } from "@/lib/gestione-location";

type Kpi = {
  label: string;
  value: string | null;
  hint?: string;
};

async function loadKpis(tenantSlug: string, locationId: string | null, isDemo: boolean, features: ReturnType<typeof getGestioneModuleAccess>, vertical: "food" | "services" | "creative", t: GestioneMessages["dashboard"]): Promise<Kpi[]> {
  if (isDemo) {
    const demo: Kpi[] = [];
    if (features.hasOrders) {
      demo.push(
        { label: "Valore ordini oggi", value: "642 €", hint: "18 ordini validi" },
        { label: "Ordini da gestire", value: "6", hint: "2 in attesa di conferma" },
      );
    }
    if (features.canManageReservations) {
      demo.push(
        {
          label: vertical === "services" ? t.kpi.appointmentsToday : vertical === "creative" ? "Richieste booking oggi" : t.kpi.reservationsToday,
          value: vertical === "services" ? "9" : "14",
          hint: vertical === "food" ? "38 coperti previsti" : undefined,
        },
        { label: "Richieste da confermare", value: "3" },
      );
    }
    if (features.canManageMenu) {
      demo.push({
        label: vertical === "services" ? "Servizi non disponibili" : vertical === "creative" ? "Opere pubblicate" : "Piatti non disponibili",
        value: vertical === "creative" ? "12" : "2",
        hint: vertical === "creative" ? "Catalogo pubblico" : "Aggiorna prima del servizio",
      });
    }
    if (features.hasGoogleBusiness) {
      demo.push({ label: t.kpi.reviews7d, value: "4", hint: t.kpi.reviewsAvg });
    }
    return demo.slice(0, 4);
  }

  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain((await headers()).get("host") ?? ""));
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const today = [
    dayStart.getFullYear(),
    String(dayStart.getMonth() + 1).padStart(2, "0"),
    String(dayStart.getDate()).padStart(2, "0"),
  ].join("-");
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [orders, reservations, menuItems, reviews] = await Promise.all([
    features.hasOrders
      ? supabase
          .from("orders")
          .select("total,status")
          .match(locationId ? { tenant_id: tenantSlug, location_id: locationId } : { tenant_id: tenantSlug })
          .gte("created_at", dayStart.toISOString())
          .lt("created_at", dayEnd.toISOString())
      : Promise.resolve({ data: [] }),
    features.canManageReservations
      ? supabase
          .from("reservation_requests")
          .select("status,covers")
          .match(locationId ? { tenant_id: tenantSlug, location_id: locationId } : { tenant_id: tenantSlug })
          .eq("reservation_date", today)
      : Promise.resolve({ data: [] }),
    features.canManageMenu
      ? supabase
          .from("menu_items")
          .select("available")
          .match(locationId ? { tenant_id: tenantSlug, location_id: locationId } : { tenant_id: tenantSlug })
      : Promise.resolve({ data: [] }),
    features.hasGoogleBusiness
      ? supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .match(locationId ? { tenant_id: tenantSlug, location_id: locationId } : { tenant_id: tenantSlug })
          .gte("created_at", weekAgo)
      : Promise.resolve({ count: null } as { count: number | null }),
  ]);

  const orderRows = orders.data ?? [];
  const reservationRows = reservations.data ?? [];
  const menuRows = menuItems.data ?? [];
  const out: Kpi[] = [];

  if (features.hasOrders) {
    const validOrders = orderRows.filter((order) => !["annullato", "expired"].includes(order.status));
    const revenue = validOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const open = validOrders.filter((order) =>
      ["pending_confirmation", "nuovo", "in_preparazione", "pronto"].includes(order.status),
    );
    const pending = open.filter((order) => order.status === "pending_confirmation").length;
    out.push(
      {
        label: "Valore ordini oggi",
        value: new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(revenue),
        hint: `${validOrders.length} ordini validi`,
      },
      {
        label: "Ordini da gestire",
        value: String(open.length),
        hint: pending > 0 ? `${pending} in attesa di conferma` : "Nessuno in attesa di conferma",
      },
    );
  }

  if (features.canManageReservations) {
    const pending = reservationRows.filter((reservation) =>
      ["pending_manual", "auto_proposed"].includes(reservation.status),
    ).length;
    const covers = reservationRows.reduce((sum, reservation) => sum + Number(reservation.covers ?? 0), 0);
    out.push(
      {
        label: vertical === "services" ? t.kpi.appointmentsToday : vertical === "creative" ? "Richieste booking oggi" : t.kpi.reservationsToday,
        value: String(reservationRows.length),
        hint: vertical === "food" ? `${covers} coperti previsti` : undefined,
      },
      { label: "Richieste da confermare", value: String(pending) },
    );
  }

  if (features.canManageMenu) {
    const unavailable = menuRows.filter((item) => !item.available).length;
    out.push({
      label: vertical === "services" ? "Servizi non disponibili" : vertical === "creative" ? "Opere pubblicate" : "Piatti non disponibili",
      value: String(vertical === "creative" ? menuRows.length : unavailable),
      hint: vertical === "creative" ? "Catalogo pubblico" : unavailable > 0 ? "Richiedono un controllo" : "Tutta l'offerta è disponibile",
    });
  }

  if (features.hasGoogleBusiness) {
    out.push({ label: t.kpi.reviews7d, value: String(reviews.count ?? 0) });
  }

  return out.slice(0, 4);
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
  const publicDomain = tenant.domains.find(
    (domain) => !domain.startsWith("www.") && !domain.includes("localhost") && domain !== "127.0.0.1",
  );
  const ordersHref = isDemoHostname
    ? `/${tenant.id}/ordini`
    : publicDomain
      ? `https://ordini.${publicDomain}`
      : `/operativo/${tenant.id}/ordini`;

  const menuLabel = getModuleLabel("onlineMenu", tenant.vertical);
  const reservationsLabel = getModuleLabel("reservations", tenant.vertical);
  const worksLabel =
    tenant.vertical === "creative" ? getModuleLabel("worksCatalog", tenant.vertical) : menuLabel;
  const bookingLabel =
    tenant.vertical === "creative" ? getModuleLabel("creativeBooking", tenant.vertical) : reservationsLabel;
  const dashboardCopy =
    tenant.vertical === "creative"
      ? "Da qui gestisci sito, catalogo opere, community e materiali editoriali."
      : tenant.vertical === "services"
      ? interpolate(t.copyServices, {
          menuLabel: worksLabel.toLowerCase(),
          reservationsLabel: bookingLabel.toLowerCase(),
          businessNoun: vertical.businessNoun,
        })
      : t.copyFood;

  const activeLocation = isDemo || tenant.vertical === "creative"
    ? null
    : await getActiveGestioneLocation(tenantSlug);
  const kpis = await loadKpis(tenantSlug, activeLocation?.id ?? null, isDemo, access, tenant.vertical, t);

  const orderModules = (["takeaway", "tableOrders", "orderKiosk"] as const)
    .filter((key) => access.modules[key]);
  const enabledGroups = getTenantModuleGroups(tenant.vertical)
    .map((group) => ({
      ...group,
      activeDefinitions: group.definitions.filter((module) => access.modules[module.key]),
    }))
    .filter((group) => group.activeDefinitions.length > 0);

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

      {(access.hasOrders || access.canManageMenu || access.canManageReservations || access.canManageActivity) && (
        <section className="ga-section" aria-labelledby="ga-quick-title">
          <div className="ga-section-head">
            <h2 id="ga-quick-title" className="ga-section-title">{t.shortcuts}</h2>
            <span className="ga-section-hint">Le operazioni più frequenti, senza passaggi inutili</span>
          </div>
          <DashboardQuickActions
            tenantId={tenant.id}
            base={base}
            ordersHref={ordersHref}
            vertical={tenant.vertical}
            isDemo={isDemo}
            hasOrders={access.hasOrders}
            canManageMenu={access.canManageMenu}
            canManageReservations={access.canManageReservations}
            canManageActivity={access.canManageActivity}
            orderModules={[...orderModules]}
          />
        </section>
      )}

      <section className="ga-section" aria-labelledby="ga-modules-title">
        <div className="ga-section-head">
          <h2 id="ga-modules-title" className="ga-section-title">{t.modulesDiagnostic}</h2>
          <span className="ga-section-hint">{enabledGroups.length} aree operative</span>
        </div>
        {enabledGroups.length === 0 ? (
          <div className="ga-empty">
            {t.noModules}
          </div>
        ) : (
          <div className="ga-modules-grid">
            {enabledGroups.map((group) => (
              <div key={group.key} className="ga-module">
                <span>
                  <span className="ga-module-name">{group.label}</span>
                  <span className="ga-kpi-hint">
                    {group.activeDefinitions
                      .map((module) => getModuleLabel(module.key, tenant.vertical))
                      .join(" · ")}
                  </span>
                </span>
                <span className="ga-module-count">{group.activeDefinitions.length} attive</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
