import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { demoAnalytics } from "@/lib/demo-fixtures";

type OrderRow = {
  total: number;
  created_at: string;
  status: string;
  source: string | null;
  external_platform: string | null;
};
type LineRow = { name: string; qty: number };

const PLATFORM_LABELS: Record<string, string> = {
  deliveroo: "Deliveroo",
  ubereats: "Uber Eats",
  uber_eats: "Uber Eats",
  justeat: "Just Eat",
  just_eat: "Just Eat",
  glovo: "Glovo",
};

function channelLabel(source: string | null, platform: string | null): string {
  if (source !== "hubrise") return "Diretto";
  if (!platform) return "Piattaforma";
  return PLATFORM_LABELS[platform] ?? platform.charAt(0).toUpperCase() + platform.slice(1);
}

async function fetchAnalytics(tenantSlug: string) {
  const svc = createSupabaseServiceClient();
  if (!svc) return null;

  const now = new Date();
  const from30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const from7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [ordersRes, reservationsCount, reviewsAgg, topItems] = await Promise.all([
    svc
      .from("orders")
      .select("total, created_at, status, source, external_platform")
      .eq("tenant_id", tenantSlug)
      .gte("created_at", from30)
      .not("status", "eq", "annullato"),
    svc
      .from("reservation_requests")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantSlug)
      .gte("reservation_date", from30.slice(0, 10)),
    svc
      .from("reviews")
      .select("rating")
      .eq("tenant_id", tenantSlug)
      .gte("created_at", from30),
    svc
      .from("order_lines")
      .select("name, qty, order:orders!inner(tenant_id, created_at, status)")
      .eq("order.tenant_id", tenantSlug)
      .gte("order.created_at", from7)
      .not("order.status", "eq", "annullato")
      .limit(1000),
  ]);

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const orders7 = orders.filter((o) => o.created_at >= from7);

  const total30 = orders.reduce((s, o) => s + Number(o.total), 0);
  const total7 = orders7.reduce((s, o) => s + Number(o.total), 0);
  const avg30 = orders.length > 0 ? total30 / orders.length : 0;

  // breakdown ordini per giorno (ultimi 7gg)
  const byDay = new Map<string, { count: number; total: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    byDay.set(d.toISOString().slice(0, 10), { count: 0, total: 0 });
  }
  for (const o of orders7) {
    const k = o.created_at.slice(0, 10);
    const e = byDay.get(k);
    if (e) { e.count += 1; e.total += Number(o.total); }
  }

  // top items 7gg
  const itemTotals = new Map<string, number>();
  for (const row of (topItems.data ?? []) as (LineRow & { order: unknown })[]) {
    itemTotals.set(row.name, (itemTotals.get(row.name) ?? 0) + Number(row.qty));
  }
  const top = [...itemTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const ratings = (reviewsAgg.data ?? []) as { rating: number }[];
  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + Number(r.rating), 0) / ratings.length : null;

  // Breakdown per canale (ultimi 30gg)
  const channelMap = new Map<string, { count: number; total: number }>();
  for (const o of orders) {
    const key = channelLabel(o.source, o.external_platform);
    const entry = channelMap.get(key) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(o.total);
    channelMap.set(key, entry);
  }
  const channels = [...channelMap.entries()]
    .map(([label, v]) => ({ label, count: v.count, total: v.total }))
    .sort((a, b) => b.total - a.total);

  return {
    total30, total7, avg30,
    ordersCount30: orders.length,
    ordersCount7: orders7.length,
    reservationsCount30: reservationsCount.count ?? 0,
    reviewsCount: ratings.length,
    avgRating,
    byDay: [...byDay.entries()],
    top,
    channels,
  };
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) return null;
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();

  const data = auth.isDemo ? demoAnalytics(tenant.vertical) : await fetchAnalytics(tenantSlug);
  const isServices = tenant.vertical === "services";

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Crescita</span>
        <h1 className="ga-heading">Analytics</h1>
        <p className="ga-lead">Numeri di {isServices ? "richieste e servizi" : "ordini e sala"} degli ultimi 30 giorni.</p>
      </header>

      {!data ? (
        <div className="ga-empty">
          {auth.isDemo ? "In modalità demo gli analytics non vengono mostrati." : "Nessun dato disponibile."}
        </div>
      ) : (
        <>
          <section className="ga-kpi-grid">
            <div className="ga-kpi">
              <span className="ga-kpi-label">Incasso 30gg</span>
              <span className="ga-kpi-value">{formatCurrency(data.total30)}</span>
              <span className="ga-kpi-hint">{data.ordersCount30} ordini</span>
            </div>
            <div className="ga-kpi">
              <span className="ga-kpi-label">Incasso 7gg</span>
              <span className="ga-kpi-value">{formatCurrency(data.total7)}</span>
              <span className="ga-kpi-hint">{data.ordersCount7} ordini</span>
            </div>
            <div className="ga-kpi">
              <span className="ga-kpi-label">Scontrino medio</span>
              <span className="ga-kpi-value">{formatCurrency(data.avg30)}</span>
            </div>
            <div className="ga-kpi">
              <span className="ga-kpi-label">{isServices ? "Appuntamenti 30gg" : "Prenotazioni 30gg"}</span>
              <span className="ga-kpi-value">{data.reservationsCount30}</span>
            </div>
            <div className="ga-kpi">
              <span className="ga-kpi-label">Recensioni 30gg</span>
              <span className="ga-kpi-value">{data.reviewsCount}</span>
              {data.avgRating != null && (
                <span className="ga-kpi-hint">★ {data.avgRating.toFixed(1)}</span>
              )}
            </div>
          </section>

          <section className="ga-card">
            <div className="ga-section-head">
              <h2 className="ga-section-title">Ordini ultimi 7 giorni</h2>
              <span className="ga-section-hint">Totale giornaliero</span>
            </div>
            <div className="ga-chart">
              {(() => {
                const max = Math.max(1, ...data.byDay.map(([, v]) => v.total));
                return data.byDay.map(([day, v]) => {
                  const h = Math.round((v.total / max) * 100);
                  const d = new Date(day);
                  return (
                    <div key={day} className="ga-chart-bar">
                      <div className="ga-chart-bar-track">
                        <div className="ga-chart-bar-fill" style={{ height: `${h}%` }} />
                      </div>
                      <span className="ga-chart-bar-label">
                        {d.toLocaleDateString("it-IT", { weekday: "short" })}
                      </span>
                      <span className="ga-chart-bar-value">{formatCurrency(v.total)}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </section>

          {"channels" in data && Array.isArray(data.channels) && data.channels.length >= 2 && (
            <section className="ga-card">
              <div className="ga-section-head">
                <h2 className="ga-section-title">Canali di vendita 30gg</h2>
                <span className="ga-section-hint">Incasso per canale</span>
              </div>
              <ul className="ga-channel-list">
                {(() => {
                  const max = Math.max(1, ...data.channels.map((c) => c.total));
                  return data.channels.map((c) => {
                    const pct = Math.round((c.total / max) * 100);
                    return (
                      <li key={c.label} className="ga-channel-row">
                        <div className="ga-channel-meta">
                          <span className="ga-channel-name">{c.label}</span>
                          <span className="ga-channel-hint">{c.count} ordini · {formatCurrency(c.total)}</span>
                        </div>
                        <div className="ga-channel-bar">
                          <div className="ga-channel-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  });
                })()}
              </ul>
            </section>
          )}

          {data.top.length > 0 && (
            <section className="ga-card">
              <div className="ga-section-head">
                <h2 className="ga-section-title">Top {isServices ? "servizi" : "piatti"} ultimi 7gg</h2>
              </div>
              <ol className="ga-top-list">
                {data.top.map(([name, qty], i) => (
                  <li key={name}>
                    <span className="ga-top-rank">{i + 1}</span>
                    <span className="ga-top-name">{name}</span>
                    <span className="ga-top-qty">×{qty}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </div>
  );
}
