"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Palette,
  Trash2,
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
  PLATFORM_ADDON_PACKAGES,
  PLATFORM_COMMISSION_RULES,
  calculateCommissionAmount,
  calculateFirstPaymentBase,
  calculateMultiLocationTotal,
  calculateSubscriptionTotal,
  getLocationPlanFactor,
} from "@/lib/platform-admin-data";
import { getModuleLabel } from "@/lib/vertical";
import { getTenantModulesForVertical } from "@/lib/tenant-modules";
import { nextLeadAction, NEXT_ACTION_TONE_CLASSES } from "@/lib/platform/lead-next-action";
import type { TenantFeatureKey } from "@/lib/tenant";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import { useMailLauncher } from "@/components/admin/inbox/mail-launcher";
import { getMarket, normalizeMarketCode } from "@/lib/markets";

type Tab = "anagrafica" | "fatturazione" | "proposta" | "abbonamento" | "pagamenti" | "note";

type Venditore = { id: string; user_id: string; name: string; email: string; role: string };
type CurrentAdmin = { user_id: string; name: string; role: string };

type LeadProfileDraft = {
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
};

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "anagrafica", label: "Anagrafica", icon: Building2 },
  { value: "fatturazione", label: "Fatturazione", icon: Receipt },
  { value: "proposta", label: "Proposta", icon: BadgeEuro },
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
  const router = useRouter();
  const [lead, setLead] = useState<PlatformLead | null>(
    PLATFORM_LEADS.find((item) => item.id === leadId) ?? null,
  );
  const [subscription, setSubscription] = useState<PlatformSubscription | null>(null);
  const [payments, setPayments] = useState<PlatformPayment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("anagrafica");
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(lead?.notes ?? "");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showUpdateAnimaModal, setShowUpdateAnimaModal] = useState(false);
  const [venditori, setVenditori] = useState<Venditore[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [deletingLead, setDeletingLead] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const market = getMarket(normalizeMarketCode(lead?.country) ?? "IT");

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<CurrentAdmin>;
      })
      .then(setCurrentAdmin)
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/admin/venditori")
      .then((r) => r.json())
      .then((data: { venditori?: Venditore[] }) => setVenditori(data.venditori ?? []))
      .catch(() => null);
  }, []);

  useEffect(() => {
    setLoadingLead(true);
    fetch("/api/admin/leads")
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as {
          leads?: PlatformLead[];
          error?: string;
        };
        if (!r.ok) throw new Error(data.error ?? "Impossibile caricare il lead.");
        const dbLead = data.leads?.find((item) => item.id === leadId);
        if (!dbLead) throw new Error("Lead non trovato.");
        setLead(dbLead);
        setNoteText(dbLead.notes ?? "");
        // Abbonamento + pagamenti dal DB (fonte unica server).
        fetch("/api/admin/subscriptions")
          .then((r2) => r2.json())
          .then((subData: { subscriptions?: PlatformSubscription[]; payments?: PlatformPayment[] }) => {
            setSubscription(subData.subscriptions?.find((s) => s.lead_id === dbLead.id) ?? null);
            setPayments((subData.payments ?? []).filter((p) => p.lead_id === dbLead.id));
          })
          .catch(() => {});
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Impossibile caricare il lead."))
      .finally(() => setLoadingLead(false));
  }, [leadId]);

  useEffect(() => {
    if (!lead || !currentAdmin || lead.sales_owner_id !== currentAdmin.user_id || !lead.attention_kind) return;

    void fetch(`/api/admin/leads/${lead.id}/attention`, { method: "POST" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { cleared?: boolean };
        if (!payload.cleared) return;
        setLead((previous) => previous
          ? {
              ...previous,
              attention_kind: null,
              attention_for_user_id: null,
              attention_updated_at: null,
            }
          : previous);
        window.dispatchEvent(new Event("lead-attention:refresh"));
      })
      .catch(() => {});
  }, [currentAdmin, lead]);

  async function patchLead(payload: Record<string, unknown>) {
    setLeadSaving(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Errore durante il salvataggio.");
      return true;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Errore durante il salvataggio.");
      return false;
    } finally {
      setLeadSaving(false);
    }
  }

  async function changeStatus(status: LeadStatus) {
    const ok = await patchLead({ status });
    if (ok) setLead((prev) => prev ? { ...prev, status, updated_at: new Date().toISOString() } : prev);
  }

  async function saveProposal(proposal: {
    proposed_package_slug: string | null;
    proposed_addons: string[];
    proposed_extra_modules: TenantFeatureKey[];
    proposed_billing_cycle: BillingCycle;
    proposed_setup_amount: number;
    proposed_recurring_amount: number | null;
  }) {
    const ok = await patchLead(proposal);
    if (!ok) return;
    setLead((prev) =>
      prev
        ? { ...prev, ...proposal, proposal_updated_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        : prev,
    );
  }

  async function changeStage(stage: LeadStage) {
    // Perso (lost) = potenziale mai convertito → status "lost", NON "churned"
    // (churned è solo per chi era cliente e ha fatto recesso). Tenant = cliente attivo.
    const nextStatus: LeadStatus =
      stage === "tenant" ? "active" : stage === "lost" ? "lost" : lead?.status ?? "lead";
    const ok = await patchLead({ stage, status: nextStatus });
    if (ok) {
      setLead((prev) => prev ? {
        ...prev,
        stage,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      } : prev);
    }
  }

  async function saveNote() {
    const ok = await patchLead({ notes: noteText });
    if (!ok) return;
    setLead((prev) => prev ? { ...prev, notes: noteText, updated_at: new Date().toISOString() } : prev);
    setEditingNote(false);
  }

  async function deleteLead() {
    if (!lead || deletingLead) return;
    const tenantWarning = lead.tenant_id
      ? "\n\nIl tenant già creato resterà attivo e non verrà eliminato."
      : "";
    const confirmed = window.confirm(
      `Eliminare definitivamente il lead "${lead.business_name}"? Verranno rimossi anche abbonamenti, pagamenti e dati CRM collegati.${tenantWarning}`,
    );
    if (!confirmed) return;

    setDeletingLead(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Impossibile eliminare il lead.");
      router.replace("/admin/crm");
      router.refresh();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Impossibile eliminare il lead.");
      setDeletingLead(false);
    }
  }

  async function saveProfile(draft: LeadProfileDraft) {
    if (!lead) return false;
    const usesLocations = lead.business_vertical !== "creative";
    const primaryLocation = lead.locations.find((location) => location.is_primary) ?? lead.locations[0];
    const payload = {
      business_name: draft.business_name,
      contact_name: draft.contact_name || null,
      contact_email: draft.contact_email || null,
      contact_phone: draft.contact_phone || null,
      country: draft.country,
      ...(usesLocations
        ? {
            address: draft.address || null,
            city: draft.city || null,
            province: draft.province || null,
            postal_code: draft.postal_code || null,
            primary_location: {
              address: draft.address || null,
              city: draft.city || null,
              province: draft.province || null,
              postal_code: draft.postal_code || null,
              country: draft.country,
            },
          }
        : {}),
    };
    const ok = await patchLead(payload);
    if (!ok) return false;

    const now = new Date().toISOString();
    setLead((prev) => prev ? {
      ...prev,
      business_name: draft.business_name,
      contact_name: draft.contact_name || null,
      contact_email: draft.contact_email || null,
      contact_phone: draft.contact_phone || null,
      address: usesLocations ? draft.address || null : null,
      city: usesLocations ? draft.city || null : null,
      province: usesLocations ? draft.province || null : null,
      postal_code: usesLocations ? draft.postal_code || null : null,
      country: draft.country,
      updated_at: now,
      locations: !usesLocations
        ? []
        : primaryLocation
        ? prev.locations.map((location) =>
            location.id === primaryLocation.id
              ? {
                  ...location,
                  address: draft.address || null,
                  city: draft.city || null,
                  province: draft.province || null,
                  postal_code: draft.postal_code || null,
                  country: draft.country,
                }
              : location,
          )
        : [
            {
              id: `primary-${prev.id}`,
              name: "Sede principale",
              address: draft.address || null,
              city: draft.city || null,
              province: draft.province || null,
              postal_code: draft.postal_code || null,
              country: draft.country,
              is_primary: true,
            },
          ],
    } : prev);
    return true;
  }

  async function assignVenditore(venditore: Venditore) {
    setAssignSaving(true);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_owner_id: venditore.user_id,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Impossibile assegnare il lead.");
      setLead((prev) => prev ? {
        ...prev,
        sales_owner_id: venditore.user_id,
        sales_owner_name: venditore.name,
        attention_kind: "new",
        attention_for_user_id: venditore.user_id,
        attention_updated_at: new Date().toISOString(),
      } : prev);
      window.dispatchEvent(new Event("lead-attention:refresh"));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Impossibile assegnare il lead.");
    } finally {
      setAssignSaving(false);
    }
  }

  function confirmSale(payload: SalePayload) {
    if (!lead) return;
    const selectedPackage = PLATFORM_PACKAGES.find((item) => item.id === payload.packageId) ?? PLATFORM_PACKAGES[0];
    const now = new Date().toISOString();
    const tenantId = lead.business_slug ?? lead.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const nextRenewal = new Date();
    nextRenewal.setMonth(nextRenewal.getMonth() + (payload.billingCycle === "monthly" ? 1 : 12));

    const newSubscription: PlatformSubscription = {
      id: subscription?.id ?? `sub-${lead.id}`,
      lead_id: lead.id,
      package_id: selectedPackage.id,
      package_slug: selectedPackage.slug,
      contract_id: null,
      tenant_id: tenantId,
      billing_cycle: payload.billingCycle,
      price_override: payload.recurringAmount,
      setup_amount: payload.setupAmount,
      first_payment_amount: payload.firstPaymentAmount,
      payment_method: null,
      official_domain: lead.official_domain,
      currency: "EUR",
      status: "active",
      started_at: now.slice(0, 10),
      trial_ends_at: null,
      current_period_start: now.slice(0, 10),
      current_period_end: nextRenewal.toISOString().slice(0, 10),
      next_renewal_at: nextRenewal.toISOString().slice(0, 10),
      activated_at: now,
      suspended_at: null,
      grace_until: null,
      last_reminder_at: null,
      cancelled_at: null,
      notes: payload.notes || null,
      created_at: subscription?.created_at ?? now,
      updated_at: now,
      lead: { ...lead, status: "active", stage: "tenant", tenant_id: tenantId, converted_at: now },
      package: selectedPackage,
      location_plans: lead.business_vertical === "creative"
        ? []
        : lead.locations.map((location, index) => ({
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
      kind: "first",
      payment_method: null,
      payment_date: null,
      paid_at: null,
      due_date: now.slice(0, 10),
      reminder_sent_at: null,
      invoice_number: null,
      notes: "Primo pagamento generato dalla conferma vendita.",
      stripe_payment_link: null,
      bunq_request_id: null,
      bunq_payment_url: null,
      payment_provider: null,
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

    setLead((prev) => prev ? {
      ...prev,
      status: "active",
      stage: "tenant",
      tenant_id: tenantId,
      converted_at: now,
      sales_owner_id: prev.sales_owner_id ?? "sales-unassigned",
      sales_owner_name: prev.sales_owner_name ?? "Venditore non assegnato",
    } : prev);
    setSubscription(newSubscription);
    setPayments((prev) => [newPayment, ...prev.filter((item) => item.id !== newPayment.id)]);
    setShowSaleModal(false);
  }

  if (!lead && loadingLead) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/crm"
          className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/70 transition hover:border-pork-red/30 hover:text-pork-red"
        >
          <ArrowLeft size={15} /> CRM
        </Link>
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
          <p className="text-pork-ink/50">Caricamento lead...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/crm"
          className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/70 transition hover:border-pork-red/30 hover:text-pork-red"
        >
          <ArrowLeft size={15} /> CRM
        </Link>
        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {loadError}
          </div>
        )}
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
          <p className="text-pork-ink/50">Lead non trovato.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {loadError}
        </div>
      )}

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
            {lead.contact_name || "Referente non inserito"}
            {lead.contact_email && ` · ${lead.contact_email}`}
            {lead.city && ` · ${lead.city} (${lead.province})`}
          </p>
        </div>

        {/* Azioni header */}
        <div className="flex flex-wrap items-center gap-2">
          {(currentAdmin?.role === "superadmin" || currentAdmin?.role === "admin") && (
            <button
              type="button"
              onClick={deleteLead}
              disabled={deletingLead}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deletingLead ? "Eliminazione..." : "Elimina lead"}
            </button>
          )}
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
              disabled={leadSaving}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
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

      {/* Prossima azione consigliata */}
      {(() => {
        const action = nextLeadAction(lead, subscription, payments);
        return (
          <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 ring-1", NEXT_ACTION_TONE_CLASSES[action.tone])}>
            <span className="text-[11px] font-black uppercase tracking-wide opacity-70">Prossima azione</span>
            <span className="font-bold">{action.label}</span>
            <span className="text-sm opacity-80">{action.detail}</span>
            {action.href && (
              <Link href={action.href} className="ml-auto rounded-full bg-white/70 px-3 py-1 text-xs font-bold ring-1 ring-black/10 hover:bg-white">
                Vai →
              </Link>
            )}
          </div>
        );
      })()}

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
            onSaveProfile={saveProfile}
            saving={leadSaving}
          />
        )}
        {activeTab === "fatturazione" && <TabFatturazione lead={lead} />}
        {activeTab === "proposta" && (
          <TabProposta lead={lead} onSave={saveProposal} saving={leadSaving} />
        )}
        {activeTab === "abbonamento" && (
          <TabAbbonamento
            subscription={subscription}
            lead={lead}
            onCancelled={() => {
              const now = new Date().toISOString();
              setSubscription((prev) => (prev ? { ...prev, status: "cancelled", cancelled_at: now } : prev));
              setLead((prev) => (prev ? { ...prev, status: "churned", updated_at: now } : prev));
            }}
          />
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
            saving={leadSaving}
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
              : lead.business_vertical === "creative"
                ? `https://demo.weuseorpheo.com/${lead.business_slug}/figma`
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

// ─── Tab Proposta commerciale ─────────────────────────────────────────────────
// Si compila prima della demo: pacchetto + addon + moduli sfusi + ciclo + prezzi.
// Alimenta la creazione della demo, la pre-compilazione del contratto e l'abbonamento.

function TabProposta({
  lead,
  onSave,
  saving,
}: {
  lead: PlatformLead;
  onSave: (proposal: {
    proposed_package_slug: string | null;
    proposed_addons: string[];
    proposed_extra_modules: TenantFeatureKey[];
    proposed_billing_cycle: BillingCycle;
    proposed_setup_amount: number;
    proposed_recurring_amount: number | null;
  }) => void;
  saving: boolean;
}) {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const usesLocations = lead.business_vertical !== "creative";
  const availablePackages = PLATFORM_PACKAGES.filter(
    (p) => p.vertical === "both" || p.vertical === lead.business_vertical,
  );
  const defaultPkg =
    availablePackages.find((p) => p.slug === lead.proposed_package_slug) ?? availablePackages[0];

  const pkgBase = (pkg: (typeof availablePackages)[number], cycle: BillingCycle) =>
    cycle === "yearly" ? pkg.price_yearly ?? pkg.price_monthly * 12 : pkg.price_monthly;
  const pkgMulti = (pkg: (typeof availablePackages)[number], cycle: BillingCycle) => {
    const base = pkgBase(pkg, cycle);
    return usesLocations ? calculateMultiLocationTotal(base, lead.locations) : base;
  };
  const addonsTotal = (addonSlugs: string[], cycle: BillingCycle) =>
    PLATFORM_ADDON_PACKAGES.filter((a) => addonSlugs.includes(a.slug)).reduce(
      (sum, a) => sum + (cycle === "yearly" ? a.price_yearly ?? a.price_monthly * 12 : a.price_monthly),
      0,
    );
  const computeRecurring = (
    pkg: (typeof availablePackages)[number] | undefined,
    cycle: BillingCycle,
    addonSlugs: string[],
  ) => round2((pkg ? pkgMulti(pkg, cycle) : 0) + addonsTotal(addonSlugs, cycle));

  const [packageSlug, setPackageSlug] = useState(defaultPkg?.slug ?? "");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(lead.proposed_billing_cycle ?? "monthly");
  const [addons, setAddons] = useState<string[]>(lead.proposed_addons ?? []);
  const [extraModules, setExtraModules] = useState<TenantFeatureKey[]>(lead.proposed_extra_modules ?? []);
  const [setupAmount, setSetupAmount] = useState<number>(
    lead.proposed_setup_amount ?? defaultPkg?.setup_amount ?? 490,
  );
  const [recurringAmount, setRecurringAmount] = useState<number>(
    lead.proposed_recurring_amount ?? computeRecurring(defaultPkg, lead.proposed_billing_cycle ?? "monthly", lead.proposed_addons ?? []),
  );

  const selectedPackage = availablePackages.find((p) => p.slug === packageSlug) ?? defaultPkg;
  const computedRecurring = computeRecurring(selectedPackage, billingCycle, addons);
  const isOverride = round2(recurringAmount) !== computedRecurring;
  const firstPayment = round2(setupAmount + recurringAmount);

  function selectPackage(slug: string) {
    const next = availablePackages.find((p) => p.slug === slug) ?? selectedPackage;
    setPackageSlug(next?.slug ?? "");
    setRecurringAmount(computeRecurring(next, billingCycle, addons));
    if (next?.setup_amount != null) setSetupAmount(next.setup_amount);
  }
  function selectCycle(cycle: BillingCycle) {
    setBillingCycle(cycle);
    setRecurringAmount(computeRecurring(selectedPackage, cycle, addons));
  }
  function toggleAddon(slug: string) {
    const next = addons.includes(slug) ? addons.filter((s) => s !== slug) : [...addons, slug];
    setAddons(next);
    setRecurringAmount(computeRecurring(selectedPackage, billingCycle, next));
  }
  function toggleExtraModule(key: TenantFeatureKey) {
    setExtraModules((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  // Moduli sfusi: quelli del verticale non già inclusi nel pacchetto né negli addon AI.
  const addonModuleKeys = new Set<TenantFeatureKey>(["aiPhone", "aiWhatsapp"]);
  const packageModuleKeys = new Set(selectedPackage?.modules ?? []);
  const extraModuleOptions = getTenantModulesForVertical(lead.business_vertical)
    .map((m) => m.key)
    .filter((k) => !packageModuleKeys.has(k) && !addonModuleKeys.has(k));

  function handleSave() {
    onSave({
      proposed_package_slug: selectedPackage?.slug ?? null,
      proposed_addons: addons,
      proposed_extra_modules: extraModules,
      proposed_billing_cycle: billingCycle,
      proposed_setup_amount: setupAmount,
      // Persistiamo sempre il canone effettivo concordato (multi-sede + addon inclusi),
      // così alimenta contratto e abbonamento senza ricalcoli.
      proposed_recurring_amount: recurringAmount,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="headline text-xl">Proposta commerciale</h3>
        <p className="mt-1 text-sm text-pork-ink/55">
          Scegli pacchetto, add-on e condizioni <strong>prima</strong> di creare la demo. Questa proposta
          guida demo, contratto e abbonamento.
        </p>
        {lead.proposal_updated_at && (
          <p className="mt-1 text-xs text-pork-ink/40">Ultimo aggiornamento: {fmt(lead.proposal_updated_at)}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-xs font-black uppercase tracking-wide text-pork-ink/45">Pacchetto</span>
          <select
            value={packageSlug}
            onChange={(e) => selectPackage(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-pork-ink/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-pork-red/30"
          >
            {availablePackages.map((pkg) => (
              <option key={pkg.slug} value={pkg.slug}>
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
                onClick={() => selectCycle(cycle)}
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

        <MoneyInput label="Setup" value={setupAmount} onChange={setSetupAmount} />
      </div>

      {/* Add-on */}
      <div>
        <span className="text-xs font-black uppercase tracking-wide text-pork-ink/45">Add-on</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORM_ADDON_PACKAGES.map((addon) => {
            const active = addons.includes(addon.slug);
            return (
              <button
                key={addon.slug}
                onClick={() => toggleAddon(addon.slug)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-bold transition",
                  active
                    ? "border-pork-green bg-pork-green/10 text-pork-green"
                    : "border-pork-ink/15 text-pork-ink/60 hover:text-pork-ink",
                )}
              >
                {addon.name} · {eur(billingCycle === "yearly" ? addon.price_yearly ?? addon.price_monthly * 12 : addon.price_monthly)}
                /{billingCycle === "yearly" ? "anno" : "mese"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Moduli sfusi */}
      {extraModuleOptions.length > 0 && (
        <div>
          <span className="text-xs font-black uppercase tracking-wide text-pork-ink/45">
            Moduli sfusi (oltre il pacchetto)
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {extraModuleOptions.map((key) => {
              const active = extraModules.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleExtraModule(key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                    active
                      ? "border-pork-ink bg-pork-ink text-pork-cream"
                      : "border-pork-ink/15 text-pork-ink/55 hover:text-pork-ink",
                  )}
                >
                  {getModuleLabel(key, lead.business_vertical)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Canone concordato */}
      <div className="grid gap-4 md:grid-cols-2">
        <MoneyInput
          label={billingCycle === "yearly" ? "Canone annuale" : "Canone mensile"}
          value={recurringAmount}
          onChange={setRecurringAmount}
        />
        <div className="flex flex-col justify-end">
          <p className="text-xs text-pork-ink/45">
            Listino calcolato: <strong>{eur(computedRecurring)}</strong>
            {usesLocations && lead.locations.length > 1 && " (multi-sede incluso)"}
          </p>
          {isOverride && (
            <button
              onClick={() => setRecurringAmount(computedRecurring)}
              className="mt-1 w-fit text-xs font-bold text-pork-red hover:underline"
            >
              Ripristina da listino
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl bg-pork-cream p-4 sm:grid-cols-3">
        <SummaryMetric label="Canone ricorrente" value={`${eur(recurringAmount)}/${billingCycle === "yearly" ? "anno" : "mese"}`} strong />
        <SummaryMetric label="Setup (una tantum)" value={eur(setupAmount)} />
        <SummaryMetric label="Primo pagamento" value={eur(firstPayment)} />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/admin/contratti/nuovo?leadId=${lead.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-5 py-2.5 text-sm font-bold text-pork-ink/70 hover:text-pork-ink"
        >
          <FileText size={15} /> Crea contratto da questa proposta
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-pork-green px-5 py-2.5 text-sm font-bold text-white hover:bg-pork-green/90 disabled:opacity-50"
        >
          <Save size={15} /> {saving ? "Salvataggio…" : "Salva proposta"}
        </button>
      </div>
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
  const usesLocations = lead.business_vertical !== "creative";
  const [recurringAmount, setRecurringAmount] = useState(
    subscription?.price_override ??
      (usesLocations ? calculateMultiLocationTotal(defaultBaseAmount, lead.locations) : defaultBaseAmount),
  );
  const [setupAmount, setSetupAmount] = useState(subscription?.setup_amount ?? 490);
  const [notes, setNotes] = useState(subscription?.notes ?? "");

  const selectedPackage = PLATFORM_PACKAGES.find((item) => item.id === packageId) ?? defaultPackage;
  const sellerRate = PLATFORM_COMMISSION_RULES.find((rule) => rule.role === "venditore")?.commission_rate ?? 30;
  const leadInsertRate = PLATFORM_COMMISSION_RULES.find((rule) => rule.role === "lead_inserter")?.commission_rate ?? 10;
  const locationsCount = usesLocations ? Math.max(lead.locations.length, 1) : 0;
  const extraLocationsCount = Math.max(locationsCount - 1, 0);
  const firstPaymentAmount = setupAmount + recurringAmount;
  const commissionAmount = calculateCommissionAmount(firstPaymentAmount, sellerRate);
  const leadInsertCommissionAmount = calculateCommissionAmount(firstPaymentAmount, leadInsertRate);

  function packageBaseAmount(pkg = selectedPackage, cycle = billingCycle) {
    return cycle === "yearly" ? pkg.price_yearly ?? pkg.price_monthly * 12 : pkg.price_monthly;
  }

  function packageMultiLocationAmount(pkg = selectedPackage, cycle = billingCycle) {
    const baseAmount = packageBaseAmount(pkg, cycle);
    return usesLocations ? calculateMultiLocationTotal(baseAmount, lead.locations) : baseAmount;
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

          <MoneyInput label={billingCycle === "monthly" ? "Canone primo mese" : "Canone annuale"} value={recurringAmount} onChange={setRecurringAmount} />
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

        <div className="mt-6 grid gap-3 rounded-2xl bg-pork-cream p-4 sm:grid-cols-4">
          <SummaryMetric label="Primo pagamento" value={eur(firstPaymentAmount)} />
          <SummaryMetric label="Chiusura" value={`${sellerRate}% · ${eur(commissionAmount)}`} strong />
          <SummaryMetric label="Inserimento lead" value={`${leadInsertRate}% · ${eur(leadInsertCommissionAmount)}`} />
          <SummaryMetric label="Base calcolo" value="setup + canone" />
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
  onSaveProfile,
  saving,
}: {
  lead: PlatformLead;
  onStatusChange: (status: LeadStatus) => void | Promise<void>;
  venditori: Venditore[];
  onAssign: (v: Venditore) => void;
  assignSaving: boolean;
  onSaveProfile: (draft: LeadProfileDraft) => Promise<boolean>;
  saving: boolean;
}) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [draft, setDraft] = useState<LeadProfileDraft>(() => ({
    business_name: lead.business_name,
    contact_name: lead.contact_name ?? "",
    contact_email: lead.contact_email ?? "",
    contact_phone: lead.contact_phone ?? "",
    address: lead.address ?? lead.locations.find((location) => location.is_primary)?.address ?? "",
    city: lead.city ?? lead.locations.find((location) => location.is_primary)?.city ?? "",
    province: lead.province ?? lead.locations.find((location) => location.is_primary)?.province ?? "",
    postal_code: lead.postal_code ?? lead.locations.find((location) => location.is_primary)?.postal_code ?? "",
    country: normalizeMarketCode(lead.country) ?? "IT",
  }));
  const phoneHref = lead.contact_phone ? `tel:${lead.contact_phone.replace(/\s/g, "")}` : null;
  const whatsappHref = lead.contact_phone ? `https://wa.me/${lead.contact_phone.replace(/[^\d]/g, "")}` : null;
  const mailLauncher = useMailLauncher();
  const market = getMarket(normalizeMarketCode(lead.country) ?? "IT");

  useEffect(() => {
    if (editingProfile) return;
    const primary = lead.locations.find((location) => location.is_primary) ?? lead.locations[0];
    setDraft({
      business_name: lead.business_name,
      contact_name: lead.contact_name ?? "",
      contact_email: lead.contact_email ?? "",
      contact_phone: lead.contact_phone ?? "",
      address: lead.address ?? primary?.address ?? "",
      city: lead.city ?? primary?.city ?? "",
      province: lead.province ?? primary?.province ?? "",
      postal_code: lead.postal_code ?? primary?.postal_code ?? "",
      country: normalizeMarketCode(lead.country) ?? "IT",
    });
  }, [editingProfile, lead]);

  function setDraftField<K extends keyof LeadProfileDraft>(key: K, value: LeadProfileDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function submitProfile() {
    const ok = await onSaveProfile(draft);
    if (ok) setEditingProfile(false);
  }

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

      <div className="flex items-center justify-between gap-3">
        <SectionTitle icon={Building2}>Attività</SectionTitle>
        {editingProfile ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditingProfile(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full border border-pork-ink/10 px-3 py-2 text-xs font-black text-pork-ink/55 hover:text-pork-ink disabled:opacity-50"
            >
              <X size={13} /> Annulla
            </button>
            <button
              type="button"
              onClick={submitProfile}
              disabled={saving || !draft.business_name.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-pork-red px-3 py-2 text-xs font-black text-white hover:bg-pork-red/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={13} /> {saving ? "Salvataggio..." : "Salva dati"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingProfile(true)}
            className="inline-flex items-center gap-2 rounded-full border border-pork-ink/10 px-3 py-2 text-xs font-black text-pork-ink/55 hover:border-pork-red/30 hover:text-pork-red"
          >
            <Pencil size={13} /> Modifica dati
          </button>
        )}
      </div>

      {editingProfile ? (
        <div className="grid gap-4 rounded-2xl border border-pork-ink/10 bg-pork-ink/2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <EditField label="Nome attività" value={draft.business_name} onChange={(value) => setDraftField("business_name", value)} required />
          <EditField label="Referente" value={draft.contact_name} onChange={(value) => setDraftField("contact_name", value)} />
          <EditField label="Email" value={draft.contact_email} onChange={(value) => setDraftField("contact_email", value)} type="email" />
          <EditField label="Telefono" value={draft.contact_phone} onChange={(value) => setDraftField("contact_phone", value)} type="tel" />
          {lead.business_vertical !== "creative" && (
            <>
              <EditField label="Indirizzo sede principale" value={draft.address} onChange={(value) => setDraftField("address", value)} />
              <EditField label="Città" value={draft.city} onChange={(value) => setDraftField("city", value)} />
              <EditField label="Provincia" value={draft.province} onChange={(value) => setDraftField("province", value)} />
              <EditField label="CAP" value={draft.postal_code} onChange={(value) => setDraftField("postal_code", value)} />
            </>
          )}
          <label>
            <span className="text-[10px] font-bold uppercase tracking-wide text-pork-ink/40">Nazione</span>
            <select
              value={draft.country}
              onChange={(event) => setDraftField("country", event.target.value)}
              className="mt-1 w-full rounded-xl border border-pork-ink/10 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-pork-red/25"
            >
              <option value="IT">Italia</option>
              <option value="SI">Slovenia</option>
              <option value="HR">Croazia</option>
              <option value="DE">Germania</option>
              <option value="AT">Austria</option>
              <option value="FR">Francia</option>
              <option value="ES">Spagna</option>
            </select>
          </label>
        </div>
      ) : (
      <FieldGrid>
        <Field label="Nome attività" value={lead.business_name} />
        <Field label="Slug / futuro ID tenant" value={lead.business_slug} />
        <Field label="Nazione / mercato" value={`${market.flag} ${market.name} (${market.code})`} />
      </FieldGrid>
      )}

      <SectionTitle icon={User}>Responsabile</SectionTitle>
      <FieldGrid>
        <Field label="Nome" value={lead.contact_name} />
        {(() => {
          const contactEmail = lead.contact_email;
          return (
        <ActionField
          label="Email"
          value={contactEmail}
          onClick={contactEmail ? () => mailLauncher.open({
            to:      contactEmail,
            brand:   lead.business_vertical === "services" || lead.business_vertical === "creative" ? "bizery" : "menuary",
            subject: lead.business_name ? `${lead.business_name} · contatto da Menuary` : undefined,
          }) : undefined}
          icon={Mail}
        />
          );
        })()}
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

      {(lead.business_type ||
        (lead.requested_services?.length ?? 0) > 0 ||
        (lead.pain_points?.length ?? 0) > 0 ||
        lead.last_whatsapp_at) && (
        <>
          <SectionTitle icon={MessageCircle}>Qualificazione WhatsApp</SectionTitle>
          <div className="grid gap-3 rounded-2xl border border-pork-green/15 bg-pork-green/5 p-4 md:grid-cols-2">
            <Field
              label="Ambito rilevato"
              value={
                lead.whatsapp_inferred_vertical === "food"
                  ? "Menuary"
                  : lead.whatsapp_inferred_vertical === "services"
                    ? "Bizery"
                    : lead.whatsapp_inferred_vertical === "creative"
                      ? "Orpheo"
                      : lead.whatsapp_inferred_vertical === "other"
                        ? "Studio / altro"
                        : "Da qualificare"
              }
            />
            <Field
              label="Confidenza ambito"
              value={`${Math.round((lead.whatsapp_vertical_confidence ?? 0) * 100)}%`}
            />
            <Field label="Tipo attività / progetto" value={lead.business_type} />
            <Field label="Ultimo contatto WhatsApp" value={lead.last_whatsapp_at ? fmt(lead.last_whatsapp_at) : null} />
            <Field
              label="Servizi di interesse"
              value={lead.requested_services?.length ? lead.requested_services.join(", ") : null}
            />
            <Field
              label="Pain point"
              value={lead.pain_points?.length ? lead.pain_points.join("; ") : null}
            />
          </div>
        </>
      )}

      {lead.business_vertical !== "creative" && (
        <>
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
        </>
      )}

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

      {/* Assegnazione responsabile */}
      <div className="rounded-2xl border border-pork-ink/10 bg-pork-ink/2 p-4">
        <div className="mb-2 flex items-center gap-2">
          <UserCheck size={14} className="text-pork-red" />
          <p className="text-xs font-black uppercase tracking-wide text-pork-ink/50">
            Responsabile assegnato
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            disabled={assignSaving}
            value={lead.sales_owner_id ?? ""}
            onChange={(e) => {
              const v = venditori.find((x) => x.user_id === e.target.value);
              if (v) onAssign(v);
            }}
            className="flex-1 rounded-xl border border-pork-ink/10 bg-white px-3 py-2.5 text-sm font-semibold text-pork-ink focus:outline-none focus:ring-2 focus:ring-pork-red/25 disabled:opacity-50"
          >
            <option value="" disabled>— Seleziona responsabile —</option>
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
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["lead", "prospect", "active", "suspended", "churned", "lost"] as LeadStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            disabled={saving}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
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

function TabAbbonamento({
  subscription,
  lead,
  onCancelled,
}: {
  subscription: PlatformSubscription | null;
  lead: PlatformLead;
  onCancelled: () => void;
}) {
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function submitCancel() {
    if (!subscription) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/admin/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id, reason: cancelReason }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Errore durante il recesso.");
      setShowCancel(false);
      setCancelReason("");
      onCancelled();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Errore durante il recesso.");
    } finally {
      setCancelling(false);
    }
  }

  const canCancel =
    subscription !== null &&
    subscription.status !== "cancelled" &&
    subscription.status !== "trial";

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
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-bold",
              SUBSCRIPTION_STATUS_COLORS[subscription.status],
            )}
          >
            {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
          </span>
          {canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              className="rounded-full border border-pork-red/30 px-3 py-1.5 text-sm font-bold text-pork-red hover:bg-pork-red/5"
            >
              Registra recesso
            </button>
          )}
        </div>
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
        {lead.business_vertical !== "creative" && (
          <Field label="Sedi associate" value={String(subscription.location_plans?.length ?? lead.locations.length)} />
        )}
      </FieldGrid>

      {lead.business_vertical !== "creative" && subscription.location_plans && subscription.location_plans.length > 0 && (
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

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pork-ink/55 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <p className="impact-title text-xs text-pork-red">Recesso cliente</p>
            <h3 className="headline text-2xl">{lead.business_name}</h3>
            <p className="mt-2 text-sm text-pork-ink/60">
              Registri il <strong>recesso</strong> del cliente. L&apos;abbonamento passa a
              <strong> cancellato</strong>, il tenant va offline e il lead diventa
              <strong> churned</strong>. L&apos;azione non è automaticamente reversibile.
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-wide text-pork-ink/45">Motivo (opzionale)</span>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-pork-ink/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pork-red/30"
                placeholder="Es. disdetta a fine periodo, passaggio a concorrente, chiusura attività…"
              />
            </label>
            {cancelError && <p className="mt-2 text-sm font-semibold text-pork-red">{cancelError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setShowCancel(false); setCancelError(null); }}
                disabled={cancelling}
                className="rounded-full border border-pork-ink/15 px-5 py-2.5 text-sm font-bold text-pork-ink/60 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={submitCancel}
                disabled={cancelling}
                className="rounded-full bg-pork-red px-5 py-2.5 text-sm font-bold text-white hover:bg-pork-red/90 disabled:opacity-50"
              >
                {cancelling ? "Registrazione…" : "Conferma recesso"}
              </button>
            </div>
          </div>
        </div>
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
  saving,
}: {
  note: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void | Promise<void>;
  onChange: (v: string) => void;
  saving: boolean;
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
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-pork-red px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} /> {saving ? "Salvataggio..." : "Salva"}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/60 disabled:cursor-not-allowed disabled:opacity-50"
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
  vertical: "food" | "services" | "creative";
  size?: number;
}) {
  if (vertical === "food") return <UtensilsCrossed size={size} />;
  if (vertical === "creative") return <Palette size={size} />;
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

function EditField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-[10px] font-bold uppercase tracking-wide text-pork-ink/40">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-pork-ink/10 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-pork-red/25"
      />
    </label>
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
