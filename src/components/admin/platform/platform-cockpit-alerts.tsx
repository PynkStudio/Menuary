"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, FileSignature, PauseOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentAlert = {
  paymentId: string;
  leadId: string;
  businessName: string;
  amount: number;
  dueDate: string | null;
  kind: string;
};
type SignatureAlert = {
  contractId: string;
  numero: string;
  businessName: string;
  sentAt: string | null;
  leadId: string | null;
  daysWaiting: number | null;
};
type SuspendedAlert = {
  subscriptionId: string;
  leadId: string;
  tenantId: string | null;
  businessName: string;
};
type Cockpit = {
  overdue: PaymentAlert[];
  dueSoon: PaymentAlert[];
  awaitingSignature: SignatureAlert[];
  suspended: SuspendedAlert[];
};

function eur(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}
function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

export function PlatformCockpitAlerts() {
  const [data, setData] = useState<Cockpit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/cockpit")
      .then((r) => r.json())
      .then((d: Cockpit) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-pork-ink/40">Carico gli alert…</p>;
  }
  if (!data) return null;

  const total =
    data.overdue.length + data.dueSoon.length + data.awaitingSignature.length + data.suspended.length;

  if (total === 0) {
    return (
      <div className="rounded-3xl bg-pork-green/10 p-5 text-sm font-semibold text-pork-green ring-1 ring-pork-green/20">
        Tutto in regola: nessun pagamento scaduto, contratto in attesa o tenant sospeso.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="impact-title text-sm text-pork-ink/70">Da gestire</p>
        <p className="mt-1 text-sm text-pork-ink/55">Alert proattivi su pagamenti, contratti e tenant.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AlertGroup
          icon={<AlertTriangle size={16} />}
          tone="red"
          title="Pagamenti scaduti"
          count={data.overdue.length}
          empty="Nessuno"
        >
          {data.overdue.map((p) => (
            <Row
              key={p.paymentId}
              href={`/admin/crm/${p.leadId}`}
              left={p.businessName}
              right={`${eur(p.amount)} · scad. ${fmt(p.dueDate)}`}
              danger
            />
          ))}
        </AlertGroup>

        <AlertGroup
          icon={<PauseOctagon size={16} />}
          tone="red"
          title="Tenant sospesi"
          count={data.suspended.length}
          empty="Nessuno"
        >
          {data.suspended.map((s) => (
            <Row key={s.subscriptionId} href={`/admin/crm/${s.leadId}`} left={s.businessName} right="offline" danger />
          ))}
        </AlertGroup>

        <AlertGroup
          icon={<Clock size={16} />}
          tone="amber"
          title="Pagamenti in scadenza (7gg)"
          count={data.dueSoon.length}
          empty="Nessuno"
        >
          {data.dueSoon.map((p) => (
            <Row
              key={p.paymentId}
              href={`/admin/crm/${p.leadId}`}
              left={p.businessName}
              right={`${eur(p.amount)} · ${fmt(p.dueDate)}`}
            />
          ))}
        </AlertGroup>

        <AlertGroup
          icon={<FileSignature size={16} />}
          tone="info"
          title="Contratti in attesa di firma"
          count={data.awaitingSignature.length}
          empty="Nessuno"
        >
          {data.awaitingSignature.map((c) => (
            <Row
              key={c.contractId}
              href={`/admin/contratti/${c.contractId}`}
              left={c.businessName}
              right={c.daysWaiting !== null ? `${c.numero} · ${c.daysWaiting}gg` : c.numero}
            />
          ))}
        </AlertGroup>
      </div>
    </section>
  );
}

const TONE_RING: Record<string, string> = {
  red: "ring-pork-red/20",
  amber: "ring-amber-200",
  info: "ring-blue-200",
};
const TONE_BADGE: Record<string, string> = {
  red: "bg-pork-red/10 text-pork-red",
  amber: "bg-amber-100 text-amber-800",
  info: "bg-blue-50 text-blue-700",
};

function AlertGroup({
  icon,
  tone,
  title,
  count,
  empty,
  children,
}: {
  icon: React.ReactNode;
  tone: "red" | "amber" | "info";
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-3xl bg-white p-5 ring-1", TONE_RING[tone])}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-pork-ink">
          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full", TONE_BADGE[tone])}>
            {icon}
          </span>
          {title}
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-black", TONE_BADGE[tone])}>{count}</span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-pork-ink/40">{empty}</p>
      ) : (
        <div className="space-y-1.5">{children}</div>
      )}
    </div>
  );
}

function Row({
  href,
  left,
  right,
  danger,
}: {
  href: string;
  left: string;
  right: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-pork-ink/5"
    >
      <span className="min-w-0 truncate font-semibold text-pork-ink">{left}</span>
      <span className={cn("shrink-0 text-xs font-bold", danger ? "text-pork-red" : "text-pork-ink/55")}>{right}</span>
    </Link>
  );
}
