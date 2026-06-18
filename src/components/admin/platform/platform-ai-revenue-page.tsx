"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeEuro,
  Bot,
  CheckCircle2,
  CreditCard,
  Phone,
  MessageCircle,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PlatformAIOrder,
  PlatformNonAIOrderStat,
  AIOrderSource,
} from "@/lib/platform-crm-types";
import {
  AI_ORDER_SOURCE_LABELS,
  AI_ORDER_SOURCE_COLORS,
  AI_ORDER_BILLING_LABELS,
  AI_ORDER_BILLING_COLORS,
} from "@/lib/platform-crm-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function eur(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
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
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return { from, to };
  }
  if (period === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const toDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return { from, to: toDate };
  }
  if (period === "year") {
    const from = new Date(now.getFullYear(), 0, 1).toISOString();
    return { from, to };
  }
  // 90d default
  const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
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

// ─── Componente principale ────────────────────────────────────────────────────

export function PlatformAIRevenuePage() {
  const [period, setPeriod] = useState<Period>("90d");
  const [sourceFilter, setSourceFilter] = useState<AIOrderSource | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "stripe" | "cash_pending" | "cash_billed">("all");
  const [aiOrders, setAiOrders] = useState<PlatformAIOrder[]>([]);
  const [nonAiStats, setNonAiStats] = useState<PlatformNonAIOrderStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

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
      setFeedback("Errore nel caricamento dei dati.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(period);
  }, [period, fetchData]);

  const summary = useMemo(() => {
    const stripe = aiOrders.filter((o) => o.billing_status === "stripe");
    const cashPending = aiOrders.filter((o) => o.billing_status === "cash_pending");
    const cashBilled = aiOrders.filter((o) => o.billing_status === "cash_billed");
    return {
      totalVolume: aiOrders.reduce((s, o) => s + o.total, 0),
      stripeCommission: stripe.reduce((s, o) => s + o.commission_amount, 0),
      cashPendingCommission: cashPending.reduce(
        (s, o) => s + o.commission_amount,
        0,
      ),
      cashBilledCommission: cashBilled.reduce(
        (s, o) => s + o.commission_amount,
        0,
      ),
      cashPendingCount: cashPending.length,
      totalOrders: aiOrders.length,
    };
  }, [aiOrders]);

  const filtered = useMemo(() => {
    return aiOrders.filter((o) => {
      if (sourceFilter !== "all" && o.source !== sourceFilter) return false;
      if (paymentFilter !== "all" && o.billing_status !== paymentFilter) return false;
      return true;
    });
  }, [aiOrders, sourceFilter, paymentFilter]);

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
        setFeedback(`Errore: ${result.error ?? "operazione non riuscita"}`);
        return;
      }
      setAiOrders((current) =>
        current.map((o) =>
          o.id === order.id
            ? {
                ...o,
                billing_status: "cash_billed" as const,
                application_fee_amount_cents: result.feeAmountCents ?? null,
                commission_amount: (result.feeAmountCents ?? 0) / 100,
              }
            : o,
        ),
      );
      setFeedback(`Commissione per ordine ${order.code} segnata come addebitata.`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-pork-red" />
          <p className="impact-title text-xs text-pork-red">Piattaforma</p>
        </div>
        <h1 className="headline text-4xl">Proventi AI</h1>
        <p className="mt-1 text-pork-ink/60">
          Ordini ricevuti tramite canali AI (telefono e WhatsApp). Commissione del 3% su ogni ordine.
        </p>
      </header>

      {feedback && (
        <div className="rounded-xl bg-pork-green/10 px-4 py-3 text-sm font-semibold text-pork-green">
          {feedback}
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

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          label="Volume AI"
          value={eur(summary.totalVolume)}
          sub={`${summary.totalOrders} ordini`}
        />
        <KpiCard
          icon={CreditCard}
          label="Stripe (auto)"
          value={eur(summary.stripeCommission)}
          sub="commissioni già incassate"
        />
        <KpiCard
          icon={AlertCircle}
          label="Cash da addebitare"
          value={eur(summary.cashPendingCommission)}
          sub={`${summary.cashPendingCount} ordini`}
          alert={summary.cashPendingCount > 0}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Cash addebitato"
          value={eur(summary.cashBilledCommission)}
          sub="registrato manualmente"
        />
      </div>

      {/* Filtri */}
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
          <FilterBtn active={paymentFilter === "all"} onClick={() => setPaymentFilter("all")}>
            Tutti
          </FilterBtn>
          <FilterBtn active={paymentFilter === "stripe"} onClick={() => setPaymentFilter("stripe")}>
            Stripe
          </FilterBtn>
          <FilterBtn active={paymentFilter === "cash_pending"} onClick={() => setPaymentFilter("cash_pending")}>
            Cash da addebitare
          </FilterBtn>
          <FilterBtn active={paymentFilter === "cash_billed"} onClick={() => setPaymentFilter("cash_billed")}>
            Cash addebitato
          </FilterBtn>
        </div>
      </div>

      {/* Tabella ordini AI */}
      <section className="space-y-3">
        <h2 className="headline text-2xl">Ordini AI</h2>

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

      {/* Statistiche ordini non-AI */}
      {nonAiStats.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="headline text-2xl">Ordini non-AI · Statistiche</h2>
            <p className="text-sm text-pork-ink/50">
              Nessuna commissione — tracciati a fini statistici.
            </p>
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
  const Icon = SOURCE_ICON[order.source];

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-pork-ink/10">
      <div className="flex flex-wrap items-center gap-4">
        {/* Canale */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
            AI_ORDER_SOURCE_COLORS[order.source],
          )}
        >
          <Icon size={10} />
          {AI_ORDER_SOURCE_LABELS[order.source]}
        </span>

        {/* Info ordine */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-pork-ink">{order.tenant_name}</span>
            <span className="text-xs text-pork-ink/40">·</span>
            <span className="font-mono text-xs text-pork-ink/60">{order.code}</span>
            {order.customer_name && (
              <>
                <span className="text-xs text-pork-ink/40">·</span>
                <span className="text-sm text-pork-ink/70">{order.customer_name}</span>
              </>
            )}
          </div>
          <p className="mt-0.5 text-xs text-pork-ink/45">{fmt(order.created_at)}</p>
        </div>

        {/* Importi */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-wide text-pork-ink/35">Ordine</p>
            <p className="text-sm font-bold tabular-nums">{eur(order.total)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-wide text-pork-ink/35">
              Commissione {Math.round(order.commission_rate * 100)}%
            </p>
            <p className="text-sm font-black tabular-nums text-pork-red">
              {eur(order.commission_amount)}
            </p>
          </div>
        </div>

        {/* Stato addebito */}
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
            AI_ORDER_BILLING_COLORS[order.billing_status],
          )}
        >
          {AI_ORDER_BILLING_LABELS[order.billing_status]}
        </span>

        {/* Azione */}
        {order.billing_status === "cash_pending" && (
          <button
            onClick={() => void onMarkBilled(order)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-white transition hover:bg-pork-ink/80 disabled:opacity-40"
          >
            <BadgeEuro size={12} />
            Segna addebitato
          </button>
        )}

        {order.billing_status === "cash_billed" && (
          <span className="inline-flex items-center gap-1 text-xs text-pork-green font-bold">
            <CheckCircle2 size={12} />
            Addebitato
          </span>
        )}
      </div>
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
        <ShoppingBag size={14} className="mt-1 shrink-0 text-pork-ink/30" />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-pork-ink/35">Volume</p>
          <p className="text-sm font-black tabular-nums">{eur(stat.total_volume)}</p>
        </div>
        <p className="text-xs text-pork-ink/40 font-semibold">{stat.order_count} ordini</p>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 ring-1",
        alert ? "ring-pork-mustard/50" : "ring-pork-ink/10",
      )}
    >
      <Icon size={18} className={cn("mb-3", alert ? "text-pork-mustard" : "text-pork-ink/40")} />
      <p className="text-xl font-black tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs font-bold text-pork-ink/70">{label}</p>
      <p className="text-[11px] text-pork-ink/40">{sub}</p>
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
