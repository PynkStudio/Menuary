import Link from "next/link";
import { notFound } from "next/navigation";
import { ChefHat, Bell, Check, X, MapPin, Clock, StickyNote } from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";
import { startOrder, markReady, markDelivered, cancelOrder } from "./actions";

type Filter = "live" | "nuovi" | "preparazione" | "pronti" | "asporto" | "tavolo" | "storico" | "tutti";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "live", label: "Coda live" },
  { id: "nuovi", label: "Nuovi" },
  { id: "preparazione", label: "In preparazione" },
  { id: "pronti", label: "Pronti" },
  { id: "asporto", label: "Asporto" },
  { id: "tavolo", label: "Sala" },
  { id: "storico", label: "Storico" },
  { id: "tutti", label: "Tutti" },
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
};

type OrderLine = { order_id: string; name: string; qty: number; variant_label: string | null };

async function fetchOrders(tenantSlug: string, filter: Filter): Promise<{ orders: OrderRow[]; lines: Map<string, OrderLine[]> }> {
  const svc = createSupabaseServiceClient();
  if (!svc) return { orders: [], lines: new Map() };

  let q = svc
    .from("orders")
    .select("id, code, status, type, total, customer_name, table_label, pickup_time, notes, created_at")
    .eq("tenant_id", tenantSlug);

  const liveStatuses: Database["public"]["Enums"]["order_status"][] = ["nuovo", "in_preparazione", "pronto"];
  switch (filter) {
    case "live":
      q = q.in("status", liveStatuses);
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

function statusBadge(status: OrderRow["status"]): { label: string; tone: "ok" | "warn" | "error" | "muted" | "pending" } {
  switch (status) {
    case "nuovo": return { label: "Nuovo", tone: "warn" };
    case "in_preparazione": return { label: "In preparazione", tone: "pending" };
    case "pronto": return { label: "Pronto", tone: "ok" };
    case "consegnato": return { label: "Consegnato", tone: "muted" };
    case "annullato": return { label: "Annullato", tone: "error" };
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

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();

  const filter: Filter = FILTERS.some((x) => x.id === f) ? (f as Filter) : "live";
  const { orders, lines } = auth.isDemo ? { orders: [], lines: new Map<string, OrderLine[]>() } : await fetchOrders(tenantSlug, filter);

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Operatività</span>
        <h1 className="ga-heading">Ordini</h1>
        <p className="ga-lead">Coda live di sala, asporto e kiosk. Cambia stato con un click — il cliente vede la conferma.</p>
      </header>

      <nav className="ga-pills" aria-label="Filtra ordini">
        {FILTERS.map((opt) => (
          <Link key={opt.id} href={`?f=${opt.id}`} className="ga-pill" data-active={opt.id === filter}>
            {opt.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className="ga-empty">
          {auth.isDemo
            ? "In modalità demo gli ordini reali non vengono mostrati."
            : "Nessun ordine in questo intervallo."}
        </div>
      ) : (
        <div className="ga-reservation-list">
          {orders.map((o) => {
            const badge = statusBadge(o.status);
            const items = lines.get(o.id) ?? [];
            const isNuovo = o.status === "nuovo";
            const isPreparazione = o.status === "in_preparazione";
            const isPronto = o.status === "pronto";

            return (
              <article key={o.id} className="ga-reservation">
                <div className="ga-reservation-when">
                  <span className="ga-reservation-date">{o.type === "asporto" ? "Asporto" : "Sala"}</span>
                  <span className="ga-reservation-time">{o.code}</span>
                </div>

                <div className="ga-reservation-body">
                  <div className="ga-reservation-head">
                    <span className="ga-reservation-name">{o.customer_name ?? "Cliente"}</span>
                    <span className="ga-module-status" data-status={badge.tone}>{badge.label}</span>
                    <span className="ga-reservation-tag" style={{ background: "transparent", color: "var(--ga-ink-faint)" }}>
                      {formatTotal(o.total)}
                    </span>
                  </div>
                  <div className="ga-reservation-meta">
                    <span><Clock size={12} strokeWidth={2.2} /> {formatTime(o.created_at)}</span>
                    {o.table_label && (
                      <span><MapPin size={12} strokeWidth={2.2} /> {o.table_label}</span>
                    )}
                    {o.pickup_time && (
                      <span><Bell size={12} strokeWidth={2.2} /> Ritiro {o.pickup_time}</span>
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
                  {isNuovo && (
                    <>
                      <form action={startOrder}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                          <ChefHat size={14} strokeWidth={2.4} /> In preparazione
                        </button>
                      </form>
                      <form action={cancelOrder}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                          <X size={14} strokeWidth={2.4} /> Annulla
                        </button>
                      </form>
                    </>
                  )}
                  {isPreparazione && (
                    <form action={markReady}>
                      <input type="hidden" name="tenantSlug" value={tenantSlug} />
                      <input type="hidden" name="id" value={o.id} />
                      <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                        <Bell size={14} strokeWidth={2.4} /> Segna pronto
                      </button>
                    </form>
                  )}
                  {isPronto && (
                    <>
                      <form action={markDelivered}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                          <Check size={14} strokeWidth={2.4} /> Consegnato
                        </button>
                      </form>
                      <form action={cancelOrder}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                          <X size={14} strokeWidth={2.4} /> Annulla
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
