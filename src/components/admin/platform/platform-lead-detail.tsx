"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  User,
  MapPin,
  Receipt,
  CreditCard,
  FileText,
  AlertCircle,
  Plus,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PlatformLead,
  PlatformSubscription,
  PlatformPayment,
  LeadStatus,
} from "@/lib/platform-crm-types";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "@/lib/platform-crm-types";

// ─── Tipi tab ─────────────────────────────────────────────────────────────────

type Tab = "anagrafica" | "fatturazione" | "abbonamento" | "pagamenti" | "note";

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "anagrafica", label: "Anagrafica", icon: Building2 },
  { value: "fatturazione", label: "Fatturazione", icon: Receipt },
  { value: "abbonamento", label: "Abbonamento", icon: CreditCard },
  { value: "pagamenti", label: "Pagamenti", icon: FileText },
  { value: "note", label: "Note", icon: FileText },
];

// ─── Mock dati esempio ────────────────────────────────────────────────────────

const MOCK_LEAD: PlatformLead = {
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
  billing_name: "Osteria della Piazza S.n.c.",
  billing_vat: "IT08765432109",
  billing_cf: "08765432109",
  billing_address: "Via Roma 12",
  billing_city: "Bologna",
  billing_province: "BO",
  billing_postal_code: "40121",
  billing_sdi: "XXXXXXX",
  billing_pec: "osteriapiazza@pec.it",
  status: "prospect",
  source: "form_web",
  notes: "Interessato al pacchetto Growth. Richiamarlo la prossima settimana.",
  tenant_id: null,
  converted_at: null,
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-10T15:30:00Z",
};

const MOCK_SUBSCRIPTION: PlatformSubscription = {
  id: "sub-1",
  lead_id: "1",
  package_id: "pkg-growth",
  billing_cycle: "monthly",
  price_override: null,
  currency: "EUR",
  status: "trial",
  started_at: "2026-05-01",
  trial_ends_at: "2026-05-31",
  current_period_start: "2026-05-01",
  current_period_end: "2026-05-31",
  next_renewal_at: "2026-06-01",
  cancelled_at: null,
  notes: null,
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-01T10:00:00Z",
  package: {
    id: "pkg-growth",
    name: "Growth",
    slug: "growth",
    description: null,
    price_monthly: 99,
    price_yearly: 990,
    currency: "EUR",
    modules: ["website", "onlineMenu", "reservations", "takeaway", "tableOrders", "reviews", "gallery", "favorites"],
    is_active: true,
    sort_order: 2,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
};

const MOCK_PAYMENTS: PlatformPayment[] = [
  {
    id: "pay-1",
    subscription_id: "sub-1",
    lead_id: "1",
    amount: 99,
    currency: "EUR",
    status: "pending",
    payment_method: "bonifico",
    payment_date: null,
    due_date: "2026-06-01",
    invoice_number: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function eur(n: number | null) {
  if (n === null) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

// ─── Componente principale ────────────────────────────────────────────────────

export function PlatformLeadDetail({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<PlatformLead>(MOCK_LEAD);
  const [subscription] = useState<PlatformSubscription | null>(MOCK_SUBSCRIPTION);
  const [payments] = useState<PlatformPayment[]>(MOCK_PAYMENTS);
  const [activeTab, setActiveTab] = useState<Tab>("anagrafica");
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(lead.notes ?? "");

  void leadId; // in produzione: usato per fetch da Supabase

  function changeStatus(status: LeadStatus) {
    setLead((prev) => ({ ...prev, status }));
  }

  function saveNote() {
    setLead((prev) => ({ ...prev, notes: noteText }));
    setEditingNote(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <Link
          href="/admin/crm"
          className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/70 transition hover:border-pork-red/30 hover:text-pork-red"
        >
          <ArrowLeft size={15} /> CRM
        </Link>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="headline text-3xl">{lead.business_name}</h1>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide",
                LEAD_STATUS_COLORS[lead.status],
              )}
            >
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-pork-ink/55">
            {lead.contact_name} · {lead.contact_email}
            {lead.city && ` · ${lead.city} (${lead.province})`}
          </p>
        </div>

        {/* Cambio status */}
        <div className="flex flex-wrap gap-2">
          {(["lead", "prospect", "active", "churned"] as LeadStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition",
                lead.status === s
                  ? "bg-pork-ink text-pork-cream"
                  : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10",
              )}
            >
              {LEAD_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-pork-ink/5 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
                activeTab === tab.value
                  ? "bg-white text-pork-ink shadow-sm"
                  : "text-pork-ink/55 hover:text-pork-ink",
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenuto tab */}
      <div className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/10">
        {activeTab === "anagrafica" && <TabAnagrafica lead={lead} />}
        {activeTab === "fatturazione" && <TabFatturazione lead={lead} />}
        {activeTab === "abbonamento" && (
          <TabAbbonamento subscription={subscription} />
        )}
        {activeTab === "pagamenti" && (
          <TabPagamenti payments={payments} />
        )}
        {activeTab === "note" && (
          <TabNote
            note={noteText}
            editing={editingNote}
            onEdit={() => setEditingNote(true)}
            onCancel={() => { setEditingNote(false); setNoteText(lead.notes ?? ""); }}
            onSave={saveNote}
            onChange={setNoteText}
          />
        )}
      </div>
    </div>
  );
}

// ─── Tab Anagrafica ───────────────────────────────────────────────────────────

function TabAnagrafica({ lead }: { lead: PlatformLead }) {
  return (
    <div className="space-y-6">
      <SectionTitle icon={Building2}>Attività</SectionTitle>
      <FieldGrid>
        <Field label="Nome attività" value={lead.business_name} />
        <Field label="Vertical" value={lead.business_vertical === "food" ? "Ristorazione" : "Servizi"} />
        <Field label="Slug / futuro ID tenant" value={lead.business_slug} />
      </FieldGrid>

      <SectionTitle icon={User}>Responsabile</SectionTitle>
      <FieldGrid>
        <Field label="Nome" value={lead.contact_name} />
        <Field label="Email" value={lead.contact_email} />
        <Field label="Telefono" value={lead.contact_phone} />
      </FieldGrid>

      <SectionTitle icon={MapPin}>Sede operativa</SectionTitle>
      <FieldGrid>
        <Field label="Indirizzo" value={lead.address} />
        <Field label="Città" value={lead.city} />
        <Field label="Provincia" value={lead.province} />
        <Field label="CAP" value={lead.postal_code} />
        <Field label="Paese" value={lead.country} />
      </FieldGrid>

      <div className="flex flex-wrap gap-3 border-t border-pork-ink/10 pt-4">
        <InfoPill label="Fonte" value={lead.source ?? "—"} />
        <InfoPill label="Creato il" value={fmt(lead.created_at)} />
        <InfoPill label="Aggiornato" value={fmt(lead.updated_at)} />
        {lead.converted_at && (
          <InfoPill label="Attivato il" value={fmt(lead.converted_at)} className="text-pork-green" />
        )}
      </div>
    </div>
  );
}

// ─── Tab Fatturazione ─────────────────────────────────────────────────────────

function TabFatturazione({ lead }: { lead: PlatformLead }) {
  const hasData = Boolean(lead.billing_name || lead.billing_vat);

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-2xl bg-pork-mustard/15 p-5 text-sm text-pork-ink/70">
          <AlertCircle size={16} className="mb-2 text-pork-mustard" />
          I dati di fatturazione non sono ancora stati inseriti. Verranno
          sincronizzati su <strong>studio.menuary.it</strong> all&apos;attivazione del tenant.
        </div>
      )}

      <SectionTitle icon={Receipt}>Dati fiscali</SectionTitle>
      <FieldGrid>
        <Field label="Ragione sociale" value={lead.billing_name} />
        <Field label="Partita IVA" value={lead.billing_vat} />
        <Field label="Codice fiscale" value={lead.billing_cf} />
      </FieldGrid>

      <SectionTitle icon={MapPin}>Indirizzo di fatturazione</SectionTitle>
      <FieldGrid>
        <Field label="Indirizzo" value={lead.billing_address} />
        <Field label="Città" value={lead.billing_city} />
        <Field label="Provincia" value={lead.billing_province} />
        <Field label="CAP" value={lead.billing_postal_code} />
      </FieldGrid>

      <SectionTitle icon={Receipt}>Fatturazione elettronica</SectionTitle>
      <FieldGrid>
        <Field label="Codice SDI" value={lead.billing_sdi} />
        <Field label="PEC" value={lead.billing_pec} />
      </FieldGrid>
    </div>
  );
}

// ─── Tab Abbonamento ──────────────────────────────────────────────────────────

function TabAbbonamento({ subscription }: { subscription: PlatformSubscription | null }) {
  if (!subscription) {
    return (
      <div className="py-10 text-center">
        <CreditCard size={32} className="mx-auto mb-3 text-pork-ink/20" />
        <p className="text-pork-ink/50">Nessun abbonamento attivo.</p>
        <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-2.5 font-bold text-white">
          <Plus size={15} /> Attiva abbonamento
        </button>
      </div>
    );
  }

  const pkg = subscription.package;
  const effectivePrice =
    subscription.price_override ?? (subscription.billing_cycle === "yearly" ? pkg?.price_yearly : pkg?.price_monthly) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-pork-ink/50">Pacchetto</p>
          <p className="mt-0.5 text-2xl font-black">{pkg?.name ?? "—"}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-bold",
            SUBSCRIPTION_STATUS_COLORS[subscription.status],
          )}
        >
          {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
        </span>
      </div>

      <FieldGrid>
        <Field label="Ciclo" value={subscription.billing_cycle === "monthly" ? "Mensile" : "Annuale"} />
        <Field
          label="Importo"
          value={
            eur(effectivePrice) +
            (subscription.billing_cycle === "monthly" ? "/mese" : "/anno") +
            (subscription.price_override ? " (override)" : "")
          }
        />
        <Field label="Inizio" value={fmt(subscription.started_at)} />
        <Field label="Fine trial" value={fmt(subscription.trial_ends_at)} />
        <Field label="Periodo corrente" value={`${fmt(subscription.current_period_start)} → ${fmt(subscription.current_period_end)}`} />
        <Field label="Prossimo rinnovo" value={fmt(subscription.next_renewal_at)} />
      </FieldGrid>

      {pkg && (
        <div>
          <p className="mb-3 text-sm font-bold text-pork-ink/60">Moduli inclusi nel pacchetto</p>
          <div className="flex flex-wrap gap-2">
            {pkg.modules.map((m) => (
              <span
                key={m}
                className="rounded-full bg-pork-ink/5 px-3 py-1 text-xs font-semibold text-pork-ink/70"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {subscription.notes && (
        <p className="rounded-2xl bg-pork-cream p-4 text-sm text-pork-ink/70">
          {subscription.notes}
        </p>
      )}
    </div>
  );
}

// ─── Tab Pagamenti ────────────────────────────────────────────────────────────

function TabPagamenti({ payments }: { payments: PlatformPayment[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold">Storico pagamenti</p>
        <button className="inline-flex items-center gap-2 rounded-full bg-pork-red px-4 py-2 text-sm font-bold text-white">
          <Plus size={14} /> Registra pagamento
        </button>
      </div>

      {payments.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-pork-ink/50">Nessun pagamento registrato.</p>
        </div>
      )}

      <div className="space-y-3">
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl bg-pork-cream p-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{eur(p.amount)}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
                    PAYMENT_STATUS_COLORS[p.status],
                  )}
                >
                  {PAYMENT_STATUS_LABELS[p.status]}
                </span>
                {p.payment_method && (
                  <span className="rounded-full bg-pork-ink/5 px-2 py-0.5 text-[10px] text-pork-ink/50">
                    {p.payment_method}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-pork-ink/50">
                {p.due_date && <span>Scadenza: {fmt(p.due_date)}</span>}
                {p.payment_date && <span>Pagato: {fmt(p.payment_date)}</span>}
                {p.invoice_number && <span>Fattura: {p.invoice_number}</span>}
              </div>
            </div>
            {p.status === "pending" && (
              <button className="shrink-0 rounded-full bg-pork-green px-3 py-1.5 text-xs font-bold text-white">
                Segna pagato
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Note ─────────────────────────────────────────────────────────────────

function TabNote({
  note,
  editing,
  onEdit,
  onCancel,
  onSave,
  onChange,
}: {
  note: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold">Note interne</p>
        {!editing && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/70 hover:border-pork-red/30 hover:text-pork-red"
          >
            <Pencil size={13} /> Modifica
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="w-full rounded-2xl border border-pork-ink/15 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-pork-red/30"
            placeholder="Aggiungi una nota su questo lead…"
          />
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="inline-flex items-center gap-2 rounded-full bg-pork-red px-4 py-2 text-sm font-bold text-white"
            >
              <Save size={14} /> Salva
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/60"
            >
              <X size={14} /> Annulla
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-[120px] rounded-2xl bg-pork-cream p-4 text-sm text-pork-ink/70">
          {note || <span className="italic text-pork-ink/35">Nessuna nota.</span>}
        </div>
      )}
    </div>
  );
}

// ─── Primitivi UI ─────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-pork-ink/8 pb-2">
      <Icon size={14} className="text-pork-red" />
      <p className="text-xs font-black uppercase tracking-wide text-pork-ink/50">{children}</p>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-pork-ink/40">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-pork-ink">{value || <span className="text-pork-ink/30">—</span>}</p>
    </div>
  );
}

function InfoPill({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <span className="rounded-full bg-pork-ink/5 px-3 py-1.5 text-xs">
      <span className="text-pork-ink/50">{label}:</span>{" "}
      <span className={cn("font-bold text-pork-ink", className)}>{value}</span>
    </span>
  );
}
