"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  CreditCard,
  Euro,
  Mail,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PlatformSubscription,
  PlatformPayment,
  SubscriptionStatus,
} from "@/lib/platform-crm-types";
import {
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/platform-crm-types";
import { calculateSubscriptionTotal } from "@/lib/platform-admin-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

function eur(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Componente ───────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: SubscriptionStatus | "all"; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "pending_payment", label: "Attesa pagamento" },
  { value: "trial", label: "Trial" },
  { value: "active", label: "Attivi" },
  { value: "suspended", label: "Sospesi" },
  { value: "cancelled", label: "Cancellati" },
];

export function PlatformSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<PlatformSubscription[]>([]);
  const [payments, setPayments] = useState<PlatformPayment[]>([]);
  const [activeFilter, setActiveFilter] = useState<SubscriptionStatus | "all">("all");
  const [paymentActionId, setPaymentActionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((data: { subscriptions?: PlatformSubscription[]; payments?: PlatformPayment[] }) => {
        if (cancelled) return;
        setSubscriptions(data.subscriptions ?? []);
        setPayments(data.payments ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const mrr = subscriptions
    .filter((s) => s.status === "active" || s.status === "trial")
    .reduce((sum, s) => {
      const price = calculateSubscriptionTotal(s) / (s.billing_cycle === "yearly" ? 12 : 1);
      return sum + price;
    }, 0);

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const pendingTotal = pendingPayments.reduce((s, p) => s + p.amount, 0);

  const expiringSoon = subscriptions.filter((s) => {
    const days = daysUntil(s.next_renewal_at);
    return (s.status === "trial" || s.status === "active") && days !== null && days <= 30;
  });

  const filtered = subscriptions.filter(
    (s) => activeFilter === "all" || s.status === activeFilter,
  );

  async function markPaid(payment: PlatformPayment) {
    setPaymentActionId(payment.id);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/payments/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id }),
      });
      const result = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFeedback(`Errore: ${result.error ?? "operazione non riuscita"}`);
        return;
      }
      setPayments((current) =>
        current.map((item) =>
          item.id === payment.id ? { ...item, status: "paid" as const, paid_at: new Date().toISOString() } : item,
        ),
      );
      setFeedback("Pagamento segnato come pagato.");
    } finally {
      setPaymentActionId(null);
    }
  }

  async function communicatePayment(payment: PlatformPayment, send: boolean) {
    setPaymentActionId(payment.id);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/payments/communicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id, send }),
      });
      const result = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string | null;
        checkoutUrl?: string | null;
      };
      if (!res.ok) {
        setFeedback(`Errore: ${result.error ?? "operazione non riuscita"}`);
        return;
      }
      if (result.url) {
        setPayments((current) =>
          current.map((item) =>
            item.id === payment.id
              ? {
                  ...item,
                  bunq_payment_url:
                    item.payment_method === "bunq" ? result.url ?? null : item.bunq_payment_url,
                  stripe_payment_link:
                    item.payment_method === "carta" ? result.url ?? null : item.stripe_payment_link,
                }
              : item,
          ),
        );
      }
      if (!send && result.checkoutUrl) {
        await navigator.clipboard.writeText(result.checkoutUrl);
        setFeedback("Link pagamento copiato.");
      } else {
        setFeedback(send ? "Email pagamento inviata." : "Questo metodo non prevede un link.");
      }
    } finally {
      setPaymentActionId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="impact-title text-xs text-pork-red">Piattaforma</p>
        <h1 className="headline text-4xl">Abbonamenti</h1>
        <p className="mt-1 text-pork-ink/60">
          Panoramica rinnovi, scadenze e pagamenti.
        </p>
      </header>
      {feedback && (
        <div className="rounded-xl bg-pork-green/10 px-4 py-3 text-sm font-semibold text-pork-green">
          {feedback}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={Euro}
          label="MRR stimato"
          value={eur(mrr)}
          sub="abbonamenti attivi + trial"
        />
        <KpiCard
          icon={CreditCard}
          label="Pagamenti attesi"
          value={eur(pendingTotal)}
          sub={`${pendingPayments.length} in sospeso`}
          alert={pendingPayments.length > 0}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Scadono a breve"
          value={String(expiringSoon.length)}
          sub="entro 30 giorni"
          alert={expiringSoon.length > 0}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Abbonamenti attivi"
          value={String(subscriptions.filter((s) => s.status === "active").length)}
          sub="stato: active"
        />
      </div>

      {/* Alert scadenze imminenti */}
      {expiringSoon.length > 0 && (
        <div className="rounded-2xl bg-pork-mustard/15 p-4">
          <div className="flex items-center gap-2 font-bold text-pork-ink">
            <AlertTriangle size={16} className="text-pork-mustard" />
            Rinnovi imminenti
          </div>
          <div className="mt-3 space-y-2">
            {expiringSoon.map((s) => {
              const days = daysUntil(s.next_renewal_at);
              return (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{s.lead?.business_name}</span>
                  <span className="text-pork-ink/60">
                    {s.package?.name} · rinnova {fmt(s.next_renewal_at)}
                    {days !== null && days <= 7 && (
                      <span className="ml-2 font-bold text-pork-red">({days}gg)</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtri */}
      <div className="flex gap-1 rounded-2xl bg-pork-ink/5 p-1 w-fit">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold transition",
              activeFilter === f.value
                ? "bg-pork-ink text-pork-cream"
                : "text-pork-ink/60 hover:text-pork-ink",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabella abbonamenti */}
      <div className="space-y-3">
        {filtered.map((sub) => (
          <SubscriptionRow key={sub.id} sub={sub} payments={payments.filter((p) => p.subscription_id === sub.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
            <p className="text-pork-ink/50">Nessun abbonamento trovato.</p>
          </div>
        )}
      </div>

      {/* Sezione pagamenti in sospeso */}
      {pendingPayments.length > 0 && (
        <section>
          <h2 className="headline mb-4 text-2xl">Pagamenti in attesa</h2>
          <div className="space-y-3">
            {pendingPayments.map((p) => {
              const sub = subscriptions.find((s) => s.id === p.subscription_id);
              const days = daysUntil(p.due_date);
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-pork-ink/10"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">{sub?.lead?.business_name ?? "—"}</p>
                    <p className="mt-0.5 text-sm text-pork-ink/55">
                      {p.kind === "renewal" ? "Rinnovo" : "Primo pagamento"} · {sub?.package?.name} · {eur(p.amount)} · scade {fmt(p.due_date)}
                      {days !== null && days <= 0 && (
                        <span className="ml-2 font-bold text-pork-red">SCADUTO</span>
                      )}
                      {days !== null && days > 0 && days <= 7 && (
                        <span className="ml-2 font-bold text-pork-mustard">({days}gg)</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                      PAYMENT_STATUS_COLORS[p.status],
                    )}
                  >
                    {PAYMENT_STATUS_LABELS[p.status]}
                  </span>
                  <button
                    type="button"
                    onClick={() => markPaid(p)}
                    disabled={paymentActionId === p.id}
                    className="shrink-0 rounded-full bg-pork-green px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Segna pagato
                  </button>
                  <button
                    type="button"
                    onClick={() => communicatePayment(p, true)}
                    disabled={paymentActionId === p.id}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    <Mail size={12} /> Rimanda
                  </button>
                  {(p.payment_method === "bunq" || p.payment_method === "carta") && (
                    <button
                      type="button"
                      onClick={() => communicatePayment(p, false)}
                      disabled={paymentActionId === p.id}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-pork-ink ring-1 ring-pork-ink/15 disabled:opacity-50"
                    >
                      <Copy size={12} /> Copia link
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Riga abbonamento ─────────────────────────────────────────────────────────

function SubscriptionRow({
  sub,
  payments,
}: {
  sub: PlatformSubscription;
  payments: PlatformPayment[];
}) {
  const effectivePrice =
    sub.price_override ??
    calculateSubscriptionTotal(sub);

  const days = daysUntil(sub.next_renewal_at);
  const expiresWarn = days !== null && days <= 30 && (sub.status === "trial" || sub.status === "active");

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/crm/${sub.lead_id}`}
              className="font-bold hover:text-pork-red"
            >
              {sub.lead?.business_name ?? sub.lead_id}
            </Link>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                SUBSCRIPTION_STATUS_COLORS[sub.status],
              )}
            >
              {SUBSCRIPTION_STATUS_LABELS[sub.status]}
            </span>
            {expiresWarn && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pork-mustard/20 px-2.5 py-0.5 text-[10px] font-bold text-pork-ink">
                <Clock size={10} /> {days}gg
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-pork-ink/55">
            <span>{sub.package?.name}</span>
            <span>{eur(effectivePrice)}/{sub.billing_cycle === "monthly" ? "mese" : "anno"}</span>
            <span>Rinnovo: {fmt(sub.next_renewal_at)}</span>
            {sub.trial_ends_at && <span>Trial fino al: {fmt(sub.trial_ends_at)}</span>}
          </div>
        </div>

        {/* Pagamenti rapidi */}
        <div className="flex flex-wrap gap-2">
          {payments.slice(0, 2).map((p) => (
            <span
              key={p.id}
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-bold",
                PAYMENT_STATUS_COLORS[p.status],
              )}
            >
              {eur(p.amount)} · {PAYMENT_STATUS_LABELS[p.status]}
            </span>
          ))}
        </div>

        <Link
          href={`/admin/crm/${sub.lead_id}`}
          className="shrink-0 text-pork-ink/30 hover:text-pork-ink"
        >
          <ArrowRight size={16} />
        </Link>
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
      <p className="text-xl font-black">{value}</p>
      <p className="mt-0.5 text-xs font-bold text-pork-ink/70">{label}</p>
      <p className="text-[11px] text-pork-ink/40">{sub}</p>
    </div>
  );
}
