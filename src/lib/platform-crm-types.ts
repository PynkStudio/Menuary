import type { TenantFeatureKey } from "@/lib/tenant";

export type LeadStatus = "lead" | "prospect" | "active" | "churned";
export type LeadSource = "form_web" | "referral" | "diretto" | "evento" | "altro";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "trial" | "active" | "suspended" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "bonifico" | "carta" | "sepa" | "altro";

export type PlatformLead = {
  id: string;
  // Attività
  business_name: string;
  business_slug: string | null;
  business_vertical: "food" | "services";
  // Responsabile
  contact_name: string;
  contact_email: string;
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
  source: LeadSource | null;
  notes: string | null;
  tenant_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformPackage = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
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
  package_id: string;
  billing_cycle: BillingCycle;
  price_override: number | null;
  currency: string;
  status: SubscriptionStatus;
  started_at: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_renewal_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // join
  lead?: PlatformLead;
  package?: PlatformPackage;
};

export type PlatformPayment = {
  id: string;
  subscription_id: string;
  lead_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_date: string | null;
  due_date: string | null;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export type LeadVertical = "food" | "services";

export const VERTICAL_LABELS: Record<LeadVertical, string> = {
  food: "Menuary · Food",
  services: "Bizery · Services",
};

export const VERTICAL_SHORT_LABELS: Record<LeadVertical, string> = {
  food: "Menuary",
  services: "Bizery",
};

/** Classi Tailwind per badge verticale — usa colori brand hardcoded (contesto admin). */
export const VERTICAL_BADGE_CLASSES: Record<LeadVertical, string> = {
  food:     "bg-amber-100 text-amber-800",
  services: "bg-blue-100 text-blue-700",
};

export const VERTICAL_DOT_CLASSES: Record<LeadVertical, string> = {
  food:     "bg-amber-500",
  services: "bg-blue-500",
};

// ─── Labels UI ─────────────────────────────────────────────────────────────────

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  lead: "Lead",
  prospect: "Prospect",
  active: "Attivo",
  churned: "Churned",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  lead: "bg-pork-ink/10 text-pork-ink/70",
  prospect: "bg-pork-mustard/30 text-pork-ink",
  active: "bg-pork-green/20 text-pork-green",
  churned: "bg-pork-red/10 text-pork-red",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: "Trial",
  active: "Attivo",
  suspended: "Sospeso",
  cancelled: "Cancellato",
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  trial: "bg-pork-mustard/30 text-pork-ink",
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

export const SOURCE_LABELS: Record<LeadSource, string> = {
  form_web: "Form web",
  referral: "Referral",
  diretto: "Contatto diretto",
  evento: "Evento",
  altro: "Altro",
};
