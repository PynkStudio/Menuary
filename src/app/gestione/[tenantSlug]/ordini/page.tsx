import Link from "next/link";
import { notFound } from "next/navigation";
import { ChefHat, Bell, Check, X, MapPin, Clock, StickyNote, ShoppingBag, UtensilsCrossed, AlarmClock, Bike, Settings } from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/database.types";
import { startOrder, markReady, markDelivered, cancelOrder, confirmPendingOrder, rejectPendingOrder } from "./actions";
import { OrdersLiveRefresh } from "@/components/gestione/orders-live-refresh";
import { demoOrders, type DemoOrder } from "@/lib/demo-fixtures";
import { getGestioneTranslations, interpolate, type GestioneMessages } from "@/i18n/gestione";

type Filter = "live" | "pending" | "nuovi" | "preparazione" | "pronti" | "asporto" | "tavolo" | "storico" | "tutti";
const FILTERS: { id: Filter; labelKey: keyof GestioneMessages["orders"]["filters"] }[] = [
  { id: "live", labelKey: "live" },
  { id: "pending", labelKey: "pending" },
  { id: "nuovi", labelKey: "new" },
  { id: "preparazione", labelKey: "preparing" },
  { id: "pronti", labelKey: "ready" },
  { id: "asporto", labelKey: "takeaway" },
  { id: "tavolo", labelKey: "table" },
  { id: "storico", labelKey: "history" },
  { id: "tutti", labelKey: "all" },
];

type OrderRow = {
  id: string;
  code: string;
  status: Database["public"]["Enums"]["order_status"];
  type: Database["public"]["Enums"]["order_type"];
  total: number;
  customer_name: string | null;
  table_label: string | null;
  pickup_time: string | null;
  notes: string | null;
  created_at: string;
  dine_option: string | null;
  confirmation_expires_at: string | null;
  auto_accepted: boolean | null;
};

type OrderLine = { order_id: string; name: string; qty: number; variant_label: string | null };

async function fetchOrders(tenantSlug: string, filter: Filter): Promise<{ orders: OrderRow[]; lines: Map<string, OrderLine[]> }> {
  const svc = createSupabaseServiceClient();
  if (!svc) return { orders: [], lines: new Map() };

  let q = svc
    .from("orders")
    .select("id, code, status, type, total, customer_name, table_label, pickup_time, notes, created_at, dine_option, confirmation_expires_at, auto_accepted")
    .eq("tenant_id", tenantSlug);

  const liveStatuses: Database["public"]["Enums"]["order_status"][] = ["nuovo", "in_preparazione", "pronto"];
  switch (filter) {
    case "live":
      q = q.in("status", liveStatuses);
      break;
    case "pending":
      q = q.eq("status", "pending_confirmation");
      break;
    case "nuovi":
      q = q.eq("status", "nuovo");
      break;
    case "preparazione":
      q = q.eq("status", "in_preparazione");
      break;
    case "pronti":
      q = q.eq("status", "pronto");
      break;
    case "asporto":
      q = q.eq("type", "asporto").in("status", liveStatuses);
      break;
    case "tavolo":
      q = q.eq("type", "tavolo").in("status", liveStatuses);
      break;
    case "storico":
      q = q.in("status", ["consegnato", "annullato"] satisfies Database["public"]["Enums"]["order_status"][]);
      break;
    case "tutti":
    default:
      break;
  }

  const order = filter === "storico" ? { ascending: false } : { ascending: true };
  const { data: orders, error } = await q.order("created_at", order).limit(200);
  if (error || !orders) return { orders: [], lines: new Map() };

  const ids = orders.map((o) => o.id);
  const lines = new Map<string, OrderLine[]>();
  if (ids.length > 0) {
    const { data: lineRows } = await svc
      .from("order_lines")
      .select("order_id, name, qty, variant_label")
      .in("order_id", ids)
      .order("position", { ascending: true });
    for (const l of lineRows ?? []) {
      const arr = lines.get(l.order_id) ?? [];
      arr.push(l);
      lines.set(l.order_id, arr);
    }
  }
  return { orders: orders as OrderRow[], lines };
}

function filterDemoOrders(
  source: { orders: DemoOrder[]; lines: Map<string, { order_id: string; name: string; qty: number; variant_label: string | null }[]> },
  filter: Filter,
): { orders: OrderRow[]; lines: Map<string, OrderLine[]> } {
  const liveSet = new Set<OrderRow["status"]>(["nuovo", "in_preparazione", "pronto"]);
  let kept = source.orders;
  switch (filter) {
    case "live": kept = kept.filter((o) => liveSet.has(o.status)); break;
    case "pending": kept = kept.filter((o) => o.status === "pending_confirmation"); break;
    case "nuovi": kept = kept.filter((o) => o.status === "nuovo"); break;
    case "preparazione": kept = kept.filter((o) => o.status === "in_preparazione"); break;
    case "pronti": kept = kept.filter((o) => o.status === "pronto"); break;
    case "asporto": kept = kept.filter((o) => o.type === "asporto" && liveSet.has(o.status)); break;
    case "tavolo": kept = kept.filter((o) => o.type === "tavolo" && liveSet.has(o.status)); break;
    case "storico": kept = kept.filter((o) => o.status === "consegnato" || o.status === "annullato"); break;
  }
  return { orders: kept as OrderRow[], lines: source.lines as Map<string, OrderLine[]> };
}

function statusBadge(status: OrderRow["status"], t: GestioneMessages["orders"]): { label: string; tone: "ok" | "warn" | "error" | "muted" | "pending" } {
  switch (status) {
    case "pending_confirmation": return { label: t.status.pending, tone: "warn" };
    case "nuovo": return { label: t.status.new, tone: "warn" };
    case "in_preparazione": return { label: t.status.preparing, tone: "pending" };
    case "pronto": return { label: t.status.ready, tone: "ok" };
    case "consegnato": return { label: t.status.delivered, tone: "muted" };
    case "annullato": return { label: t.status.cancelled, tone: "error" };
    case "expired": return { label: t.status.expired, tone: "error" };
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function formatTotal(n: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export default async function OrdiniPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ f?: string }>;
}) {
  const { tenantSlug } = await params;
  const { f } = await searchParams;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) return null;
  const gt = await getGestioneTranslations();
  const t = gt.orders;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();

  const filter: Filter = FILTERS.some((x) => x.id === f) ? (f as Filter) : "live";
  const { orders, lines } = auth.isDemo
    ? filterDemoOrders(demoOrders(tenant.vertical), filter)
    : await fetchOrders(tenantSlug, filter);

  return (
    <div className="ga-dashboard">
      <OrdersLiveRefresh tenantId={tenantSlug} />
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="ga-eyebrow">{t.eyebrow}</span>
          <h1 className="ga-heading">{t.title}</h1>
          <p className="ga-lead">{t.lead}</p>
        </div>
        <Link
          href={`/gestione/${tenantSlug}/ordini/impostazioni`}
          className="ga-btn ga-btn-ghost"
          style={{ alignSelf: "center" }}
        >
          <Settings size={14} strokeWidth={2.4} /> {t.settings}
        </Link>
      </header>

      <nav className="ga-pills" aria-label={t.filterLabel}>
        {FILTERS.map((opt) => (
          <Link key={opt.id} href={`?f=${opt.id}`} className="ga-pill" data-active={opt.id === filter}>
            {t.filters[opt.labelKey]}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className="ga-empty">
          {t.empty}
        </div>
      ) : (
        <div className="ga-reservation-list">
          {orders.map((o) => {
            const badge = statusBadge(o.status, t);
            const items = lines.get(o.id) ?? [];
            const isPending = o.status === "pending_confirmation";
            const isNuovo = o.status === "nuovo";
            const isPreparazione = o.status === "in_preparazione";
            const isPronto = o.status === "pronto";
            const pendingSecondsLeft =
              isPending && o.confirmation_expires_at
                ? Math.max(0, Math.floor((new Date(o.confirmation_expires_at).getTime() - Date.now()) / 1000))
                : null;

            return (
              <article key={o.id} className="ga-reservation">
                <div className="ga-reservation-when">
                  <span className="ga-reservation-date">{o.type === "asporto" ? t.type.takeaway : t.type.table}</span>
                  <span className="ga-reservation-time">{o.code}</span>
                </div>

                <div className="ga-reservation-body">
                  <div className="ga-reservation-head">
                    <span className="ga-reservation-name">{o.customer_name ?? t.customer}</span>
                    <span className="ga-module-status" data-status={badge.tone}>{badge.label}</span>
                    {o.auto_accepted && (
                      <span className="ga-reservation-tag" style={{ background: "var(--ga-ink-faint, #eef)", color: "var(--ga-ink)" }}>
                        Auto
                      </span>
                    )}
                    <span className="ga-reservation-tag" style={{ background: "transparent", color: "var(--ga-ink-faint)" }}>
                      {formatTotal(o.total)}
                    </span>
                  </div>
                  <div className="ga-reservation-meta">
                    <span><Clock size={12} strokeWidth={2.2} /> {formatTime(o.created_at)}</span>
                    {o.dine_option === "dine_in" && (
                      <span><UtensilsCrossed size={12} strokeWidth={2.2} /> {t.type.dineIn}</span>
                    )}
                    {o.dine_option === "takeaway" && (
                      <span><ShoppingBag size={12} strokeWidth={2.2} /> {t.type.takeaway}</span>
                    )}
                    {o.dine_option === "delivery" && (
                      <span><Bike size={12} strokeWidth={2.2} /> {t.type.delivery}</span>
                    )}
                    {o.table_label && (
                      <span><MapPin size={12} strokeWidth={2.2} /> {o.table_label}</span>
                    )}
                    {o.pickup_time && (
                      <span><Bell size={12} strokeWidth={2.2} /> {interpolate(t.pickup, { time: o.pickup_time })}</span>
                    )}
                    {isPending && pendingSecondsLeft !== null && (
                      <span style={{ color: "var(--ga-warn, #B8332E)", fontWeight: 600 }}>
                        <AlarmClock size={12} strokeWidth={2.2} /> {interpolate(t.timeout, { seconds: pendingSecondsLeft })}
                      </span>
                    )}
                  </div>
                  {items.length > 0 && (
                    <ul className="ga-order-lines">
                      {items.map((l, i) => (
                        <li key={`${o.id}-${i}`}>
                          <span className="ga-order-qty">{l.qty}×</span>
                          <span>{l.name}{l.variant_label ? ` · ${l.variant_label}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {o.notes && (
                    <p className="ga-reservation-notes">
                      <StickyNote size={12} strokeWidth={2.2} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
                      {o.notes}
                    </p>
                  )}
                </div>

                <div className="ga-reservation-actions">
                  {isPending && (
                    <>
                      <form action={confirmPendingOrder}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                          <Check size={14} strokeWidth={2.4} /> {t.actions.confirm}
                        </button>
                      </form>
                      <form action={rejectPendingOrder}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                          <X size={14} strokeWidth={2.4} /> {t.actions.reject}
                        </button>
                      </form>
                    </>
                  )}
                  {isNuovo && (
                    <>
                      <form action={startOrder}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                          <ChefHat size={14} strokeWidth={2.4} /> {t.actions.start}
                        </button>
                      </form>
                      <form action={cancelOrder}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                          <X size={14} strokeWidth={2.4} /> {t.actions.cancel}
                        </button>
                      </form>
                    </>
                  )}
                  {isPreparazione && (
                    <form action={markReady}>
                      <input type="hidden" name="tenantSlug" value={tenantSlug} />
                      <input type="hidden" name="id" value={o.id} />
                      <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                        <Bell size={14} strokeWidth={2.4} /> {t.actions.markReady}
                      </button>
                    </form>
                  )}
                  {isPronto && (
                    <>
                      <form action={markDelivered}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                          <Check size={14} strokeWidth={2.4} /> {t.actions.delivered}
                        </button>
                      </form>
                      <form action={cancelOrder}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                          <X size={14} strokeWidth={2.4} /> {t.actions.cancel}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
