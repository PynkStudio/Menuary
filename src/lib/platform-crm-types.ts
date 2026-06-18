import type { TenantFeatureKey } from "@/lib/tenant";

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "demo"
  | "proposal"
  | "contract"
  | "tenant"
  | "lost";
export type LeadTemperature = "cold" | "warm" | "hot";
// Due cicli reali: pipeline commerciale (lead→prospect→won/lost) e ciclo cliente
// (active→suspended→churned). `lost` = potenziale mai convertito; `churned` = ex
// cliente che ha fatto recesso (abbonamento cancelled); `suspended` = cliente
// offline per mancato pagamento (dunning, recuperabile).
export type LeadStatus = "lead" | "prospect" | "active" | "suspended" | "churned" | "lost";
export type LeadSource = "form_web" | "referral" | "diretto" | "evento" | "manuale" | "altro";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "trial" | "pending_payment" | "active" | "suspended" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "bonifico" | "carta" | "sepa" | "bunq" | "altro";
export type CommissionStatus = "pending" | "approved" | "paid";
export type LeadAttentionKind = "new" | "updated";

export type LeadLocation = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  is_primary: boolean;
};

export type TenantLocationPlan = LeadLocation & {
  package_slug: string;
  package_name: string;
  price_factor: number;
};

export type PlatformLead = {
  id: string;
  // Attività
  business_name: string;
  business_slug: string | null;
  business_vertical: "food" | "services" | "creative";
  // Responsabile
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  // Sede
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  // Fatturazione
  billing_name: string | null;
  billing_vat: string | null;
  billing_cf: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_province: string | null;
  billing_postal_code: string | null;
  billing_sdi: string | null;
  billing_pec: string | null;
  // CRM
  status: LeadStatus;
  stage: LeadStage;
  temperature: LeadTemperature;
  source: LeadSource | null;
  notes: string | null;
  business_type?: string | null;
  requested_services?: string[];
  pain_points?: string[];
  whatsapp_qualification?: Record<string, unknown>;
  whatsapp_inferred_vertical?: "unknown" | "food" | "services" | "creative" | "other";
  whatsapp_vertical_confidence?: number;
  last_whatsapp_at?: string | null;
  locations: LeadLocation[];
  demo_url: string | null;
  demo_pr_url: string | null;
  official_domain: string | null;
  official_domain_active: boolean;
  // Proposta commerciale (scelta prima della demo, alimenta demo/contratto/abbonamento)
  proposed_package_slug: string | null;
  proposed_addons: string[];
  proposed_extra_modules: TenantFeatureKey[];
  proposed_billing_cycle: BillingCycle | null;
  proposed_setup_amount: number | null;
  proposed_recurring_amount: number | null;
  proposal_updated_at: string | null;
  tenant_id: string | null;
  converted_at: string | null;
  sales_owner_id: string | null;
  sales_owner_name: string | null;
  attention_kind?: LeadAttentionKind | null;
  attention_for_user_id?: string | null;
  attention_updated_at?: string | null;
  created_by_id: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformPackage = {
  id: string;
  name: string;
  slug: string;
  vertical: "food" | "services" | "creative" | "both";
  adapted_name?: string | null;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  /** Prezzo pieno mensile (per calcolo sconto annuale) */
  price_monthly_real?: number | null;
  setup_amount?: number;
  annual_discount_pct?: number;
  currency: string;
  modules: TenantFeatureKey[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PlatformSubscription = {
  id: string;
  lead_id: string;
  package_id: string | null;
  package_slug: string | null;
  contract_id: string | null;
  tenant_id: string | null;
  billing_cycle: BillingCycle;
  price_override: number | null;
  setup_amount: number | null;
  first_payment_amount: number | null;
  payment_method: PaymentMethod | null;
  official_domain: string | null;
  currency: string;
  status: SubscriptionStatus;
  started_at: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_renewal_at: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  grace_until: string | null;
  last_reminder_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // join
  lead?: PlatformLead;
  package?: PlatformPackage;
  location_plans?: TenantLocationPlan[];
};

export type PlatformPayment = {
  id: string;
  subscription_id: string;
  lead_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  kind: "first" | "renewal";
  payment_method: PaymentMethod | null;
  payment_date: string | null;
  paid_at: string | null;
  due_date: string | null;
  reminder_sent_at: string | null;
  invoice_number: string | null;
  invoice_date?: string | null;
  invoice_file_path?: string | null;
  invoice_file_name?: string | null;
  invoice_uploaded_at?: string | null;
  notes: string | null;
  stripe_payment_link: string | null;
  bunq_request_id: number | null;
  bunq_payment_url: string | null;
  payment_provider: "manual" | "stripe" | "bunq" | null;
  billing_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type PlatformCommissionRule = {
  role: "superadmin" | "admin" | "venditore" | "amministrazione" | "gestore" | "lead_inserter";
  label: string;
  commission_rate: number;
  applies_to_sales: boolean;
};

export type PlatformCommission = {
  id: string;
  lead_id: string;
  tenant_id: string | null;
  subscription_id: string;
  payment_id: string;
  seller_id: string;
  seller_name: string;
  seller_role: PlatformCommissionRule["role"];
  commission_kind: "closing" | "lead_insert";
  business_name: string;
  package_name: string;
  billing_cycle: BillingCycle;
  recurring_amount: number;
  setup_amount: number;
  first_payment_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: CommissionStatus;
  closed_at: string;
  paid_at: string | null;
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export type LeadVertical = "food" | "services" | "creative";

export const VERTICAL_LABELS: Record<LeadVertical, string> = {
  food: "Menuary · Food",
  services: "Bizery · Services",
  creative: "Orpheo · Creative",
};

export const VERTICAL_SHORT_LABELS: Record<LeadVertical, string> = {
  food: "Menuary",
  services: "Bizery",
  creative: "Orpheo",
};

/** Classi Tailwind per badge verticale — usa colori brand hardcoded (contesto admin). */
export const VERTICAL_BADGE_CLASSES: Record<LeadVertical, string> = {
  food:     "bg-amber-100 text-amber-800",
  services: "bg-blue-100 text-blue-700",
  creative: "bg-fuchsia-100 text-fuchsia-700",
};

export const VERTICAL_DOT_CLASSES: Record<LeadVertical, string> = {
  food:     "bg-amber-500",
  services: "bg-blue-500",
  creative: "bg-fuchsia-500",
};

// ─── Labels UI ─────────────────────────────────────────────────────────────────

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  lead: "Lead",
  prospect: "Prospect",
  active: "Attivo",
  suspended: "Sospeso",
  churned: "Churned",
  lost: "Perso",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  lead: "bg-pork-ink/10 text-pork-ink/70",
  prospect: "bg-pork-mustard/30 text-pork-ink",
  active: "bg-pork-green/20 text-pork-green",
  suspended: "bg-orange-100 text-orange-700",
  churned: "bg-pork-red/10 text-pork-red",
  lost: "bg-pork-ink/5 text-pork-ink/45",
};

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "Nuovo",
  contacted: "Contattato",
  qualified: "Qualificato",
  demo: "Demo",
  proposal: "Proposta",
  contract: "Contratto",
  tenant: "Venduto / tenant",
  lost: "Perso",
};

export const LEAD_STAGE_COLORS: Record<LeadStage, string> = {
  new: "bg-pork-ink/10 text-pork-ink/70",
  contacted: "bg-sky-100 text-sky-700",
  qualified: "bg-blue-100 text-blue-700",
  demo: "bg-indigo-100 text-indigo-700",
  proposal: "bg-pork-mustard/30 text-pork-ink",
  contract: "bg-purple-100 text-purple-700",
  tenant: "bg-pork-green/20 text-pork-green",
  lost: "bg-pork-red/10 text-pork-red",
};

export const LEAD_TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  cold: "Freddo",
  warm: "Tiepido",
  hot: "Caldo",
};

export const LEAD_TEMPERATURE_COLORS: Record<LeadTemperature, string> = {
  cold: "bg-slate-100 text-slate-600",
  warm: "bg-amber-100 text-amber-800",
  hot: "bg-red-100 text-red-700",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: "Trial",
  pending_payment: "In attesa di pagamento",
  active: "Attivo",
  suspended: "Sospeso",
  cancelled: "Cancellato",
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  trial: "bg-pork-mustard/30 text-pork-ink",
  pending_payment: "bg-amber-100 text-amber-800",
  active: "bg-pork-green/20 text-pork-green",
  suspended: "bg-pork-ink/10 text-pork-ink/60",
  cancelled: "bg-pork-red/10 text-pork-red",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "In attesa",
  paid: "Pagato",
  failed: "Fallito",
  refunded: "Rimborsato",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "bg-pork-mustard/30 text-pork-ink",
  paid: "bg-pork-green/20 text-pork-green",
  failed: "bg-pork-red/10 text-pork-red",
  refunded: "bg-pork-ink/10 text-pork-ink/60",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: "Da approvare",
  approved: "Approvata",
  paid: "Liquidata",
};

export const COMMISSION_STATUS_COLORS: Record<CommissionStatus, string> = {
  pending: "bg-pork-mustard/30 text-pork-ink",
  approved: "bg-sky-100 text-sky-700",
  paid: "bg-pork-green/20 text-pork-green",
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  form_web: "Form web",
  referral: "Referral",
  diretto: "Contatto diretto",
  evento: "Evento",
  manuale: "Manuale",
  altro: "Altro",
};

// ─── AI Order Revenue ──────────────────────────────────────────────────────────

export const AI_ORDER_SOURCES = ["retell", "whatsapp"] as const;
export type AIOrderSource = (typeof AI_ORDER_SOURCES)[number];

/**
 * Categoria dell'ordine AI rispetto al lifecycle di conferma.
 * - confirmed: ordine superato il countdown (fee applicata)
 * - non_concluded: scaduto o annullato (fee stornata)
 * - pending: ancora nel countdown dei 5 minuti (escluso dal calcolo)
 */
export type AIOrderCategory = "confirmed" | "non_concluded" | "pending";

/** Status DB che indicano ordine confermato e attivo */
export const AI_CONFIRMED_ORDER_STATUSES = [
  "nuovo",
  "in_preparazione",
  "pronto",
  "consegnato",
] as const;

/** Status DB che indicano ordine non concluso (da stornare) */
export const AI_NON_CONCLUDED_ORDER_STATUSES = ["expired", "annullato"] as const;

/** Stato addebito commissione su un ordine AI */
export type AIOrderBillingStatus =
  | "stripe"       // già addebitato da Stripe automaticamente
  | "cash_pending" // cash, commissione non ancora registrata
  | "cash_billed"; // cash, commissione registrata manualmente

export type PlatformAIOrder = {
  id: string;
  tenant_id: string;
  tenant_name: string;
  code: string;
  source: AIOrderSource;
  status: string;
  category: AIOrderCategory;
  customer_name: string | null;
  total: number;
  commission_rate: number;
  /** Importo commissione (positivo per confermati, negativo per stornati, 0 per pending) */
  commission_amount: number;
  payment_provider: string | null;
  payment_status: string;
  /** null = non ancora addebitato (cash); >0 = addebitato (stripe o manuale) */
  application_fee_amount_cents: number | null;
  billing_status: AIOrderBillingStatus;
  created_at: string;
};

export type PlatformNonAIOrderStat = {
  tenant_id: string;
  tenant_name: string;
  source: string;
  order_count: number;
  total_volume: number;
};

export const AI_ORDER_SOURCE_LABELS: Record<AIOrderSource, string> = {
  retell: "Telefono AI",
  whatsapp: "WhatsApp AI",
};

export const AI_ORDER_SOURCE_COLORS: Record<AIOrderSource, string> = {
  retell: "bg-violet-100 text-violet-700",
  whatsapp: "bg-emerald-100 text-emerald-700",
};

export const AI_ORDER_BILLING_LABELS: Record<AIOrderBillingStatus, string> = {
  stripe: "Stripe",
  cash_pending: "Cash — da addebitare",
  cash_billed: "Cash — addebitato",
};

export const AI_ORDER_BILLING_COLORS: Record<AIOrderBillingStatus, string> = {
  stripe: "bg-sky-100 text-sky-700",
  cash_pending: "bg-pork-mustard/30 text-pork-ink",
  cash_billed: "bg-pork-green/20 text-pork-green",
};

export const AI_ORDER_CATEGORY_LABELS: Record<AIOrderCategory, string> = {
  confirmed: "Confermato",
  non_concluded: "Non concluso",
  pending: "In attesa",
};

export const AI_ORDER_CATEGORY_COLORS: Record<AIOrderCategory, string> = {
  confirmed: "bg-pork-green/20 text-pork-green",
  non_concluded: "bg-pork-ink/10 text-pork-ink/50",
  pending: "bg-pork-mustard/25 text-pork-ink",
};

export const AI_COMMISSION_RATE = 0.03;
