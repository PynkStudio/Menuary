"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Phone,
  Mail,
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { PlatformLead, LeadStatus } from "@/lib/platform-crm-types";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  SOURCE_LABELS,
} from "@/lib/platform-crm-types";
import { cn } from "@/lib/utils";

// ─── Dati demo (sostituire con fetch Supabase) ────────────────────────────────

const MOCK_LEADS: PlatformLead[] = [
  {
    id: "1",
    business_name: "Osteria della Piazza",
    business_slug: null,
    business_vertical: "food",
    contact_name: "Marco Ferri",
    contact_email: "marco@osteriadellapiazza.it",
    contact_phone: "+39 347 1234567",
    address: "Via Roma 12",
    city: "Bologna",
    province: "BO",
    postal_code: "40121",
    country: "IT",
    billing_name: null,
    billing_vat: null,
    billing_cf: null,
    billing_address: null,
    billing_city: null,
    billing_province: null,
    billing_postal_code: null,
    billing_sdi: null,
    billing_pec: null,
    status: "prospect",
    source: "form_web",
    notes: "Interessato al pacchetto Growth. Richiamarlo la prossima settimana.",
    tenant_id: null,
    converted_at: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-10T15:30:00Z",
  },
  {
    id: "2",
    business_name: "BePork",
    business_slug: "bepork",
    business_vertical: "food",
    contact_name: "Luca Bianchi",
    contact_email: "luca@bepork.it",
    contact_phone: "+39 338 9876543",
    address: "Via Veneto 5",
    city: "Roma",
    province: "RM",
    postal_code: "00187",
    country: "IT",
    billing_name: "BePork S.r.l.",
    billing_vat: "IT12345678901",
    billing_cf: "12345678901",
    billing_address: "Via Veneto 5",
    billing_city: "Roma",
    billing_province: "RM",
    billing_postal_code: "00187",
    billing_sdi: "M5UXCR1",
    billing_pec: "bepork@pec.it",
    status: "active",
    source: "diretto",
    notes: null,
    tenant_id: "bepork",
    converted_at: "2026-02-01T00:00:00Z",
    created_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-05-01T12:00:00Z",
  },
  {
    id: "3",
    business_name: "Pizzeria Napoli Verace",
    business_slug: null,
    business_vertical: "food",
    contact_name: "Anna Esposito",
    contact_email: "anna@napolinerace.it",
    contact_phone: "+39 081 5556789",
    address: "Corso Umberto 34",
    city: "Napoli",
    province: "NA",
    postal_code: "80138",
    country: "IT",
    billing_name: null,
    billing_vat: null,
    billing_cf: null,
    billing_address: null,
    billing_city: null,
    billing_province: null,
    billing_postal_code: null,
    billing_sdi: null,
    billing_pec: null,
    status: "lead",
    source: "evento",
    notes: "Conosciuta al Sigep 2026.",
    tenant_id: null,
    converted_at: null,
    created_at: "2026-05-12T14:00:00Z",
    updated_at: "2026-05-12T14:00:00Z",
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

const STATUS_TABS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Attivi" },
  { value: "churned", label: "Churned" },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PlatformCrmPage() {
  const [leads] = useState<PlatformLead[]>(MOCK_LEADS);
  const [activeTab, setActiveTab] = useState<LeadStatus | "all">("all");
  const [query, setQuery] = useState("");

  const counts = {
    all: leads.length,
    lead: leads.filter((l) => l.status === "lead").length,
    prospect: leads.filter((l) => l.status === "prospect").length,
    active: leads.filter((l) => l.status === "active").length,
    churned: leads.filter((l) => l.status === "churned").length,
  };

  const filtered = leads.filter((l) => {
    const matchTab = activeTab === "all" || l.status === activeTab;
    const q = query.toLowerCase();
    const matchSearch =
      !q ||
      l.business_name.toLowerCase().includes(q) ||
      l.contact_name.toLowerCase().includes(q) ||
      l.contact_email.toLowerCase().includes(q) ||
      (l.city ?? "").toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Piattaforma</p>
          <h1 className="headline text-4xl">CRM Lead</h1>
          <p className="mt-1 text-pork-ink/60">
            Gestisci il pipeline commerciale: lead, prospect e tenant attivi.
          </p>
        </div>
        <Link
          href="/admin/crm/nuovo"
          className="inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-2.5 font-bold text-white transition hover:bg-pork-red/90"
        >
          <Plus size={16} /> Nuovo lead
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users} label="Totale lead" value={counts.all} />
        <StatCard icon={TrendingUp} label="Prospect" value={counts.prospect} color="text-pork-mustard" />
        <StatCard icon={CheckCircle2} label="Tenant attivi" value={counts.active} color="text-pork-green" />
        <StatCard icon={XCircle} label="Churned" value={counts.churned} color="text-pork-red" />
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 rounded-2xl bg-pork-ink/5 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-bold transition",
                activeTab === tab.value
                  ? "bg-pork-ink text-pork-cream"
                  : "text-pork-ink/60 hover:text-pork-ink",
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">
                {counts[tab.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pork-ink/40" />
          <input
            type="text"
            placeholder="Cerca per nome, email, città…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-pork-ink/10 bg-white py-2.5 pl-9 pr-4 text-sm placeholder-pork-ink/35 focus:outline-none focus:ring-2 focus:ring-pork-red/30"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
            <p className="text-pork-ink/50">Nessun lead trovato.</p>
          </div>
        )}
        {filtered.map((lead) => (
          <LeadRow key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-pork-ink",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10">
      <Icon size={18} className={cn("mb-3", color)} />
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-0.5 text-xs text-pork-ink/55">{label}</p>
    </div>
  );
}

function LeadRow({ lead }: { lead: PlatformLead }) {
  return (
    <Link
      href={`/admin/crm/${lead.id}`}
      className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10 transition hover:ring-pork-red/30"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Building2 size={15} className="shrink-0 text-pork-ink/40" />
          <span className="font-bold">{lead.business_name}</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
              LEAD_STATUS_COLORS[lead.status],
            )}
          >
            {LEAD_STATUS_LABELS[lead.status]}
          </span>
          {lead.source && (
            <span className="rounded-full bg-pork-ink/5 px-2.5 py-0.5 text-[10px] text-pork-ink/50">
              {SOURCE_LABELS[lead.source]}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-pork-ink/60">
          <span>{lead.contact_name}</span>
          {lead.contact_email && (
            <span className="inline-flex items-center gap-1">
              <Mail size={12} />
              {lead.contact_email}
            </span>
          )}
          {lead.contact_phone && (
            <span className="inline-flex items-center gap-1">
              <Phone size={12} />
              {lead.contact_phone}
            </span>
          )}
          {lead.city && (
            <span>
              {lead.city} {lead.province && `(${lead.province})`}
            </span>
          )}
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-1 text-right sm:flex">
        <p className="text-xs text-pork-ink/40">
          Aggiornato {fmt(lead.updated_at)}
        </p>
        {lead.converted_at && (
          <p className="text-xs text-pork-green">
            Attivato {fmt(lead.converted_at)}
          </p>
        )}
      </div>

      <ArrowRight size={16} className="shrink-0 text-pork-ink/30" />
    </Link>
  );
}
