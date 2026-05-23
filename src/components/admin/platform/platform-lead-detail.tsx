"use client";

import { useState, useEffect } from "react";
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
  UserCheck,
  UtensilsCrossed,
  Briefcase,
  GitBranch,
  Mail,
  Phone,
  MessageCircle,
  MapPinned,
  Flame,
  ExternalLink,
  MonitorUp,
  BadgeEuro,
  Figma,
} from "lucide-react";
import { GenerateTenantModal } from "./generate-tenant-modal";
import { UpdateAnimaModal } from "./update-anima-modal";
import { cn } from "@/lib/utils";
import type {
  PlatformLead,
  PlatformSubscription,
  PlatformPayment,
  LeadStatus,
  LeadStage,
  BillingCycle,
} from "@/lib/platform-crm-types";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_COLORS,
  LEAD_TEMPERATURE_LABELS,
  LEAD_TEMPERATURE_COLORS,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  VERTICAL_BADGE_CLASSES,
  VERTICAL_LABELS,
} from "@/lib/platform-crm-types";
import {
  PLATFORM_LEADS,
  PLATFORM_PACKAGES,
  PLATFORM_PAYMENTS,
  PLATFORM_SUBSCRIPTIONS,
  PLATFORM_COMMISSION_RULES,
  calculateCommissionAmount,
  calculateFirstPaymentBase,
  calculateMultiLocationTotal,
  calculateSubscriptionTotal,
  getLocationPlanFactor,
} from "@/lib/platform-admin-data";
import { getModuleLabel } from "@/lib/vertical";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import { useMailLauncher } from "@/components/admin/inbox/mail-launcher";
import { getMarket, normalizeMarketCode } from "@/lib/markets";

type Tab = "anagrafica" | "fatturazione" | "abbonamento" | "pagamenti" | "note";

type Venditore = { id: string; user_id: string; name: string; email: string; role: string };

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "anagrafica", label: "Anagrafica", icon: Building2 },
  { value: "fatturazione", label: "Fatturazione", icon: Receipt },
  { value: "abbonamento", label: "Abbonamento", icon: CreditCard },
  { value: "pagamenti", label: "Pagamenti", icon: FileText },
  { value: "note", label: "Note", icon: FileText },
];

type SalePayload = {
  packageId: string;
  billingCycle: BillingCycle;
  recurringAmount: number;
  setupAmount: number;
  firstPaymentAmount: number;
  notes: string;
};

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
  const initialLead = PLATFORM_LEADS.find((item) => item.id === leadId) ?? PLATFORM_LEADS[0];
  const [lead, setLead] = useState<PlatformLead>(initialLead);
  const [subscription, setSubscription] = useState<PlatformSubscription | null>(
    PLATFORM_SUBSCRIPTIONS.find((item) => item.lead_id === initialLead.id) ?? null,
  );
  const [payments, setPayments] = useState<PlatformPayment[]>(
    PLATFORM_PAYMENTS.filter((item) => item.lead_id === initialLead.id),
  );
  const [activeTab, setActiveTab] = useState<Tab>("anagrafica");
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(lead.notes ?? "");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showUpdateAnimaModal, setShowUpdateAnimaModal] = useState(false);
  const [venditori, setVenditori] = useState<Venditore[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);
  const market = getMarket(normalizeMarketCode(lead.country) ?? "IT");

  useEffect(() => {
    fetch("/api/admin/venditori")
      .then((r) => r.json())
      .then((data: { venditori?: Venditore[] }) => setVenditori(data.venditori ?? []))
      .catch(() => null);
  }, []);

  function changeStatus(status: LeadStatus) {
    setLead((prev) => ({ ...prev, status }));
  }

  function changeStage(stage: LeadStage) {
    setLead((prev) => ({
      ...prev,
      stage,
      status: stage === "tenant" ? "active" : stage === "lost" ? "churned" : prev.status,
    }));
  }

  function saveNote() {
    setLead((prev) => ({ ...prev, notes: noteText }));
    setEditingNote(false);
  }

  async function assignVenditore(venditore: Venditore | null) {
    setAssignSaving(true);
    try {
      await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_owner_id: venditore?.user_id ?? null,
          sales_owner_name: venditore?.name ?? null,
        }),
      });
      setLead((prev) => ({
        ...prev,
        sales_owner_id: venditore?.user_id ?? null,
        sales_owner_name: venditore?.name ?? null,
      }));
    } finally {
      setAssignSaving(false);
    }
  }

  function confirmSale(payload: SalePayload) {
    const selectedPackage = PLATFORM_PACKAGES.find((item) => item.id === payload.packageId) ?? PLATFORM_PACKAGES[0];
    const now = new Date().toISOString();
    const tenantId = lead.business_slug ?? lead.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const nextRenewal = new Date();
    nextRenewal.setMonth(nextRenewal.getMonth() + (payload.billingCycle === "monthly" ? 1 : 12));

    const newSubscription: PlatformSubscription = {
      id: subscription?.id ?? `sub-${lead.id}`,
      lead_id: lead.id,
      package_id: selectedPackage.id,
      billing_cycle: payload.billingCycle,
      price_override: payload.recurringAmount,
      setup_amount: payload.setupAmount,
      first_payment_amount: payload.firstPaymentAmount,
      currency: "EUR",
      status: "active",
      started_at: now.slice(0, 10),
      trial_ends_at: null,
      current_period_start: now.slice(0, 10),
      current_period_end: nextRenewal.toISOString().slice(0, 10),
      next_renewal_at: nextRenewal.toISOString().slice(0, 10),
      cancelled_at: null,
      notes: payload.notes || null,
      created_at: subscription?.created_at ?? now,
      updated_at: now,
      lead: { ...lead, status: "active", stage: "tenant", tenant_id: tenantId, converted_at: now },
      package: selectedPackage,
      location_plans: lead.locations.map((location, index) => ({
        ...location,
        package_slug: selectedPackage.slug,
        package_name: selectedPackage.name,
        price_factor: getLocationPlanFactor(location, index),
      })),
    };

    const newPayment: PlatformPayment = {
      id: `pay-${lead.id}-${Date.now()}`,
      subscription_id: newSubscription.id,
      lead_id: lead.id,
      amount: payload.firstPaymentAmount,
      currency: "EUR",
      status: "pending",
      payment_method: null,
      payment_date: null,
      due_date: now.slice(0, 10),
      invoice_number: null,
      notes: "Primo pagamento generato dalla conferma vendita.",
      stripe_payment_link: null,
      billing_payload: {
        plan: selectedPackage.name,
        billing_cycle: payload.billingCycle,
        setup_amount: payload.setupAmount,
        recurring_amount: payload.recurringAmount,
        first_payment_amount: payload.firstPaymentAmount,
      },
      created_at: now,
      updated_at: now,
    };

    setLead((prev) => ({
      ...prev,
      status: "active",
      stage: "tenant",
      tenant_id: tenantId,
      converted_at: now,
      sales_owner_id: prev.sales_owner_id ?? "sales-unassigned",
      sales_owner_name: prev.sales_owner_name ?? "Venditore non assegnato",
    }));
    setSubscription(newSubscription);
    setPayments((prev) => [newPayment, ...prev.filter((item) => item.id !== newPayment.id)]);
    setShowSaleModal(false);
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
            {/* Icona e badge verticale */}
            <VerticalIcon vertical={lead.business_vertical} />
            <h1 className="headline text-3xl">{lead.business_name}</h1>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide",
                VERTICAL_BADGE_CLASSES[lead.business_vertical],
              )}
            >
              {VERTICAL_LABELS[lead.business_vertical]}
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide",
                LEAD_STATUS_COLORS[lead.status],
              )}
            >
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide",
                LEAD_STAGE_COLORS[lead.stage],
              )}
            >
              {LEAD_STAGE_LABELS[lead.stage]}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide",
                LEAD_TEMPERATURE_COLORS[lead.temperature],
              )}
            >
              <Flame size={12} />
              {LEAD_TEMPERATURE_LABELS[lead.temperature]}
            </span>
            <span className="rounded-full bg-pork-ink/5 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-pork-ink/60">
              {market.flag} {market.code}
            </span>
          </div>
          <p className="mt-1 text-sm text-pork-ink/55">
            {lead.contact_name} · {lead.contact_email}
            {lead.city && ` · ${lead.city} (${lead.province})`}
          </p>
        </div>

        {/* Azioni header */}
        <div className="flex flex-wrap items-center gap-2">
          {!lead.demo_url && !lead.tenant_id && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-pork-ink/80"
            >
              <MonitorUp size={14} /> Crea demo
            </button>
          )}
          {lead.demo_url && !lead.tenant_id && (
            <>
              <a
                href={lead.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-200"
              >
                <MonitorUp size={14} /> Apri demo
              </a>
              {lead.demo_pr_url && (
                <a
                  href={lead.demo_pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/70 hover:border-pork-red/30 hover:text-pork-red"
                >
                  PR demo <ExternalLink size={13} />
                </a>
              )}
              <button
                onClick={() => setShowUpdateAnimaModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100"
              >
                <Figma size={14} /> Aggiorna Figma
              </button>
              <Link
                href={`/admin/contratti/nuovo?leadId=${lead.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/70 hover:border-pork-red/30 hover:text-pork-red"
              >
                <FileText size={14} /> Genera contratto
              </Link>
              <button
                onClick={() => setShowSaleModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-pork-green px-4 py-2 text-sm font-bold text-white hover:bg-pork-green/90"
              >
                <BadgeEuro size={14} /> Segna venduto
              </button>
            </>
          )}
          {lead.tenant_id && (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-pork-green/15 px-4 py-2 text-sm font-bold text-pork-green">
                <GitBranch size={14} /> Tenant attivo
              </span>
              <Link
                href={getTenantGestioneExternalHref(lead.tenant_id)}
                className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/70 hover:border-pork-red/30 hover:text-pork-red"
              >
                Pannello tenant <ExternalLink size={13} />
              </Link>
              <button
                onClick={() => setShowUpdateAnimaModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100"
              >
                <Figma size={14} /> Aggiorna Figma
              </button>
            </>
          )}
        </div>

        {/* Cambio status */}
        <div className="flex flex-wrap gap-2">
          {(["new", "contacted", "qualified", "demo", "proposal", "contract", "tenant", "lost"] as LeadStage[]).map((s) => (
            <button
              key={s}
              onClick={() => changeStage(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition",
                lead.stage === s
                  ? "bg-pork-ink text-pork-cream"
                  : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10",
              )}
            >
              {LEAD_STAGE_LABELS[s]}
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
        {activeTab === "anagrafica" && (
          <TabAnagrafica
            lead={lead}
            onStatusChange={changeStatus}
            venditori={venditori}
            onAssign={assignVenditore}
            assignSaving={assignSaving}
          />
        )}
        {activeTab === "fatturazione" && <TabFatturazione lead={lead} />}
        {activeTab === "abbonamento" && (
          <TabAbbonamento subscription={subscription} lead={lead} />
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

      {showGenerateModal && (
        <GenerateTenantModal
          lead={lead}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
      {showUpdateAnimaModal && (lead.business_slug ?? lead.demo_url) && (
        <UpdateAnimaModal
          tenantSlug={
            lead.business_slug ??
            lead.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
          }
          figmaUrl={
            lead.demo_url
              ? `${lead.demo_url}/figma`
              : lead.business_vertical === "services"
                ? `https://demo.bizery.it/${lead.business_slug}/figma`
                : `https://demo.menuary.it/${lead.business_slug}/figma`
          }
          onClose={() => setShowUpdateAnimaModal(false)}
        />
      )}
      {showSaleModal && (
        <ConfirmSaleModal
          lead={lead}
          subscription={subscription}
          onClose={() => setShowSaleModal(false)}
          onConfirm={confirmSale}
        />
      )}
    </div>
  );
}

function ConfirmSaleModal({
  lead,
  subscription,
  onClose,
  onConfirm,
}: {
  lead: PlatformLead;
  subscription: PlatformSubscription | null;
  onClose: () => void;
  onConfirm: (payload: SalePayload) => void;
}) {
  const defaultPackage = subscription?.package ?? PLATFORM_PACKAGES.find((item) => item.vertical === "both" || item.vertical === lead.business_vertical) ?? PLATFORM_PACKAGES[0];
  const defaultBaseAmount = subscription?.billing_cycle === "yearly"
    ? defaultPackage.price_yearly ?? defaultPackage.price_monthly * 12
    : defaultPackage.price_monthly;
  const [packageId, setPackageId] = useState(defaultPackage.id);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(subscription?.billing_cycle ?? "monthly");
  const [recurringAmount, setRecurringAmount] = useState(
    subscription?.price_override ?? calculateMultiLocationTotal(defaultBaseAmount, lead.locations),
  );
  const [setupAmount, setSetupAmount] = useState(subscription?.setup_amount ?? 490);
  const [notes, setNotes] = useState(subscription?.notes ?? "");

  const selectedPackage = PLATFORM_PACKAGES.find((item) => item.id === packageId) ?? defaultPackage;
  const sellerRate = PLATFORM_COMMISSION_RULES.find((rule) => rule.role === "venditore")?.commission_rate ?? 30;
  const locationsCount = Math.max(lead.locations.length, 1);
  const extraLocationsCount = Math.max(locationsCount - 1, 0);
  const firstPaymentAmount = billingCycle === "monthly" ? setupAmount + recurringAmount : recurringAmount;
  const commissionAmount = calculateCommissionAmount(firstPaymentAmount, sellerRate);

  function packageBaseAmount(pkg = selectedPackage, cycle = billingCycle) {
    return cycle === "yearly" ? pkg.price_yearly ?? pkg.price_monthly * 12 : pkg.price_monthly;
  }

  function packageMultiLocationAmount(pkg = selectedPackage, cycle = billingCycle) {
    return calculateMultiLocationTotal(packageBaseAmount(pkg, cycle), lead.locations);
  }

  function selectPackage(nextPackageId: string) {
    const nextPackage = PLATFORM_PACKAGES.find((item) => item.id === nextPackageId) ?? selectedPackage;
    setPackageId(nextPackage.id);
    setRecurringAmount(packageMultiLocationAmount(nextPackage, billingCycle));
  }

  function selectBillingCycle(nextCycle: BillingCycle) {
    setBillingCycle(nextCycle);
    setRecurringAmount(packageMultiLocationAmount(selectedPackage, nextCycle));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pork-ink/55 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="impact-title text-xs text-pork-red">Conferma vendita</p>
            <h2 className="headline text-3xl">{lead.business_name}</h2>
            <p className="mt-1 text-sm text-pork-ink/55">
              Inserisci i dati economici da salvare su pagamento, Stripe e fatturazione.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-pork-ink/10 p-2 text-pork-ink/55 hover:text-pork-ink"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-pork-ink/45">Piano scelto</span>
            <select
              value={packageId}
              onChange={(event) => selectPackage(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-pork-ink/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-pork-red/30"
            >
              {PLATFORM_PACKAGES.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="text-xs font-black uppercase tracking-wide text-pork-ink/45">Ciclo</span>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-pork-ink/5 p-1">
              {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => selectBillingCycle(cycle)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-black transition",
                    billingCycle === cycle ? "bg-pork-ink text-pork-cream" : "text-pork-ink/60 hover:text-pork-ink",
                  )}
                >
                  {cycle === "monthly" ? "Mensile" : "Annuale"}
                </button>
              ))}
            </div>
          </div>

          <MoneyInput
            label={billingCycle === "monthly" ? "Canone primo mese" : "Canone annuale"}
            value={recurringAmount}
            onChange={setRecurringAmount}
          />
          <MoneyInput label="Setup" value={setupAmount} onChange={setSetupAmount} />

          <label className="block md:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-pork-ink/45">Note accordo</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-pork-ink/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pork-red/30"
              placeholder="Es. prezzo concordato fuori listino, pagamento via Stripe, sconto setup..."
            />
          </label>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl bg-pork-cream p-4 sm:grid-cols-3">
          <SummaryMetric label="Primo pagamento" value={eur(firstPaymentAmount)} />
          <SummaryMetric label="Provvigione venditore" value={`${sellerRate}%`} />
          <SummaryMetric label="Importo provvigione" value={eur(commissionAmount)} strong />
        </div>
        {extraLocationsCount > 0 && (
          <p className="mt-3 text-sm font-semibold text-pork-ink/60">
            Multi-sede: sede principale al 100%, {extraLocationsCount} {extraLocationsCount === 1 ? "sede aggiuntiva" : "sedi aggiuntive"} al 50% del piano selezionato.
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full border border-pork-ink/15 px-5 py-2.5 text-sm font-bold text-pork-ink/60"
          >
            Annulla
          </button>
          <button
            onClick={() => onConfirm({ packageId, billingCycle, recurringAmount, setupAmount, firstPaymentAmount, notes })}
            className="inline-flex items-center gap-2 rounded-full bg-pork-green px-5 py-2.5 text-sm font-bold text-white hover:bg-pork-green/90"
          >
            <Save size={15} />
            Salva vendita
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Anagrafica ───────────────────────────────────────────────────────────

function TabAnagrafica({
  lead,
  onStatusChange,
  venditori,
  onAssign,
  assignSaving,
}: {
  lead: PlatformLead;
  onStatusChange: (status: LeadStatus) => void;
  venditori: Venditore[];
  onAssign: (v: Venditore | null) => void;
  assignSaving: boolean;
}) {
  const phoneHref = lead.contact_phone ? `tel:${lead.contact_phone.replace(/\s/g, "")}` : null;
  const whatsappHref = lead.contact_phone ? `https://wa.me/${lead.contact_phone.replace(/[^\d]/g, "")}` : null;
  const mailLauncher = useMailLauncher();
  const market = getMarket(normalizeMarketCode(lead.country) ?? "IT");

  return (
    <div className="space-y-6">
      {/* Banner verticale */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl p-4",
          VERTICAL_BADGE_CLASSES[lead.business_vertical],
        )}
      >
        <VerticalIcon vertical={lead.business_vertical} size={20} />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide opacity-60">Verticale</p>
          <p className="font-black">{VERTICAL_LABELS[lead.business_vertical]}</p>
        </div>
      </div>

      <SectionTitle icon={Building2}>Attività</SectionTitle>
      <FieldGrid>
        <Field label="Nome attività" value={lead.business_name} />
        <Field label="Slug / futuro ID tenant" value={lead.business_slug} />
        <Field label="Nazione / mercato" value={`${market.flag} ${market.name} (${market.code})`} />
      </FieldGrid>

      <SectionTitle icon={User}>Responsabile</SectionTitle>
      <FieldGrid>
        <Field label="Nome" value={lead.contact_name} />
        <ActionField
          label="Email"
          value={lead.contact_email}
          onClick={lead.contact_email ? () => mailLauncher.open({
            to:      lead.contact_email,
            brand:   lead.business_vertical === "services" ? "bizery" : "menuary",
            subject: lead.business_name ? `${lead.business_name} · contatto da Menuary` : undefined,
          }) : undefined}
          icon={Mail}
        />
        <ActionField
          label="Telefono"
          value={lead.contact_phone}
          href={phoneHref}
          icon={Phone}
          extra={whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-pork-green/10 px-2 py-1 text-xs font-black text-pork-green hover:bg-pork-green hover:text-white"
            >
              <MessageCircle size={12} /> WA
            </a>
          ) : null}
        />
      </FieldGrid>

      <SectionTitle icon={MapPinned}>Sedi operative</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        {lead.locations.map((location) => (
          <div key={location.id} className="rounded-2xl bg-pork-cream p-4 ring-1 ring-pork-ink/5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black">{location.name}</p>
              {location.is_primary && (
                <span className="rounded-full bg-pork-green/15 px-2 py-0.5 text-[10px] font-black uppercase text-pork-green">
                  sede principale
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-pork-ink/60">
              {[location.address, location.postal_code, location.city, location.province].filter(Boolean).join(", ") || "Indirizzo non inserito"}
            </p>
          </div>
        ))}
      </div>

      <SectionTitle icon={GitBranch}>Pipeline</SectionTitle>
      <FieldGrid>
        <Field label="Stadio avanzamento" value={LEAD_STAGE_LABELS[lead.stage]} />
        <Field label="Classificazione" value={LEAD_TEMPERATURE_LABELS[lead.temperature]} />
        <Field label="Stato commerciale" value={LEAD_STATUS_LABELS[lead.status]} />
        <ActionField
          label="Link demo"
          value={lead.demo_url}
          href={lead.demo_url}
          icon={MonitorUp}
        />
        <Field label="Dominio ufficiale" value={lead.official_domain} />
        <Field label="Dominio attivo" value={lead.official_domain_active ? "Sì" : "No"} />
      </FieldGrid>

      {/* Assegnazione venditore */}
      <div className="rounded-2xl border border-pork-ink/10 bg-pork-ink/2 p-4">
        <div className="mb-2 flex items-center gap-2">
          <UserCheck size={14} className="text-pork-red" />
          <p className="text-xs font-black uppercase tracking-wide text-pork-ink/50">
            Venditore assegnato
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            disabled={assignSaving}
            value={lead.sales_owner_id ?? ""}
            onChange={(e) => {
              const v = venditori.find((x) => x.user_id === e.target.value) ?? null;
              onAssign(v);
            }}
            className="flex-1 rounded-xl border border-pork-ink/10 bg-white px-3 py-2.5 text-sm font-semibold text-pork-ink focus:outline-none focus:ring-2 focus:ring-pork-red/25 disabled:opacity-50"
          >
            <option value="">— Non assegnato —</option>
            {venditori.map((v) => (
              <option key={v.user_id} value={v.user_id}>
                {v.name}
                {v.role === "venditore" ? "" : ` (${v.role})`}
              </option>
            ))}
          </select>
          {assignSaving && (
            <span className="text-xs text-pork-ink/40">Salvataggio…</span>
          )}
          {!assignSaving && lead.sales_owner_id && (
            <button
              onClick={() => onAssign(null)}
              className="rounded-full border border-pork-ink/10 px-3 py-2 text-xs font-bold text-pork-ink/50 hover:border-red-200 hover:text-red-500"
            >
              Rimuovi
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["lead", "prospect", "active", "churned"] as LeadStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              lead.status === status ? "bg-pork-ink text-pork-cream" : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10",
            )}
          >
            {LEAD_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

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

function TabAbbonamento({ subscription, lead }: { subscription: PlatformSubscription | null; lead: PlatformLead }) {
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
  const effectivePrice = calculateSubscriptionTotal(subscription);

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
        <Field label="Setup concordato" value={eur(subscription.setup_amount)} />
        <Field label="Primo pagamento" value={eur(subscription.first_payment_amount ?? calculateFirstPaymentBase(subscription))} />
        <Field label="Inizio" value={fmt(subscription.started_at)} />
        <Field label="Fine trial" value={fmt(subscription.trial_ends_at)} />
        <Field label="Periodo corrente" value={`${fmt(subscription.current_period_start)} → ${fmt(subscription.current_period_end)}`} />
        <Field label="Prossimo rinnovo" value={fmt(subscription.next_renewal_at)} />
        <Field label="Sedi associate" value={String(subscription.location_plans?.length ?? lead.locations.length)} />
      </FieldGrid>

      {subscription.location_plans && subscription.location_plans.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-bold text-pork-ink/60">Piano per sede</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {subscription.location_plans.map((location) => (
              <div key={location.id} className="rounded-2xl bg-pork-cream p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{location.name}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase text-pork-ink/60">
                    x{location.price_factor}
                  </span>
                </div>
                <p className="mt-1 text-sm text-pork-ink/60">{location.package_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pkg && (
        <div>
          <p className="mb-3 text-sm font-bold text-pork-ink/60">Moduli inclusi nel pacchetto</p>
          <div className="flex flex-wrap gap-2">
            {pkg.modules.map((m) => (
              <span
                key={m}
                className="rounded-full bg-pork-ink/5 px-3 py-1 text-xs font-semibold text-pork-ink/70"
              >
                {getModuleLabel(m, lead.business_vertical)}
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

// ─── Vertical icon ────────────────────────────────────────────────────────────

function VerticalIcon({
  vertical,
  size = 16,
}: {
  vertical: "food" | "services";
  size?: number;
}) {
  if (vertical === "food") return <UtensilsCrossed size={size} />;
  return <Briefcase size={size} />;
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

function ActionField({
  label,
  value,
  href,
  onClick,
  icon: Icon,
  extra,
}: {
  label: string;
  value: string | null | undefined;
  href?: string | null;
  onClick?: () => void;
  icon: React.ElementType;
  extra?: React.ReactNode;
}) {
  const linkClass =
    "inline-flex items-center gap-1.5 text-sm font-semibold text-pork-ink hover:text-pork-red";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-pork-ink/40">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {value && onClick ? (
          <button type="button" onClick={onClick} className={linkClass}>
            <Icon size={13} />
            {value}
          </button>
        ) : value && href ? (
          <a href={href} className={linkClass}>
            <Icon size={13} />
            {value}
          </a>
        ) : (
          <span className="text-sm font-semibold text-pork-ink/30">—</span>
        )}
        {extra}
      </div>
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

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-pork-ink/45">{label}</span>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-pork-ink/10 px-4 py-3 focus-within:ring-2 focus-within:ring-pork-red/30">
        <span className="text-sm font-black text-pork-ink/35">€</span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full bg-transparent text-sm font-black tabular-nums outline-none"
        />
      </div>
    </label>
  );
}

function SummaryMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wide text-pork-ink/40">{label}</p>
      <p className={cn("mt-1 text-lg tabular-nums", strong ? "font-black text-pork-red" : "font-black text-pork-ink")}>
        {value}
      </p>
    </div>
  );
}
