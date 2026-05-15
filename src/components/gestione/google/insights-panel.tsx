"use client";

import { useState, useEffect } from "react";
import { Eye, MousePointerClick, Phone, Navigation, TrendingUp } from "lucide-react";
import type { InsightsResponse, DailyPoint } from "@/app/api/gestione/google/insights/route";

interface Props {
  tenantId: string;
}

// ─── Sparkline bar chart ──────────────────────────────────────────────────────

function BarChart({ series, color = "bg-pork-red" }: { series: DailyPoint[]; color?: string }) {
  if (!series.length) return null;
  const max = Math.max(...series.map((p) => p.value), 1);

  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" });

  // Mostra etichette solo per prima, ultima e punto di massimo
  const maxIdx = series.reduce((mi, p, i) => (p.value > series[mi].value ? i : mi), 0);

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-[2px] h-16">
        {series.map((p, i) => {
          const pct = max > 0 ? (p.value / max) * 100 : 0;
          const isMax = i === maxIdx;
          return (
            <div
              key={p.date}
              className="group relative flex-1 flex items-end"
              style={{ minWidth: 2 }}
            >
              <div
                className={`w-full rounded-t-sm transition-opacity ${color} ${isMax ? "opacity-100" : "opacity-40 group-hover:opacity-70"}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex whitespace-nowrap rounded-lg bg-pork-ink px-2 py-1 text-[10px] font-semibold text-pork-cream z-10">
                {fmt(p.date)}: {p.value.toLocaleString("it-IT")}
              </div>
            </div>
          );
        })}
      </div>
      {/* Asse x: prima e ultima data */}
      {series.length >= 2 && (
        <div className="flex justify-between text-[10px] text-pork-ink/30">
          <span>{fmt(series[0].date)}</span>
          <span>{fmt(series[series.length - 1].date)}</span>
        </div>
      )}
    </div>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  series,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  series: DailyPoint[];
  color: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-pork-ink/10 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-pork-ink/50">
          <Icon size={15} />
          <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        </div>
        <span className="text-2xl font-bold">{value.toLocaleString("it-IT")}</span>
      </div>
      <BarChart series={series} color={color} />
    </div>
  );
}

// ─── Selezione periodo ────────────────────────────────────────────────────────

const PERIODS = [
  { label: "7 gg",  days: 7 },
  { label: "30 gg", days: 30 },
  { label: "90 gg", days: 90 },
] as const;

// ─── Panel principale ─────────────────────────────────────────────────────────

export function InsightsPanel({ tenantId }: Props) {
  const [days, setDays]     = useState<7 | 30 | 90>(30);
  const [data, setData]     = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/gestione/google/insights?tenantId=${tenantId}&days=${days}`)
      .then((r) => r.json())
      .then((json: InsightsResponse & { error?: string }) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError("Errore caricamento dati"))
      .finally(() => setLoading(false));
  }, [tenantId, days]);

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      {/* Header + selettore periodo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-pork-ink/50">
          {data ? `${fmtDate(data.period.from)} – ${fmtDate(data.period.to)}` : "Caricamento…"}
        </p>
        <div className="flex rounded-full border-2 border-pork-ink/10 p-1 text-sm">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setDays(p.days)}
              className="rounded-full px-4 py-1.5 font-semibold transition-colors"
              style={
                days === p.days
                  ? { backgroundColor: "var(--pork-ink)", color: "var(--pork-cream)" }
                  : { color: "color-mix(in srgb, var(--pork-ink) 50%, transparent)" }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border-2 border-pork-ink/5 bg-white p-5 h-32 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Visualizzazioni — card grande con chart principale */}
          <div className="rounded-2xl border-2 border-pork-ink/10 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-pork-ink/50">
                <Eye size={15} />
                <span className="text-xs font-bold uppercase tracking-wide">Visualizzazioni</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold">{data.totals.views.toLocaleString("it-IT")}</span>
                <p className="text-xs text-pork-ink/40">Maps + Ricerca Google</p>
              </div>
            </div>
            <BarChart series={data.viewsSeries} color="bg-pork-red" />
          </div>

          {/* KPI secondari */}
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              icon={MousePointerClick}
              label="Click sito web"
              value={data.totals.websiteClicks}
              series={data.clicksSeries}
              color="bg-pork-ink"
            />
            <KpiCard
              icon={Phone}
              label="Chiamate"
              value={data.totals.calls}
              series={data.callsSeries}
              color="bg-pork-green"
            />
            <KpiCard
              icon={Navigation}
              label="Indicazioni"
              value={data.totals.directions}
              series={data.directionsSeries}
              color="bg-pork-mustard"
            />
          </div>

          {/* Nota metodologica */}
          <p className="text-xs text-pork-ink/30 flex items-center gap-1.5">
            <TrendingUp size={12} />
            Dati forniti da Google Business Profile Performance API. Aggiornati con ritardo di 2–4 giorni.
          </p>
        </>
      )}
    </div>
  );
}
