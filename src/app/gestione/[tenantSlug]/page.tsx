import { headers } from "next/headers";
import { getGestioneBaseHref, getGestioneModuleAccess } from "@/lib/gestione-routing";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { DashboardQuickActions } from "@/components/gestione/dashboard-quick-actions";
import { getGestioneTranslations, interpolate, type GestioneMessages } from "@/i18n/gestione";
import { getActiveGestioneLocation } from "@/lib/gestione-location";
import { requireGestioneSection } from "@/lib/gestione-page";
import {
  GESTIONE_SECTIONS,
  getGestioneSectionLabel,
  isGestioneSectionAvailable,
  viewerMeets,
  type GestioneViewer,
} from "@/lib/gestione-sections";
import { getEffectiveCapabilities } from "@/lib/store-roles";
import type { TenantVertical } from "@/lib/tenant";

type Kpi = {
  label: string;
  value: string;
  hint?: string;
};

const BUSINESS_TIMEZONE = "Europe/Rome";

/** Inizio e fine del giorno corrente nel fuso del locale, come istanti UTC. */
function businessDayRange(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const map: Record<string, number> = {};
  for (const part of parts) if (part.type !== "literal") map[part.type] = Number(part.value);
  const offsetMs =
    Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second) -
    Math.floor(now.getTime() / 1000) * 1000;
  const start = new Date(Date.UTC(map.year, map.month - 1, map.day) - offsetMs);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const isoDate = `${map.year}-${String(map.month).padStart(2, "0")}-${String(map.day).padStart(2, "0")}`;
  return { start, end, isoDate };
}

type Access = ReturnType<typeof getGestioneModuleAccess>;

async function loadKpis(
  tenantSlug: string,
  locationId: string | null,
  isDemo: boolean,
  access: Access,
  viewer: GestioneViewer,
  vertical: TenantVertical,
  t: GestioneMessages["dashboard"],
): Promise<Kpi[]> {
  const showOrders = access.hasOrders;
  const showRevenue = showOrders && viewerMeets(viewer, "can_view_financials");
  const showReservations = access.canManageReservations && viewerMeets(viewer, "can_manage_reservations");
  const showMenu = access.canManageMenu && viewerMeets(viewer, "can_edit_menu");
  const showReviews = access.hasGoogleBusiness && viewerMeets(viewer, "admin");
  const reservationsLabel =
    vertical === "services" ? t.kpi.appointmentsToday : vertical === "creative" ? "Richieste booking oggi" : t.kpi.reservationsToday;
  const menuLabel =
    vertical === "services" ? "Servizi non disponibili" : vertical === "creative" ? "Opere pubblicate" : "Piatti non disponibili";

  if (isDemo) {
    const demo: Kpi[] = [];
    if (showRevenue) demo.push({ label: "Valore ordini oggi", value: "642 €", hint: "18 ordini validi" });
    if (showOrders) demo.push({ label: "Ordini da gestire", value: "6", hint: "2 in attesa di conferma" });
    if (showReservations) {
      demo.push(
        { label: reservationsLabel, value: vertical === "services" ? "9" : "14", hint: vertical === "food" ? "38 coperti previsti" : undefined },
        { label: "Richieste da confermare", value: "3" },
      );
    }
    if (showMenu) demo.push({ label: menuLabel, value: vertical === "creative" ? "12" : "2" });
    if (showReviews) demo.push({ label: t.kpi.reviews7d, value: "4" });
    return demo;
  }

  const db = createSupabaseServiceClient();
  if (!db) return [];
  const { start, end, isoDate } = businessDayRange();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const scope = locationId ? { tenant_id: tenantSlug, location_id: locationId } : { tenant_id: tenantSlug };

  const [orders, reservations, menuItems, reviews] = await Promise.all([
    showOrders
      ? db.from("orders").select("total,status").match(scope).gte("created_at", start.toISOString()).lt("created_at", end.toISOString())
      : Promise.resolve({ data: [] }),
    showReservations
      ? db.from("reservation_requests").select("status,covers").match(scope).eq("reservation_date", isoDate)
      : Promise.resolve({ data: [] }),
    // Un tenant creative non ha un menu: le sue voci sono le opere.
    showMenu
      ? vertical === "creative"
        ? db.from("tenant_creative_works").select("enabled").eq("tenant_id", tenantSlug)
        : db.from("menu_items").select("available").match(scope)
      : Promise.resolve({ data: [] }),
    showReviews
      ? db.from("reviews").select("id", { count: "exact", head: true }).match(scope).gte("created_at", weekAgo)
      : Promise.resolve({ count: null } as { count: number | null }),
  ]);

  const out: Kpi[] = [];
  const orderRows = (orders.data ?? []) as Array<{ total: number | null; status: string }>;
  const validOrders = orderRows.filter((order) => !["annullato", "expired"].includes(order.status));

  if (showRevenue) {
    const revenue = validOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    out.push({
      label: "Valore ordini oggi",
      value: new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(revenue),
      hint: `${validOrders.length} ordini validi`,
    });
  }
  if (showOrders) {
    const open = validOrders.filter((order) =>
      ["pending_confirmation", "nuovo", "in_preparazione", "pronto"].includes(order.status),
    );
    const pending = open.filter((order) => order.status === "pending_confirmation").length;
    out.push({
      label: "Ordini da gestire",
      value: String(open.length),
      hint: pending > 0 ? `${pending} in attesa di conferma` : "Nessuno in attesa di conferma",
    });
  }
  if (showReservations) {
    const rows = (reservations.data ?? []) as Array<{ status: string; covers: number | null }>;
    const pending = rows.filter((row) => ["pending_manual", "auto_proposed"].includes(row.status)).length;
    const covers = rows.reduce((sum, row) => sum + Number(row.covers ?? 0), 0);
    out.push(
      { label: reservationsLabel, value: String(rows.length), hint: vertical === "food" ? `${covers} coperti previsti` : undefined },
      { label: "Richieste da confermare", value: String(pending) },
    );
  }
  if (showMenu) {
    if (vertical === "creative") {
      const works = (menuItems.data ?? []) as Array<{ enabled?: boolean | null }>;
      const published = works.filter((work) => work.enabled !== false).length;
      out.push({
        label: menuLabel,
        value: String(published),
        hint: works.length === published ? "Tutto il catalogo è online" : `${works.length - published} non pubblicate`,
      });
    } else {
      const items = (menuItems.data ?? []) as Array<{ available?: boolean | null }>;
      const unavailable = items.filter((item) => !item.available).length;
      out.push({
        label: menuLabel,
        value: String(unavailable),
        hint: unavailable > 0 ? "Richiedono un controllo" : "Tutta l'offerta è disponibile",
      });
    }
  }
  if (showReviews) {
    out.push({ label: t.kpi.reviews7d, value: String((reviews as { count: number | null }).count ?? 0) });
  }
  return out;
}

function joinLabels(labels: string[], more: number): string {
  return more > 0 ? `${labels.join(", ")} …` : labels.join(", ");
}

export default async function GestioneDashboardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const { tenant, access, auth } = await requireGestioneSection(tenantSlug, "dashboard");
  const gt = await getGestioneTranslations();
  const t = gt.dashboard;

  const host = (await headers()).get("host") ?? "";
  const isDemo = auth.isDemo;
  const viewer: GestioneViewer = auth.isDemo
    ? { isAdmin: true, isDevice: false, capabilities: getEffectiveCapabilities(null) }
    : auth;
  const base = getGestioneBaseHref(host, tenant) || "";

  // Il testo elenca solo le aree che questa persona vede davvero nel menu.
  const visibleAreas = GESTIONE_SECTIONS.filter(
    (section) => section.group && section.key !== "dashboard" && isGestioneSectionAvailable(section, tenant, viewer),
  ).map((section) => getGestioneSectionLabel(section.key, tenant, gt.navigation));
  const lead = visibleAreas.length > 0 ? interpolate(gt.navigation.dashboardLead, { areas: joinLabels(visibleAreas.slice(0, 6), visibleAreas.length - 6) }) : "";

  const activeLocation = isDemo || tenant.vertical === "creative" ? null : await getActiveGestioneLocation(tenantSlug);
  const kpis = await loadKpis(tenantSlug, activeLocation?.id ?? null, isDemo, access, viewer, tenant.vertical, t);
  const quiet = !isDemo && kpis.length > 0 && kpis.every((kpi) => kpi.value === "0" || /^0\s?€$/.test(kpi.value));

  const orderModules = (["takeaway", "tableOrders", "orderKiosk"] as const).filter((key) => access.modules[key]);
  const quickOrders = access.hasOrders;
  const quickMenu = access.canManageMenu && viewerMeets(viewer, "can_edit_menu");
  const quickReservations = access.canManageReservations && viewerMeets(viewer, "can_manage_reservations");
  const quickActivity = access.canManageActivity && tenant.vertical !== "creative" && viewerMeets(viewer, "admin");

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">{t.eyebrow}</span>
        <h1 className="ga-heading">{interpolate(t.welcome, { tenantName: tenant.name })}</h1>
        {lead && <p className="ga-lead">{lead}</p>}
      </header>

      {kpis.length > 0 && (
        <section className="ga-section" aria-labelledby="ga-kpi-title">
          <div className="ga-section-head">
            <h2 id="ga-kpi-title" className="ga-section-title">{t.todayTitle}</h2>
            {isDemo && <span className="ga-section-hint">{t.demoHint}</span>}
          </div>
          <div className="ga-kpi-grid">
            {kpis.map((k) => (
              <div key={k.label} className="ga-kpi">
                <span className="ga-kpi-label">{k.label}</span>
                <span className="ga-kpi-value">{k.value}</span>
                {k.hint && <span className="ga-kpi-hint">{k.hint}</span>}
              </div>
            ))}
          </div>
          {quiet && <p className="ga-section-hint">{gt.navigation.dashboardQuiet}</p>}
        </section>
      )}

      {(quickOrders || quickMenu || quickReservations || quickActivity) && (
        <section className="ga-section" aria-labelledby="ga-quick-title">
          <div className="ga-section-head">
            <h2 id="ga-quick-title" className="ga-section-title">{t.shortcuts}</h2>
          </div>
          <DashboardQuickActions
            tenantId={tenant.id}
            base={base}
            ordersHref={`${base}/ordini`}
            vertical={tenant.vertical}
            isDemo={isDemo}
            hasOrders={quickOrders}
            canSuspendOrders={viewerMeets(viewer, "admin")}
            canManageMenu={quickMenu}
            canManageReservations={quickReservations}
            canManageActivity={quickActivity}
            orderModules={[...orderModules]}
          />
        </section>
      )}
    </div>
  );
}
