"use client";

import { useState, useEffect } from "react";
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
  UtensilsCrossed,
  Briefcase,
  MapPin,
  Flame,
  MonitorUp,
  UserCheck,
  Palette,
} from "lucide-react";
import type { PlatformLead, LeadStatus, LeadVertical } from "@/lib/platform-crm-types";
import { getMarket, normalizeMarketCode } from "@/lib/markets";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_COLORS,
  LEAD_TEMPERATURE_LABELS,
  LEAD_TEMPERATURE_COLORS,
  SOURCE_LABELS,
  VERTICAL_BADGE_CLASSES,
  VERTICAL_SHORT_LABELS,
} from "@/lib/platform-crm-types";
import { cn } from "@/lib/utils";
import { MailLink } from "@/components/admin/inbox/mail-launcher";

// ─── Componente ───────────────────────────────────────────────────────────────

const STATUS_TABS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Attivi" },
  { value: "suspended", label: "Sospesi" },
  { value: "churned", label: "Churned" },
  { value: "lost", label: "Persi" },
];

const VERTICAL_FILTERS: { value: LeadVertical | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Tutti i vertical", icon: Users },
  { value: "food", label: "Menuary · Food", icon: UtensilsCrossed },
  { value: "services", label: "Bizery · Services", icon: Briefcase },
  { value: "creative", label: "Orpheo · Creative", icon: Palette },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type CurrentUser = { user_id: string; name: string; role: string };

export function PlatformCrmPage() {
  const [leads, setLeads] = useState<PlatformLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeadStatus | "all">("all");
  const [verticalFilter, setVerticalFilter] = useState<LeadVertical | "all">("all");
  const [query, setQuery] = useState("");
  const [myLeadsOnly, setMyLeadsOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data: CurrentUser) => setCurrentUser(data))
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as {
          leads?: PlatformLead[];
          error?: string;
        };
        if (!r.ok) throw new Error(data.error ?? "Impossibile caricare i lead.");
        setLeads(data.leads ?? []);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Impossibile caricare i lead."))
      .finally(() => setLoadingLeads(false));
  }, []);

  const foodLeads = leads.filter((l) => l.business_vertical === "food");
  const servicesLeads = leads.filter((l) => l.business_vertical === "services");
  const creativeLeads = leads.filter((l) => l.business_vertical === "creative");

  const counts = {
    all: leads.length,
    lead: leads.filter((l) => l.status === "lead").length,
    prospect: leads.filter((l) => l.status === "prospect").length,
    active: leads.filter((l) => l.status === "active").length,
    suspended: leads.filter((l) => l.status === "suspended").length,
    churned: leads.filter((l) => l.status === "churned").length,
    lost: leads.filter((l) => l.status === "lost").length,
    hot: leads.filter((l) => l.temperature === "hot").length,
  };

  const filtered = leads.filter((l) => {
    const matchTab = activeTab === "all" || l.status === activeTab;
    const matchVertical = verticalFilter === "all" || l.business_vertical === verticalFilter;
    const matchOwner = !myLeadsOnly || (currentUser != null && l.sales_owner_id === currentUser.user_id);
    const q = query.toLowerCase();
    const matchSearch =
      !q ||
      l.business_name.toLowerCase().includes(q) ||
      (l.contact_name ?? "").toLowerCase().includes(q) ||
      (l.contact_email ?? "").toLowerCase().includes(q) ||
      (l.city ?? "").toLowerCase().includes(q) ||
      l.locations.some((loc) => `${loc.name} ${loc.address ?? ""} ${loc.city ?? ""}`.toLowerCase().includes(q));
    return matchTab && matchVertical && matchOwner && matchSearch;
  });

  const myLeadsCount = currentUser
    ? leads.filter((l) => l.sales_owner_id === currentUser.user_id).length
    : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Piattaforma</p>
          <h1 className="headline text-4xl">CRM Lead</h1>
          <p className="mt-1 text-pork-ink/60">
            Pipeline commerciale completa: demo, trattativa, venduto e conversione a tenant.
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
        <StatCard icon={Flame} label="Lead caldi" value={counts.hot} color="text-pork-red" />
        <StatCard icon={CheckCircle2} label="Tenant attivi" value={counts.active} color="text-pork-green" />
      </div>

      {/* Split verticali */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <VerticalSplitCard
          icon={Palette}
          label="Orpheo · Creative"
          total={creativeLeads.length}
          active={creativeLeads.filter((l) => l.status === "active").length}
          badgeClass="bg-fuchsia-100 text-fuchsia-700"
          dotClass="bg-fuchsia-500"
          onClick={() => setVerticalFilter(verticalFilter === "creative" ? "all" : "creative")}
          selected={verticalFilter === "creative"}
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
                        : vf.value === "creative"
                          ? "bg-fuchsia-600 text-white"
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

        {/* Filtro I miei lead */}
        <button
          onClick={() => setMyLeadsOnly((v) => !v)}
          title={myLeadsOnly ? "Mostra tutti i lead" : "Mostra solo i miei lead"}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition",
            myLeadsOnly
              ? "bg-pork-red text-white"
              : "border border-pork-ink/10 bg-white text-pork-ink/60 hover:text-pork-ink",
          )}
        >
          <UserCheck size={14} />
          I miei lead
          <span className={cn("text-xs", myLeadsOnly ? "opacity-80" : "opacity-50")}>
            {myLeadsCount}
          </span>
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loadingLeads && (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
            <p className="text-pork-ink/50">Caricamento lead...</p>
          </div>
        )}
        {loadError && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {loadError}
          </div>
        )}
        {!loadingLeads && !loadError && filtered.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
            <p className="text-pork-ink/50">Nessun lead trovato.</p>
          </div>
        )}
          {filtered.map((lead) => (
            <LeadRow key={lead.id} lead={lead} currentUserId={currentUser?.user_id ?? null} />
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

function LeadRow({ lead, currentUserId }: { lead: PlatformLead; currentUserId: string | null }) {
  const phoneHref = lead.contact_phone ? `tel:${lead.contact_phone.replace(/\s/g, "")}` : undefined;
  const whatsappHref = lead.contact_phone
    ? `https://wa.me/${lead.contact_phone.replace(/[^\d]/g, "")}`
    : undefined;
  const market = getMarket(normalizeMarketCode(lead.country) ?? "IT");
  const attentionKind =
    lead.sales_owner_id === null
      ? lead.attention_kind
      : lead.attention_for_user_id === currentUserId
        ? lead.attention_kind
        : null;

  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10 transition hover:ring-pork-red/30">
      {/* Left strip: indicatore verticale */}
      <div
        className={cn(
          "w-1 self-stretch rounded-full shrink-0",
          lead.business_vertical === "food"
            ? "bg-amber-400"
            : lead.business_vertical === "creative"
              ? "bg-fuchsia-500"
              : "bg-blue-500",
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Building2 size={15} className="shrink-0 text-pork-ink/40" />
          <span className="font-bold">{lead.business_name}</span>

          {attentionKind && (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                attentionKind === "new"
                  ? "bg-red-100 text-red-700"
                  : "bg-sky-100 text-sky-700",
              )}
            >
              {attentionKind === "new" ? "Nuovo" : "Aggiornato"}
            </span>
          )}

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

          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
              LEAD_STAGE_COLORS[lead.stage],
            )}
          >
            {LEAD_STAGE_LABELS[lead.stage]}
          </span>

          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
              LEAD_TEMPERATURE_COLORS[lead.temperature],
            )}
          >
            {LEAD_TEMPERATURE_LABELS[lead.temperature]}
          </span>

          {lead.source && (
            <span className="rounded-full bg-pork-ink/5 px-2.5 py-0.5 text-[10px] text-pork-ink/50">
              {SOURCE_LABELS[lead.source]}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-pork-ink/60">
          <span>{lead.contact_name || "Referente non inserito"}</span>
          {lead.contact_email && (
            <MailLink
              to={lead.contact_email}
              brand={lead.business_vertical === "services" || lead.business_vertical === "creative" ? "bizery" : "menuary"}
              subject={lead.business_name ? `${lead.business_name} · contatto da Menuary` : undefined}
              className="inline-flex items-center gap-1 font-semibold hover:text-pork-red"
            >
              <Mail size={12} />
              {lead.contact_email}
            </MailLink>
          )}
          {lead.contact_phone && phoneHref && (
            <a href={phoneHref} className="inline-flex items-center gap-1 font-semibold hover:text-pork-red">
              <Phone size={12} />
              {lead.contact_phone}
            </a>
          )}
          {lead.contact_phone && whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-pork-green/10 px-2 py-0.5 text-xs font-black text-pork-green hover:bg-pork-green hover:text-white"
            >
              WA
            </a>
          )}
          {lead.business_vertical !== "creative" && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {lead.locations.length} {lead.locations.length === 1 ? "sede" : "sedi"}
              {lead.city && (
                <>
                  {" · "}
                  {lead.city}
                  {lead.province && ` (${lead.province})`}
                </>
              )}
            </span>
          )}
          <span className="rounded-full bg-pork-ink/5 px-2 py-0.5 text-xs font-bold text-pork-ink/55">
            {market.flag} {market.code}
          </span>
          {lead.business_vertical !== "creative" && lead.locations.length > 1 && (
            <span className="rounded-full bg-pork-ink/5 px-2 py-0.5 text-xs font-bold text-pork-ink/50">
              multi-sede
            </span>
          )}
          {lead.demo_url && (
            <a
              href={lead.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-black text-indigo-700 hover:bg-indigo-100"
            >
              <MonitorUp size={12} /> demo
            </a>
          )}
          {lead.sales_owner_name && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-2 py-0.5 text-xs font-bold text-pork-ink/55">
              <UserCheck size={10} />
              {lead.sales_owner_name}
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

      <Link href={`/admin/crm/${lead.id}`} className="shrink-0 rounded-full p-2 text-pork-ink/30 hover:bg-pork-ink/5 hover:text-pork-ink" aria-label={`Apri ${lead.business_name}`}>
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}
