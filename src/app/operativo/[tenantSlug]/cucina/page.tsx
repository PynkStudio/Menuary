import { notFound } from "next/navigation";
import { AlarmClock, Check, ChefHat, Clock, MapPin, StickyNote, UtensilsCrossed } from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getActiveGestioneLocation } from "@/lib/gestione-location";
import { OrdersLiveRefresh } from "@/components/gestione/orders-live-refresh";
import { OperationalAlertControls, OperationalAlertsClient } from "@/components/gestione/operational-alerts-client";
import { demoOrders } from "@/lib/demo-fixtures";
import type { Database } from "@/lib/database.types";
import { confirmPendingOrder, markDelivered, markReady, rejectPendingOrder, startOrder, toggleOrderLinePrepared } from "./actions";

type OrderStatus = Database["public"]["Enums"]["order_status"];

type KitchenOrder = {
  id: string;
  code: string;
  status: OrderStatus;
  type: Database["public"]["Enums"]["order_type"];
  table_label: string | null;
  customer_name: string | null;
  pickup_time: string | null;
  desired_time: string | null;
  dine_option: string | null;
  fulfillment_type: string | null;
  notes: string | null;
  created_at: string;
};

type KitchenLine = {
  id: string;
  order_id: string;
  name: string;
  qty: number;
  variant_label: string | null;
  note: string | null;
  prepared: boolean;
};

const ACTIVE_STATUSES: OrderStatus[] = ["pending_confirmation", "nuovo", "in_preparazione", "pronto"];

function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

async function fetchKitchenOrders(tenantSlug: string, locationId: string | null): Promise<{
  orders: KitchenOrder[];
  lines: Map<string, KitchenLine[]>;
}> {
  const svc = createSupabaseServiceClient();
  if (!svc) return { orders: [], lines: new Map() };

  let query = svc
    .from("orders")
    .select("id, code, status, type, table_label, customer_name, pickup_time, desired_time, dine_option, fulfillment_type, notes, created_at")
    .eq("tenant_id", tenantSlug)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: true })
    .limit(120);

  if (locationId) query = query.eq("location_id", locationId);

  const { data: orders } = await query;
  const rows = (orders ?? []) as KitchenOrder[];
  const ids = rows.map((order) => order.id);
  const lines = new Map<string, KitchenLine[]>();

  if (ids.length > 0) {
    const { data: lineRows } = await svc
      .from("order_lines")
      .select("id, order_id, name, qty, variant_label, note, prepared")
      .in("order_id", ids)
      .order("position", { ascending: true });

    for (const line of (lineRows ?? []) as KitchenLine[]) {
      const arr = lines.get(line.order_id) ?? [];
      arr.push(line);
      lines.set(line.order_id, arr);
    }
  }

  return { orders: rows, lines };
}

function demoKitchenOrders(): { orders: KitchenOrder[]; lines: Map<string, KitchenLine[]> } {
  const source = demoOrders("food");
  const orders = source.orders
    .filter((order) => ACTIVE_STATUSES.includes(order.status))
    .map((order) => ({
      id: order.id,
      code: order.code,
      status: order.status,
      type: order.type,
      table_label: order.table_label,
      customer_name: order.customer_name,
      pickup_time: order.pickup_time,
      desired_time: order.desired_time,
      dine_option: order.dine_option,
      fulfillment_type: order.fulfillment_type,
      notes: order.notes,
      created_at: order.created_at,
    })) as KitchenOrder[];
  const lines = new Map<string, KitchenLine[]>();
  for (const [orderId, orderLines] of source.lines.entries()) {
    lines.set(orderId, orderLines.map((line, index) => ({
      id: `${orderId}-${index}`,
      order_id: orderId,
      name: line.name,
      qty: line.qty,
      variant_label: line.variant_label,
      note: null,
      prepared: false,
    })));
  }
  return { orders, lines };
}

function statusTitle(status: OrderStatus): string {
  if (status === "nuovo") return "Nuovi";
  if (status === "pending_confirmation") return "Da confermare";
  if (status === "in_preparazione") return "In preparazione";
  return "Pronti";
}

function statusTone(status: OrderStatus): "warn" | "pending" | "ok" | "muted" {
  if (status === "pending_confirmation") return "warn";
  if (status === "nuovo") return "warn";
  if (status === "in_preparazione") return "pending";
  if (status === "pronto") return "ok";
  return "muted";
}

export default async function OperativoCucinaPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((item) => item.id === tenantSlug);
  if (!tenant) return null;
  if (!tenant.features.kitchenDisplay) notFound();

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();

  const activeLocation = auth.isDemo ? null : await getActiveGestioneLocation(tenantSlug);
  const { orders, lines } = auth.isDemo
    ? demoKitchenOrders()
    : await fetchKitchenOrders(tenantSlug, activeLocation?.id ?? null);

  const byStatus = new Map<OrderStatus, KitchenOrder[]>();
  for (const status of ACTIVE_STATUSES) byStatus.set(status, []);
  for (const order of orders) {
    const arr = byStatus.get(order.status) ?? [];
    arr.push(order);
    byStatus.set(order.status, arr);
  }

  const activeCount = orders.filter((order) => order.status !== "pronto").length;

  return (
    <OperationalAlertsClient tenantId={tenantSlug} portal="cucina" locationId={activeLocation?.id ?? undefined}>
    <div className="ga-dashboard">
      <OrdersLiveRefresh tenantId={tenantSlug} />
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="ga-eyebrow">Operativita</span>
          <h1 className="ga-heading">Schermo cucina</h1>
          <p className="ga-lead">
            Coda live degli ordini confermati. Le azioni aggiornano lo stato visibile al cliente nel checkout.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <OperationalAlertControls tenantId={tenantSlug} />
          <div className="ga-card" style={{ minWidth: 180, padding: 16 }}>
            <span className="ga-section-hint">In lavorazione</span>
            <div className="ga-heading" style={{ margin: 0 }}>{activeCount}</div>
          </div>
        </div>
      </header>

      <div className="ga-kpi-grid" style={{ alignItems: "start" }}>
        {ACTIVE_STATUSES.map((status) => {
          const columnOrders = byStatus.get(status) ?? [];
          return (
            <section key={status} className="ga-card">
              <div className="ga-section-head">
                <h2 className="ga-section-title">{statusTitle(status)}</h2>
                <span className="ga-module-status" data-status={statusTone(status)}>{columnOrders.length}</span>
              </div>

              {columnOrders.length === 0 ? (
                <div className="ga-empty" style={{ marginTop: 12 }}>Nessun ordine.</div>
              ) : (
                <div className="ga-reservation-list" style={{ marginTop: 14 }}>
                  {columnOrders.map((order) => {
                    const orderLines = lines.get(order.id) ?? [];
                    const preparedCount = orderLines.filter((line) => line.prepared).length;
                    const allPrepared = order.status === "in_preparazione" && orderLines.length > 0 && preparedCount === orderLines.length;
                    const scheduled = order.pickup_time ?? order.desired_time;
                    const effectiveModality = order.dine_option ?? order.fulfillment_type;

                    return (
                      <article key={order.id} className="ga-reservation">
                        <div className="ga-reservation-when">
                          <span className="ga-reservation-date">
                            {effectiveModality === "delivery"
                              ? "Delivery"
                              : effectiveModality === "dine_in" || order.type === "tavolo"
                                ? "Tavolo"
                                : "Asporto"}
                          </span>
                          <span className="ga-reservation-time">{order.code}</span>
                        </div>
                        <div className="ga-reservation-body">
                          <div className="ga-reservation-head">
                            <span className="ga-reservation-name">
                              {order.table_label ?? order.customer_name ?? "Ordine"}
                            </span>
                            <span className="ga-module-status" data-status={statusTone(order.status)}>{statusTitle(order.status)}</span>
                          </div>
                          <div className="ga-reservation-meta">
                            <span><Clock size={12} strokeWidth={2.2} /> {timeLabel(order.created_at)}</span>
                            <span><AlarmClock size={12} strokeWidth={2.2} /> {minutesSince(order.created_at)} min</span>
                            {effectiveModality === "dine_in" && <span><UtensilsCrossed size={12} strokeWidth={2.2} /> In sala</span>}
                            {scheduled && scheduled !== "asap" && <span><MapPin size={12} strokeWidth={2.2} /> {scheduled}</span>}
                          </div>

                          <ul className="ga-order-lines">
                            {orderLines.map((line) => (
                              <li key={line.id} style={{ opacity: line.prepared ? 0.55 : 1 }}>
                                {order.status === "in_preparazione" && (
                                  <form action={toggleOrderLinePrepared}>
                                    <input type="hidden" name="tenantSlug" value={tenantSlug} />
                                    <input type="hidden" name="orderId" value={order.id} />
                                    <input type="hidden" name="lineId" value={line.id} />
                                    <input type="hidden" name="prepared" value={line.prepared ? "false" : "true"} />
                                    <button type="submit" className="ga-icon-btn" disabled={auth.isDemo} aria-label={line.prepared ? "Segna da preparare" : "Segna preparato"}>
                                      <Check size={12} strokeWidth={2.6} />
                                    </button>
                                  </form>
                                )}
                                <span className="ga-order-qty">{line.qty}x</span>
                                <span style={{ textDecoration: line.prepared ? "line-through" : "none" }}>
                                  {line.name}{line.variant_label ? ` · ${line.variant_label}` : ""}
                                  {line.note ? <em> · {line.note}</em> : null}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {order.notes && (
                            <p className="ga-reservation-notes">
                              <StickyNote size={12} strokeWidth={2.2} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
                              {order.notes}
                            </p>
                          )}

                          {order.status === "in_preparazione" && (
                            <p className="ga-section-hint" style={{ marginTop: 8 }}>
                              Preparati {preparedCount}/{orderLines.length}
                            </p>
                          )}

                          <div className="ga-reservation-actions" style={{ marginTop: 12 }}>
                            {order.status === "pending_confirmation" && (
                              <>
                                <form action={confirmPendingOrder}>
                                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                                  <input type="hidden" name="id" value={order.id} />
                                  <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                                    <Check size={14} strokeWidth={2.4} /> Accetta
                                  </button>
                                </form>
                                <form action={rejectPendingOrder}>
                                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                                  <input type="hidden" name="id" value={order.id} />
                                  <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                                    Rifiuta
                                  </button>
                                </form>
                              </>
                            )}
                            {order.status === "nuovo" && (
                              <form action={startOrder}>
                                <input type="hidden" name="tenantSlug" value={tenantSlug} />
                                <input type="hidden" name="id" value={order.id} />
                                <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                                  <ChefHat size={14} strokeWidth={2.4} /> Prendi in carico
                                </button>
                              </form>
                            )}
                            {order.status === "in_preparazione" && (
                              <form action={markReady}>
                                <input type="hidden" name="tenantSlug" value={tenantSlug} />
                                <input type="hidden" name="id" value={order.id} />
                                <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo} data-hot={allPrepared || undefined}>
                                  <Check size={14} strokeWidth={2.4} /> Segna pronto
                                </button>
                              </form>
                            )}
                            {order.status === "pronto" && (
                              <form action={markDelivered}>
                                <input type="hidden" name="tenantSlug" value={tenantSlug} />
                                <input type="hidden" name="id" value={order.id} />
                                <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                                  <Check size={14} strokeWidth={2.4} /> Completa
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
    </OperationalAlertsClient>
  );
}
