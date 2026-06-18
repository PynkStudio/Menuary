"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeEuro,
  Bot,
  CheckCircle2,
  Phone,
  MessageCircle,
  ShoppingBag,
  XCircle,
  Clock,
  AlertCircle,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PlatformAIOrder,
  PlatformNonAIOrderStat,
  AIOrderSource,
  AIOrderCategory,
} from "@/lib/platform-crm-types";
import {
  AI_ORDER_SOURCE_LABELS,
  AI_ORDER_SOURCE_COLORS,
  AI_ORDER_BILLING_LABELS,
  AI_ORDER_BILLING_COLORS,
  AI_ORDER_CATEGORY_LABELS,
  AI_ORDER_CATEGORY_COLORS,
  AI_COMMISSION_RATE,
} from "@/lib/platform-crm-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function eur(n: number, forceSign = false) {
  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Math.abs(n));
  if (forceSign && n < 0) return `−${formatted}`;
  if (forceSign && n > 0) return `+${formatted}`;
  return n < 0 ? `−${formatted}` : formatted;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Period = "month" | "last_month" | "90d" | "year";

function periodRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  if (period === "month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to };
  }
  if (period === "last_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
      to: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    };
  }
  if (period === "year") {
    return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to };
  }
  return { from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), to };
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "month", label: "Questo mese" },
  { value: "last_month", label: "Scorso mese" },
  { value: "90d", label: "Ultimi 90gg" },
  { value: "year", label: "Da inizio anno" },
];

const SOURCE_ICON: Record<AIOrderSource, React.ElementType> = {
  retell: Phone,
  whatsapp: MessageCircle,
};

const CATEGORY_ICON: Record<AIOrderCategory, React.ElementType> = {
  confirmed: CheckCircle2,
  non_concluded: XCircle,
  pending: Clock,
};

// ─── Componente principale ────────────────────────────────────────────────────

export function PlatformAIRevenuePage() {
  const [period, setPeriod] = useState<Period>("90d");
  const [sourceFilter, setSourceFilter] = useState<AIOrderSource | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<AIOrderCategory | "all">("all");
  const [aiOrders, setAiOrders] = useState<PlatformAIOrder[]>([]);
  const [nonAiStats, setNonAiStats] = useState<PlatformNonAIOrderStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setFeedback(null);
    const { from, to } = periodRange(p);
    try {
      const res = await fetch(
        `/api/admin/orders/ai-revenue?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      const data = (await res.json()) as {
        aiOrders?: PlatformAIOrder[];
        nonAiStats?: PlatformNonAIOrderStat[];
      };
      setAiOrders(data.aiOrders ?? []);
      setNonAiStats(data.nonAiStats ?? []);
    } catch {
      setFeedback({ msg: "Errore nel caricamento dei dati.", ok: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(period);
  }, [period, fetchData]);

  // ─── Calcoli prospetto ────────────────────────────────────────────────────

  const statement = useMemo(() => {
    const confirmed = aiOrders.filter((o) => o.category === "confirmed");
    const nonConcluded = aiOrders.filter((o) => o.category === "non_concluded");
    const pending = aiOrders.filter((o) => o.category === "pending");

    const confirmedVolume = confirmed.reduce((s, o) => s + o.total, 0);
    const nonConcludedVolume = nonConcluded.reduce((s, o) => s + o.total, 0);
    const pendingVolume = pending.reduce((s, o) => s + o.total, 0);
    const totalVolume = confirmedVolume + nonConcludedVolume + pendingVolume;

    const grossCommission = Math.round(totalVolume * AI_COMMISSION_RATE * 100) / 100;
    const reversal = Math.round(nonConcludedVolume * AI_COMMISSION_RATE * 100) / 100;
    const pendingCommission = Math.round(pendingVolume * AI_COMMISSION_RATE * 100) / 100;
    const netCommission = grossCommission - reversal;

    // Breakdown per tipo di pagamento (solo confermati)
    const stripeConfirmed = confirmed.filter((o) => o.billing_status === "stripe");
    const cashPending = confirmed.filter((o) => o.billing_status === "cash_pending");
    const cashBilled = confirmed.filter((o) => o.billing_status === "cash_billed");

    return {
      totalVolume,
      confirmedVolume,
      confirmedCount: confirmed.length,
      nonConcludedVolume,
      nonConcludedCount: nonConcluded.length,
      pendingVolume,
      pendingCount: pending.length,
      grossCommission,
      reversal,
      pendingCommission,
      netCommission,
      stripeCommission: stripeConfirmed.reduce((s, o) => s + o.commission_amount, 0),
      cashPendingCommission: cashPending.reduce((s, o) => s + o.commission_amount, 0),
      cashPendingCount: cashPending.length,
      cashBilledCommission: cashBilled.reduce((s, o) => s + o.commission_amount, 0),
    };
  }, [aiOrders]);

  // ─── Filtro lista ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return aiOrders.filter((o) => {
      if (sourceFilter !== "all" && o.source !== sourceFilter) return false;
      if (categoryFilter !== "all" && o.category !== categoryFilter) return false;
      return true;
    });
  }, [aiOrders, sourceFilter, categoryFilter]);

  // ─── Azione "segna addebitato" ────────────────────────────────────────────

  async function markBilled(order: PlatformAIOrder) {
    setBusyId(order.id);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/orders/ai-revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const result = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        feeAmountCents?: number;
      };
      if (!res.ok || !result.ok) {
        setFeedback({ msg: result.error ?? "Operazione non riuscita.", ok: false });
        return;
      }
      const feeEur = (result.feeAmountCents ?? 0) / 100;
      setAiOrders((current) =>
        current.map((o) =>
          o.id === order.id
            ? {
                ...o,
                billing_status: "cash_billed" as const,
                application_fee_amount_cents: result.feeAmountCents ?? null,
                commission_amount: feeEur,
              }
            : o,
        ),
      );
      setFeedback({
        msg: `Commissione ${eur(feeEur)} segnata come addebitata per ordine ${order.code}.`,
        ok: true,
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-pork-red" />
          <p className="impact-title text-xs text-pork-red">Piattaforma</p>
        </div>
        <h1 className="headline text-4xl">Proventi AI</h1>
        <p className="mt-1 text-pork-ink/60">
          Ordini ricevuti tramite canali AI (telefono e WhatsApp). Commissione del 3% sugli
          ordini confermati; gli ordini non conclusi vengono stornati.
        </p>
      </header>

      {feedback && (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm font-semibold",
            feedback.ok
              ? "bg-pork-green/10 text-pork-green"
              : "bg-pork-red/10 text-pork-red",
          )}
        >
          {feedback.msg}
        </div>
      )}

      {/* Selettore periodo */}
      <div className="flex gap-1 rounded-2xl bg-pork-ink/5 p-1 w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold transition",
              period === p.value
                ? "bg-pork-ink text-pork-cream"
                : "text-pork-ink/60 hover:text-pork-ink",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Prospetto commissioni ─────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white ring-1 ring-pork-ink/10 overflow-hidden">
        <div className="border-b border-pork-ink/8 px-6 py-4">
          <p className="font-black text-sm uppercase tracking-wide text-pork-ink/40">
            Prospetto commissioni
          </p>
        </div>

        <div className="px-6 py-5 space-y-0">
          {/* Riga: totale ordini */}
          <StatementRow
            label="Totale ordini AI"
            sub={`${aiOrders.length} ordini`}
            value={eur(statement.totalVolume)}
          />
          <StatementRow
            label={`Tariffa ${Math.round(AI_COMMISSION_RATE * 100)}%`}
            value={eur(statement.grossCommission)}
            valueClass="font-black"
          />

          {/* Separatore */}
          <div className="py-2">
            <div className="border-t border-dashed border-pork-ink/15" />
          </div>

          {/* Riga: storno non conclusi */}
          <StatementRow
            label="Ordini non conclusi"
            sub={`${statement.nonConcludedCount} ordini · scaduti o annullati`}
            value={statement.nonConcludedCount > 0 ? `−${eur(statement.nonConcludedVolume)}` : "—"}
            valueClass="text-pork-ink/50"
          />
          {statement.nonConcludedCount > 0 && (
            <StatementRow
              label={`Storno ${Math.round(AI_COMMISSION_RATE * 100)}%`}
              value={`−${eur(statement.reversal)}`}
              valueClass="text-pork-ink/50"
            />
          )}

          {statement.pendingCount > 0 && (
            <>
              <div className="py-2">
                <div className="border-t border-dashed border-pork-ink/15" />
              </div>
              <StatementRow
                label="Ordini in attesa di conferma"
                sub={`${statement.pendingCount} ordini · esclusi dal calcolo`}
                value={`(${eur(statement.pendingVolume)})`}
                valueClass="text-pork-mustard font-semibold"
              />
            </>
          )}

          {/* Totale netto */}
          <div className="py-2">
            <div className="border-t border-pork-ink/20" />
          </div>
          <div className="flex items-center justify-between py-1">
            <p className="font-black text-base">Commissione netta</p>
            <p className="font-black text-2xl tabular-nums text-pork-red">
              {eur(statement.netCommission)}
            </p>
          </div>
        </div>

        {/* Sub-breakdown pagamenti */}
        <div className="border-t border-pork-ink/8 bg-pork-ink/[0.02] px-6 py-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-wide text-pork-ink/40">
            Dettaglio incasso
          </p>
          <div className="grid grid-cols-3 gap-4">
            <MiniKpi
              label="Stripe (auto)"
              value={eur(statement.stripeCommission)}
              sub="già incassato"
              tone="text-sky-600"
            />
            <MiniKpi
              label="Cash da addebitare"
              value={eur(statement.cashPendingCommission)}
              sub={`${statement.cashPendingCount} ordini`}
              tone={statement.cashPendingCount > 0 ? "text-pork-mustard" : "text-pork-ink/40"}
              alert={statement.cashPendingCount > 0}
            />
            <MiniKpi
              label="Cash addebitato"
              value={eur(statement.cashBilledCommission)}
              sub="registrato manualmente"
              tone="text-pork-green"
            />
          </div>
        </div>
      </div>

      {/* ── Filtri lista ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-2xl bg-pork-ink/5 p-1 w-fit">
          <FilterBtn active={sourceFilter === "all"} onClick={() => setSourceFilter("all")}>
            Tutti i canali
          </FilterBtn>
          {(["retell", "whatsapp"] as AIOrderSource[]).map((src) => (
            <FilterBtn
              key={src}
              active={sourceFilter === src}
              onClick={() => setSourceFilter(src)}
            >
              {AI_ORDER_SOURCE_LABELS[src]}
            </FilterBtn>
          ))}
        </div>
        <div className="flex gap-1 rounded-2xl bg-pork-ink/5 p-1 w-fit">
          <FilterBtn active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
            Tutti
          </FilterBtn>
          <FilterBtn
            active={categoryFilter === "confirmed"}
            onClick={() => setCategoryFilter("confirmed")}
          >
            Confermati
          </FilterBtn>
          <FilterBtn
            active={categoryFilter === "non_concluded"}
            onClick={() => setCategoryFilter("non_concluded")}
          >
            Non conclusi
          </FilterBtn>
          <FilterBtn
            active={categoryFilter === "pending"}
            onClick={() => setCategoryFilter("pending")}
          >
            In attesa
          </FilterBtn>
        </div>
      </div>

      {/* ── Lista ordini AI ───────────────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="headline text-2xl">Ordini AI</h2>
          <p className="text-sm text-pork-ink/40">{filtered.length} ordini</p>
        </div>

        {loading && (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
            <p className="text-pork-ink/40 text-sm">Caricamento…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
            <p className="text-pork-ink/50">Nessun ordine AI nel periodo selezionato.</p>
          </div>
        )}

        {!loading &&
          filtered.map((order) => (
            <AIOrderRow
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onMarkBilled={markBilled}
            />
          ))}
      </section>

      {/* ── Statistiche non-AI ────────────────────────────────────────────── */}
      {nonAiStats.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="headline text-2xl">Ordini non-AI · Statistiche</h2>
            <p className="text-sm text-pork-ink/50">Nessuna commissione — tracciati a fini statistici.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nonAiStats.map((stat) => (
              <NonAiStatCard key={`${stat.tenant_id}::${stat.source}`} stat={stat} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Riga ordine AI ───────────────────────────────────────────────────────────

function AIOrderRow({
  order,
  busy,
  onMarkBilled,
}: {
  order: PlatformAIOrder;
  busy: boolean;
  onMarkBilled: (order: PlatformAIOrder) => Promise<void>;
}) {
  const SourceIcon = SOURCE_ICON[order.source];
  const CategoryIcon = CATEGORY_ICON[order.category];
  const isNonConcluded = order.category === "non_concluded";
  const isPending = order.category === "pending";

  return (
    <div
      className={cn(
        "rounded-2xl p-4 ring-1 transition",
        isNonConcluded
          ? "bg-pork-ink/[0.02] ring-pork-ink/8"
          : isPending
            ? "bg-pork-mustard/[0.04] ring-pork-mustard/20"
            : "bg-white ring-pork-ink/10",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Canale */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
            AI_ORDER_SOURCE_COLORS[order.source],
            isNonConcluded && "opacity-50",
          )}
        >
          <SourceIcon size={10} />
          {AI_ORDER_SOURCE_LABELS[order.source]}
        </span>

        {/* Stato ordine */}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
            AI_ORDER_CATEGORY_COLORS[order.category],
          )}
        >
          <CategoryIcon size={10} />
          {AI_ORDER_CATEGORY_LABELS[order.category]}
        </span>

        {/* Info ordine */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("font-black", isNonConcluded && "text-pork-ink/40")}>
              {order.tenant_name}
            </span>
            <span className="text-xs text-pork-ink/30">·</span>
            <span className="font-mono text-xs text-pork-ink/50">{order.code}</span>
            {order.customer_name && (
              <>
                <span className="text-xs text-pork-ink/30">·</span>
                <span className="text-sm text-pork-ink/60">{order.customer_name}</span>
              </>
            )}
          </div>
          <p className="mt-0.5 text-xs text-pork-ink/35">{fmt(order.created_at)}</p>
        </div>

        {/* Importi */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-wide text-pork-ink/30">
              Ordine
            </p>
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                isNonConcluded && "text-pork-ink/40 line-through decoration-pork-ink/25",
              )}
            >
              {eur(order.total)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-wide text-pork-ink/30">
              {isNonConcluded ? "Storno 3%" : isPending ? "3% (attesa)" : "Commissione 3%"}
            </p>
            {isNonConcluded ? (
              <p className="text-sm font-black tabular-nums text-pork-ink/35 line-through">
                {eur(order.commission_amount)}
              </p>
            ) : isPending ? (
              <p className="text-sm font-bold tabular-nums text-pork-mustard/70">
                ({eur(order.commission_amount)})
              </p>
            ) : (
              <p className="text-sm font-black tabular-nums text-pork-red">
                {eur(order.commission_amount)}
              </p>
            )}
          </div>
        </div>

        {/* Stato addebito — solo per confermati */}
        {order.category === "confirmed" && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
              AI_ORDER_BILLING_COLORS[order.billing_status],
            )}
          >
            {AI_ORDER_BILLING_LABELS[order.billing_status]}
          </span>
        )}

        {/* Non conclusi: badge storno */}
        {isNonConcluded && (
          <span className="inline-flex items-center gap-1 rounded-full bg-pork-ink/8 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-pork-ink/40">
            <Minus size={8} />
            Stornato
          </span>
        )}

        {/* Pending: nessuna azione */}
        {isPending && (
          <span className="inline-flex items-center gap-1 rounded-full bg-pork-mustard/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-pork-ink/60">
            <Clock size={8} />
            In attesa
          </span>
        )}

        {/* Azione per cash confermato non ancora addebitato */}
        {order.category === "confirmed" && order.billing_status === "cash_pending" && (
          <button
            onClick={() => void onMarkBilled(order)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-white transition hover:bg-pork-ink/80 disabled:opacity-40"
          >
            <BadgeEuro size={12} />
            Segna addebitato
          </button>
        )}

        {order.category === "confirmed" && order.billing_status === "cash_billed" && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-pork-green">
            <CheckCircle2 size={12} />
            Addebitato
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Riga prospetto ───────────────────────────────────────────────────────────

function StatementRow({
  label,
  sub,
  value,
  valueClass,
}: {
  label: string;
  sub?: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div>
        <p className="text-sm font-semibold text-pork-ink">{label}</p>
        {sub && <p className="text-xs text-pork-ink/45">{sub}</p>}
      </div>
      <p className={cn("text-sm tabular-nums shrink-0", valueClass ?? "font-semibold text-pork-ink")}>
        {value}
      </p>
    </div>
  );
}

// ─── Mini KPI ─────────────────────────────────────────────────────────────────

function MiniKpi({
  label,
  value,
  sub,
  tone,
  alert,
}: {
  label: string;
  value: string;
  sub: string;
  tone: string;
  alert?: boolean;
}) {
  return (
    <div>
      {alert && <AlertCircle size={13} className="mb-1 text-pork-mustard" />}
      <p className={cn("text-base font-black tabular-nums", tone)}>{value}</p>
      <p className="mt-0.5 text-xs font-bold text-pork-ink/60">{label}</p>
      <p className="text-[11px] text-pork-ink/35">{sub}</p>
    </div>
  );
}

// ─── Card stat non-AI ─────────────────────────────────────────────────────────

function NonAiStatCard({ stat }: { stat: PlatformNonAIOrderStat }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-pork-ink/10">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">{stat.tenant_name}</p>
          <p className="mt-0.5 text-xs text-pork-ink/50 capitalize">{stat.source}</p>
        </div>
        <ShoppingBag size={14} className="mt-1 shrink-0 text-pork-ink/25" />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-pork-ink/30">Volume</p>
          <p className="text-sm font-black tabular-nums">{eur(stat.total_volume)}</p>
        </div>
        <p className="text-xs text-pork-ink/35 font-semibold">{stat.order_count} ordini</p>
      </div>
    </div>
  );
}

// ─── FilterBtn ────────────────────────────────────────────────────────────────

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl px-3 py-2 text-xs font-bold transition",
        active ? "bg-pork-ink text-pork-cream" : "text-pork-ink/60 hover:text-pork-ink",
      )}
    >
      {children}
    </button>
  );
}
