"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeEuro,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommissionStatus, PlatformCommission, PlatformLead } from "@/lib/platform-crm-types";
import {
  COMMISSION_STATUS_COLORS,
  COMMISSION_STATUS_LABELS,
} from "@/lib/platform-crm-types";
import {
  PLATFORM_COMMISSIONS,
  PLATFORM_COMMISSION_RULES,
  calculateCommissionAmount,
} from "@/lib/platform-admin-data";
import { listDerivedSubscriptions } from "@/lib/contracts/contract-to-subscription";

const STATUS_FILTERS: { value: CommissionStatus | "all"; label: string }[] = [
  { value: "all", label: "Tutte" },
  { value: "pending", label: "Da approvare" },
  { value: "approved", label: "Approvate" },
  { value: "paid", label: "Liquidate" },
];

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

export function PlatformCommissionsPage() {
  const [commissions, setCommissions] = useState<PlatformCommission[]>(PLATFORM_COMMISSIONS);
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const derived = listDerivedSubscriptions();
    if (!derived.length) return;

    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then((data: { leads?: PlatformLead[] }) => {
        const leads = data.leads ?? [];
        const closingRule = PLATFORM_COMMISSION_RULES.find((r) => r.role === "venditore")!;
        const leadInsertRule = PLATFORM_COMMISSION_RULES.find((r) => r.role === "lead_inserter")!;

        const derivedCommissions = derived.flatMap((sub) => {
          const lead = leads.find((l) => l.id === sub.lead_id);
          if (!lead) return [];

          const recurring = sub.price_override ?? 0;
          const firstPaymentBase = (sub.setup_amount ?? 0) + recurring;

          const closing: PlatformCommission = {
            id: `comm-d-${sub.id}`,
            lead_id: lead.id,
            tenant_id: lead.tenant_id,
            subscription_id: sub.id,
            payment_id: `pay-d-${sub.id}`,
            seller_id: lead.sales_owner_id ?? "sales-unassigned",
            seller_name: lead.sales_owner_name ?? "Venditore non assegnato",
            seller_role: "venditore",
            commission_kind: "closing",
            business_name: lead.business_name,
            package_name: sub.package?.name ?? "Piano personalizzato",
            billing_cycle: sub.billing_cycle,
            recurring_amount: recurring,
            setup_amount: sub.setup_amount ?? 0,
            first_payment_amount: firstPaymentBase,
            commission_rate: closingRule.commission_rate,
            commission_amount: calculateCommissionAmount(firstPaymentBase, closingRule.commission_rate),
            status: "pending",
            closed_at: lead.converted_at ?? sub.started_at,
            paid_at: null,
          };

          if (!lead.created_by_id) return [closing];

          const leadInsert: PlatformCommission = {
            ...closing,
            id: `comm-d-li-${sub.id}`,
            seller_id: lead.created_by_id,
            seller_name: lead.created_by_name ?? "Inseritore lead",
            seller_role: "lead_inserter",
            commission_kind: "lead_insert",
            commission_rate: leadInsertRule.commission_rate,
            commission_amount: calculateCommissionAmount(firstPaymentBase, leadInsertRule.commission_rate),
          };

          return [closing, leadInsert];
        });

        if (derivedCommissions.length) {
          setCommissions((prev) => [...derivedCommissions, ...prev]);
        }
      })
      .catch(() => null);
  }, []);

  const sellerRate = PLATFORM_COMMISSION_RULES.find((rule) => rule.role === "venditore")?.commission_rate ?? 30;
  const leadInsertRate = PLATFORM_COMMISSION_RULES.find((rule) => rule.role === "lead_inserter")?.commission_rate ?? 10;

  const totals = useMemo(() => {
    const payable = commissions.filter((item) => item.status !== "paid");
    const firstPaymentsBySubscription = new Map<string, number>();
    commissions.forEach((item) => {
      if (!firstPaymentsBySubscription.has(item.subscription_id)) {
        firstPaymentsBySubscription.set(item.subscription_id, item.first_payment_amount);
      }
    });
    return {
      soldTenants: new Set(commissions.map((item) => item.tenant_id).filter(Boolean)).size,
      firstPayments: [...firstPaymentsBySubscription.values()].reduce((sum, amount) => sum + amount, 0),
      pending: payable.reduce((sum, item) => sum + item.commission_amount, 0),
      paid: commissions.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.commission_amount, 0),
    };
  }, [commissions]);

  const filtered = commissions.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesSearch =
      !q ||
      item.business_name.toLowerCase().includes(q) ||
      item.seller_name.toLowerCase().includes(q) ||
      item.package_name.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  function markPaid(id: string) {
    setCommissions((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: "paid", paid_at: new Date().toISOString() } : item,
      ),
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Piattaforma</p>
          <h1 className="headline text-4xl">Provvigioni</h1>
          <p className="mt-1 max-w-3xl text-pork-ink/60">
            Tenant venduti, primo pagamento e commissioni maturate dai venditori.
          </p>
        </div>
        <Link
          href="/admin/utenti"
          className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/70 transition hover:border-pork-red/30 hover:text-pork-red"
        >
          <SlidersHorizontal size={15} />
          Percentuali ruoli
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={CheckCircle2} label="Tenant venduti" value={String(totals.soldTenants)} sub="lead convertiti in tenant" />
        <Kpi icon={CreditCard} label="Primi pagamenti" value={eur(totals.firstPayments)} sub="base commerciale tracciata" />
        <Kpi icon={BadgeEuro} label="Da liquidare" value={eur(totals.pending)} sub="pending + approvate" tone="text-pork-red" />
        <Kpi icon={UserRound} label="Default chiusura" value={`${sellerRate}%`} sub={`inserimento lead ${leadInsertRate}%`} />
      </div>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-black text-pork-ink">Regola di calcolo</p>
            <p className="mt-1 text-sm leading-relaxed text-pork-ink/60">
              La base provvigionale è sempre il primo pagamento commerciale: setup più canone mensile oppure setup più canone annuale.
              In caso di rateizzazione si usa comunque l&apos;importo intero concordato. Chi inserisce il lead prende il 10%; chi chiude prende il 30%.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <RuleBox label="Mensile" value="setup + canone mese" />
            <RuleBox label="Annuale / rate" value="setup + canone annuo" />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex w-fit gap-1 rounded-2xl bg-pork-ink/5 p-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-bold transition",
                statusFilter === filter.value
                  ? "bg-pork-ink text-pork-cream"
                  : "text-pork-ink/60 hover:text-pork-ink",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-60 flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pork-ink/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-pork-ink/10 bg-white py-2.5 pl-9 pr-4 text-sm placeholder-pork-ink/35 focus:outline-none focus:ring-2 focus:ring-pork-red/30"
            placeholder="Cerca tenant, venditore o piano"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
            <p className="text-pork-ink/50">Nessuna provvigione trovata.</p>
          </div>
        )}
        {filtered.map((item) => (
          <CommissionRow key={item.id} item={item} onMarkPaid={markPaid} />
        ))}
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "text-pork-ink",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10">
      <Icon size={18} className={cn("mb-3", tone)} />
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs font-bold text-pork-ink/50">{label}</p>
      <p className="mt-2 text-xs text-pork-ink/45">{sub}</p>
    </div>
  );
}

function RuleBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-pork-cream p-4">
      <p className="text-[10px] font-black uppercase tracking-wide text-pork-ink/40">{label}</p>
      <p className="mt-1 text-sm font-black text-pork-ink">{value}</p>
    </div>
  );
}

function CommissionRow({
  item,
  onMarkPaid,
}: {
  item: PlatformCommission;
  onMarkPaid: (id: string) => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/crm/${item.lead_id}`} className="font-black text-pork-ink hover:text-pork-red">
              {item.business_name}
            </Link>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                COMMISSION_STATUS_COLORS[item.status],
              )}
            >
              {COMMISSION_STATUS_LABELS[item.status]}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-pork-ink/50">
            <span className="inline-flex items-center gap-1">
              <UserRound size={12} />
              {item.seller_name} · {item.commission_kind === "lead_insert" ? "Inserimento lead" : "Chiusura"}
            </span>
            <span>{item.package_name}</span>
            <span>{item.billing_cycle === "monthly" ? "Mensile" : "Annuale"}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} />
              {fmt(item.closed_at)}
            </span>
          </div>
        </div>
        <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[520px] sm:grid-cols-5">
          <Metric label="Canone" value={eur(item.recurring_amount)} />
          <Metric label="Setup" value={eur(item.setup_amount)} />
          <Metric label="Base" value={eur(item.first_payment_amount)} />
          <Metric label="%" value={`${item.commission_rate}%`} />
          <Metric label="Provvigione" value={eur(item.commission_amount)} strong />
        </div>
        {item.status !== "paid" && (
          <button
            onClick={() => onMarkPaid(item.id)}
            className="rounded-full bg-pork-green px-4 py-2 text-sm font-bold text-white transition hover:bg-pork-green/90"
          >
            Liquida
          </button>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wide text-pork-ink/35">{label}</p>
      <p className={cn("mt-0.5 text-sm tabular-nums", strong ? "font-black text-pork-red" : "font-bold text-pork-ink")}>
        {value}
      </p>
    </div>
  );
}
