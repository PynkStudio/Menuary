"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Euro,
  Mail,
  Copy,
  MoreVertical,
  FileUp,
  Download,
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
      window.dispatchEvent(new Event("payments:refresh"));
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

  async function uploadInvoice(payment: PlatformPayment, formData: FormData) {
    setPaymentActionId(payment.id);
    setFeedback(null);
    try {
      formData.set("paymentId", payment.id);
      const res = await fetch("/api/admin/payments/invoice", {
        method: "POST",
        body: formData,
      });
      const result = (await res.json().catch(() => ({}))) as {
        error?: string;
        payment?: PlatformPayment;
      };
      if (!res.ok || !result.payment) {
        setFeedback(`Errore: ${result.error ?? "upload non riuscito"}`);
        return;
      }
      setPayments((current) =>
        current.map((item) => (item.id === payment.id ? result.payment! : item)),
      );
      setFeedback("Fattura caricata.");
      window.dispatchEvent(new Event("payments:refresh"));
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
          <SubscriptionRow
            key={sub.id}
            sub={sub}
            payments={payments.filter((p) => p.subscription_id === sub.id)}
            busyPaymentId={paymentActionId}
            onMarkPaid={markPaid}
            onCommunicatePayment={communicatePayment}
            onUploadInvoice={uploadInvoice}
          />
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
                  <PaymentActions
                    payment={p}
                    busy={paymentActionId === p.id}
                    onMarkPaid={markPaid}
                    onCommunicatePayment={communicatePayment}
                    onUploadInvoice={uploadInvoice}
                  />
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
  busyPaymentId,
  onMarkPaid,
  onCommunicatePayment,
  onUploadInvoice,
}: {
  sub: PlatformSubscription;
  payments: PlatformPayment[];
  busyPaymentId: string | null;
  onMarkPaid: (payment: PlatformPayment) => Promise<void>;
  onCommunicatePayment: (payment: PlatformPayment, send: boolean) => Promise<void>;
  onUploadInvoice: (payment: PlatformPayment, formData: FormData) => Promise<void>;
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
            <span className="font-bold">
              {sub.lead?.business_name ?? sub.lead_id}
            </span>
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

        <div className="flex flex-wrap justify-end gap-2">
          {payments.slice(0, 2).map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl bg-pork-ink/[0.03] px-2 py-1">
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-bold",
                  PAYMENT_STATUS_COLORS[p.status],
                )}
              >
                {eur(p.amount)} · {PAYMENT_STATUS_LABELS[p.status]}
              </span>
              {p.status === "paid" && !p.invoice_file_path && (
                <span className="rounded-full bg-pork-mustard/25 px-2 py-1 text-[10px] font-bold text-pork-ink">
                  fattura da caricare
                </span>
              )}
              <PaymentActions
                payment={p}
                busy={busyPaymentId === p.id}
                compact
                onMarkPaid={onMarkPaid}
                onCommunicatePayment={onCommunicatePayment}
                onUploadInvoice={onUploadInvoice}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentActions({
  payment,
  busy,
  compact,
  onMarkPaid,
  onCommunicatePayment,
  onUploadInvoice,
}: {
  payment: PlatformPayment;
  busy: boolean;
  compact?: boolean;
  onMarkPaid: (payment: PlatformPayment) => Promise<void>;
  onCommunicatePayment: (payment: PlatformPayment, send: boolean) => Promise<void>;
  onUploadInvoice: (payment: PlatformPayment, formData: FormData) => Promise<void>;
}) {
  const canCopyLink = payment.status === "pending" && (payment.payment_method === "bunq" || payment.payment_method === "carta");
  const invoiceUrl = payment.invoice_file_path
    ? `/api/admin/payments/invoice?paymentId=${encodeURIComponent(payment.id)}`
    : null;

  function submitInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onUploadInvoice(payment, new FormData(event.currentTarget));
  }

  return (
    <details className="relative shrink-0">
      <summary
        className={cn(
          "inline-flex cursor-pointer list-none items-center gap-1 rounded-full font-bold ring-1 ring-pork-ink/15 transition hover:bg-pork-ink hover:text-white",
          compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
          busy ? "pointer-events-none opacity-50" : "bg-white text-pork-ink",
        )}
      >
        <MoreVertical size={compact ? 12 : 14} />
        {!compact && "Azioni"}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl bg-white p-3 text-sm shadow-xl ring-1 ring-pork-ink/10">
        <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-pork-ink/45">
          Pagamento {payment.kind === "renewal" ? "rinnovo" : "iniziale"}
        </p>
        <div className="space-y-2">
          {payment.status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => void onMarkPaid(payment)}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-xl bg-pork-green px-3 py-2 text-left text-xs font-bold text-white disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> Conferma ricezione
              </button>
              {canCopyLink && (
                <button
                  type="button"
                  onClick={() => void onCommunicatePayment(payment, false)}
                  disabled={busy}
                  className="flex w-full items-center gap-2 rounded-xl bg-pork-ink/5 px-3 py-2 text-left text-xs font-bold text-pork-ink disabled:opacity-50"
                >
                  <Copy size={14} /> Copia link pagamento
                </button>
              )}
              <button
                type="button"
                onClick={() => void onCommunicatePayment(payment, true)}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-xl bg-pork-ink px-3 py-2 text-left text-xs font-bold text-white disabled:opacity-50"
              >
                <Mail size={14} /> Reinvia richiesta
              </button>
            </>
          )}
          {payment.status === "paid" && (
            <>
              {payment.invoice_file_path ? (
                <a
                  href={invoiceUrl ?? "#"}
                  className="flex w-full items-center gap-2 rounded-xl bg-pork-ink/5 px-3 py-2 text-xs font-bold text-pork-ink"
                >
                  <Download size={14} /> Scarica fattura
                </a>
              ) : (
                <form className="space-y-2 rounded-xl bg-pork-mustard/10 p-2" onSubmit={submitInvoice}>
                  <label className="block text-[11px] font-bold text-pork-ink/60">
                    Numero fattura
                    <input
                      name="invoiceNumber"
                      className="mt-1 w-full rounded-lg border border-pork-ink/10 px-2 py-1 text-xs"
                      placeholder={payment.invoice_number ?? "Es. FPA-2026-001"}
                    />
                  </label>
                  <label className="block text-[11px] font-bold text-pork-ink/60">
                    Data fattura
                    <input
                      name="invoiceDate"
                      type="date"
                      className="mt-1 w-full rounded-lg border border-pork-ink/10 px-2 py-1 text-xs"
                    />
                  </label>
                  <label className="block text-[11px] font-bold text-pork-ink/60">
                    PDF fattura
                    <input
                      name="file"
                      type="file"
                      accept="application/pdf"
                      required
                      className="mt-1 w-full text-xs"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-pork-ink px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    <FileUp size={14} /> Aggiungi fattura
                  </button>
                </form>
              )}
            </>
          )}
          {payment.status !== "pending" && payment.status !== "paid" && (
            <p className="rounded-xl bg-pork-ink/5 px-3 py-2 text-xs font-semibold text-pork-ink/55">
              Nessuna azione disponibile per questo stato.
            </p>
          )}
        </div>
      </div>
    </details>
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
