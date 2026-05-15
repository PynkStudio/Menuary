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
  UtensilsCrossed,
  Briefcase,
} from "lucide-react";
import type { PlatformLead, LeadStatus, LeadVertical } from "@/lib/platform-crm-types";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  SOURCE_LABELS,
  VERTICAL_BADGE_CLASSES,
  VERTICAL_DOT_CLASSES,
  VERTICAL_SHORT_LABELS,
} from "@/lib/platform-crm-types";
import { cn } from "@/lib/utils";

// ─── Dati demo (sostituire con fetch Supabase) ────────────────────────────────

const MOCK_LEADS: PlatformLead[] = [
  // ── Menuary · Food ──
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
    billing_name: null, billing_vat: null, billing_cf: null,
    billing_address: null, billing_city: null, billing_province: null,
    billing_postal_code: null, billing_sdi: null, billing_pec: null,
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
    contact_email: "anna@napoliverace.it",
    contact_phone: "+39 081 5556789",
    address: "Corso Umberto 34",
    city: "Napoli",
    province: "NA",
    postal_code: "80138",
    country: "IT",
    billing_name: null, billing_vat: null, billing_cf: null,
    billing_address: null, billing_city: null, billing_province: null,
    billing_postal_code: null, billing_sdi: null, billing_pec: null,
    status: "lead",
    source: "evento",
    notes: "Conosciuta al Sigep 2026.",
    tenant_id: null,
    converted_at: null,
    created_at: "2026-05-12T14:00:00Z",
    updated_at: "2026-05-12T14:00:00Z",
  },
  // ── Bizery · Services ──
  {
    id: "4",
    business_name: "Studio Legale Bruni",
    business_slug: null,
    business_vertical: "services",
    contact_name: "Silvia Bruni",
    contact_email: "silvia@studiobrunilegal.it",
    contact_phone: "+39 02 8901234",
    address: "Via Torino 88",
    city: "Milano",
    province: "MI",
    postal_code: "20123",
    country: "IT",
    billing_name: null, billing_vat: null, billing_cf: null,
    billing_address: null, billing_city: null, billing_province: null,
    billing_postal_code: null, billing_sdi: null, billing_pec: null,
    status: "prospect",
    source: "referral",
    notes: "Vuole un sito professionale con form appuntamenti. Trial in attesa.",
    tenant_id: null,
    converted_at: null,
    created_at: "2026-05-08T11:00:00Z",
    updated_at: "2026-05-13T09:15:00Z",
  },
  {
    id: "5",
    business_name: "Centro Benessere Aurea",
    business_slug: "aurea",
    business_vertical: "services",
    contact_name: "Chiara Galli",
    contact_email: "chiara@centroaurea.it",
    contact_phone: "+39 055 2233445",
    address: "Via dei Servi 21",
    city: "Firenze",
    province: "FI",
    postal_code: "50122",
    country: "IT",
    billing_name: "Aurea S.r.l.",
    billing_vat: "IT09876543210",
    billing_cf: "09876543210",
    billing_address: "Via dei Servi 21",
    billing_city: "Firenze",
    billing_province: "FI",
    billing_postal_code: "50122",
    billing_sdi: "A4C7F9B",
    billing_pec: "aurea@pec.it",
    status: "active",
    source: "form_web",
    notes: null,
    tenant_id: "aurea",
    converted_at: "2026-04-10T00:00:00Z",
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-05-10T08:00:00Z",
  },
  {
    id: "6",
    business_name: "Officina Bianchi Srl",
    business_slug: null,
    business_vertical: "services",
    contact_name: "Roberto Bianchi",
    contact_email: "r.bianchi@officinabianchi.it",
    contact_phone: null,
    address: "Via Industriale 3",
    city: "Torino",
    province: "TO",
    postal_code: "10100",
    country: "IT",
    billing_name: null, billing_vat: null, billing_cf: null,
    billing_address: null, billing_city: null, billing_province: null,
    billing_postal_code: null, billing_sdi: null, billing_pec: null,
    status: "lead",
    source: "altro",
    notes: null,
    tenant_id: null,
    converted_at: null,
    created_at: "2026-05-14T16:30:00Z",
    updated_at: "2026-05-14T16:30:00Z",
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

const VERTICAL_FILTERS: { value: LeadVertical | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Tutti i vertical", icon: Users },
  { value: "food", label: "Menuary · Food", icon: UtensilsCrossed },
  { value: "services", label: "Bizery · Services", icon: Briefcase },
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
  const [verticalFilter, setVerticalFilter] = useState<LeadVertical | "all">("all");
  const [query, setQuery] = useState("");

  const foodLeads = leads.filter((l) => l.business_vertical === "food");
  const servicesLeads = leads.filter((l) => l.business_vertical === "services");

  const counts = {
    all: leads.length,
    lead: leads.filter((l) => l.status === "lead").length,
    prospect: leads.filter((l) => l.status === "prospect").length,
    active: leads.filter((l) => l.status === "active").length,
    churned: leads.filter((l) => l.status === "churned").length,
  };

  const filtered = leads.filter((l) => {
    const matchTab = activeTab === "all" || l.status === activeTab;
    const matchVertical = verticalFilter === "all" || l.business_vertical === verticalFilter;
    const q = query.toLowerCase();
    const matchSearch =
      !q ||
      l.business_name.toLowerCase().includes(q) ||
      l.contact_name.toLowerCase().includes(q) ||
      l.contact_email.toLowerCase().includes(q) ||
      (l.city ?? "").toLowerCase().includes(q);
    return matchTab && matchVertical && matchSearch;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Piattaforma</p>
          <h1 className="headline text-4xl">CRM Lead</h1>
          <p className="mt-1 text-pork-ink/60">
            Pipeline commerciale: lead, prospect e tenant attivi di tutti i verticali.
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

      {/* Split verticali */}
      <div className="grid grid-cols-2 gap-4">
        <VerticalSplitCard
          icon={UtensilsCrossed}
          label="Menuary · Food"
          total={foodLeads.length}
          active={foodLeads.filter((l) => l.status === "active").length}
          badgeClass="bg-amber-100 text-amber-800"
          dotClass="bg-amber-500"
          onClick={() => setVerticalFilter(verticalFilter === "food" ? "all" : "food")}
          selected={verticalFilter === "food"}
        />
        <VerticalSplitCard
          icon={Briefcase}
          label="Bizery · Services"
          total={servicesLeads.length}
          active={servicesLeads.filter((l) => l.status === "active").length}
          badgeClass="bg-blue-100 text-blue-700"
          dotClass="bg-blue-500"
          onClick={() => setVerticalFilter(verticalFilter === "services" ? "all" : "services")}
          selected={verticalFilter === "services"}
        />
      </div>

      {/* Filtri */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Filtro status */}
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
              <span className="ml-1.5 text-xs opacity-60">{counts[tab.value]}</span>
            </button>
          ))}
        </div>

        {/* Filtro verticale */}
        <div className="flex gap-1 rounded-2xl bg-pork-ink/5 p-1">
          {VERTICAL_FILTERS.map((vf) => {
            const Icon = vf.icon;
            return (
              <button
                key={vf.value}
                onClick={() => setVerticalFilter(vf.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition",
                  verticalFilter === vf.value
                    ? vf.value === "food"
                      ? "bg-amber-500 text-white"
                      : vf.value === "services"
                        ? "bg-blue-600 text-white"
                        : "bg-pork-ink text-pork-cream"
                    : "text-pork-ink/60 hover:text-pork-ink",
                )}
              >
                <Icon size={13} />
                {vf.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
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

// ─── Stat card generica ───────────────────────────────────────────────────────

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

// ─── Card split per verticale (cliccabile come filtro rapido) ─────────────────

function VerticalSplitCard({
  icon: Icon,
  label,
  total,
  active,
  badgeClass,
  dotClass,
  onClick,
  selected,
}: {
  icon: React.ElementType;
  label: string;
  total: number;
  active: number;
  badgeClass: string;
  dotClass: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-2xl bg-white p-5 text-left ring-1 transition hover:ring-2",
        selected ? "ring-2 ring-pork-red/40" : "ring-pork-ink/10",
      )}
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", badgeClass)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full shrink-0", dotClass)} />
          <p className="text-xs font-bold uppercase tracking-wide text-pork-ink/50 truncate">{label}</p>
        </div>
        <p className="mt-0.5 text-xl font-black">{total} <span className="text-sm font-normal text-pork-ink/40">lead</span></p>
        <p className="text-xs text-pork-green">{active} attivi</p>
      </div>
    </button>
  );
}

// ─── Riga lead ────────────────────────────────────────────────────────────────

function LeadRow({ lead }: { lead: PlatformLead }) {
  return (
    <Link
      href={`/admin/crm/${lead.id}`}
      className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10 transition hover:ring-pork-red/30"
    >
      {/* Left strip: indicatore verticale */}
      <div
        className={cn(
          "w-1 self-stretch rounded-full shrink-0",
          lead.business_vertical === "food" ? "bg-amber-400" : "bg-blue-500",
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Building2 size={15} className="shrink-0 text-pork-ink/40" />
          <span className="font-bold">{lead.business_name}</span>

          {/* Badge verticale */}
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
              VERTICAL_BADGE_CLASSES[lead.business_vertical],
            )}
          >
            {VERTICAL_SHORT_LABELS[lead.business_vertical]}
          </span>

          {/* Badge status */}
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
              {lead.city}
              {lead.province && ` (${lead.province})`}
            </span>
          )}
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-1 text-right sm:flex">
        <p className="text-xs text-pork-ink/40">Aggiornato {fmt(lead.updated_at)}</p>
        {lead.converted_at && (
          <p className="text-xs text-pork-green">Attivato {fmt(lead.converted_at)}</p>
        )}
      </div>

      <ArrowRight size={16} className="shrink-0 text-pork-ink/30" />
    </Link>
  );
}
