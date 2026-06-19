import type {
  LeadLocation,
  PlatformCommission,
  PlatformCommissionRule,
  PlatformLead,
  PlatformPackage,
  PlatformPayment,
  PlatformSubscription,

} from "@/lib/platform-crm-types";
import type { TenantFeatureKey } from "@/lib/tenant";
import { AI_ADDON, BIZERY_PRICING_PLANS, ORPHEO_PRICING_PLANS, PRICING_PLANS } from "@/lib/platform-pricing";
import { allTenantFeatures } from "@/lib/tenant-modules";

const presenceModules: TenantFeatureKey[] = ["website", "onlineMenu", "reviews", "gallery"];
const bookingModules: TenantFeatureKey[] = [...presenceModules, "reservations", "tablePlanner", "favorites"];
const operationsModules = Object.entries(allTenantFeatures(true))
  .filter(([key, enabled]) =>
    enabled &&
    key !== "aiPhone" &&
    key !== "aiWhatsapp" &&
    key !== "pressKit" &&
    key !== "worksCatalog" &&
    key !== "creativeBooking" &&
    key !== "rightsRoyalties" &&
    key !== "reputationReviews" &&
    key !== "fanbaseCommunity"
  )
  .map(([key]) => key as TenantFeatureKey);
const aiAddonModules: TenantFeatureKey[] = ["aiPhone"];
const aiWhatsappAddonModules: TenantFeatureKey[] = ["aiWhatsapp"];

function parseSetupAmount(setupFrom: string): number {
  return Number(setupFrom.replace(/[^0-9]/g, ""));
}

export const PLATFORM_PACKAGES: PlatformPackage[] = PRICING_PLANS.map((plan, index) => {
  const bizery = BIZERY_PRICING_PLANS.find((p) => p.slug === plan.slug);
  const annualDiscount = Math.round((1 - plan.price_annual / plan.price_monthly) * 100);
  return {
    id: `pkg-${plan.slug}`,
    name: plan.marketing_name,
    slug: plan.slug,
    vertical: "both",
    adapted_name: bizery?.marketing_name !== plan.marketing_name ? bizery?.marketing_name : null,
    description: plan.description,
    price_monthly: plan.price_annual,
    price_yearly: plan.price_annual * 12,
    price_monthly_real: plan.price_monthly,
    setup_amount: parseSetupAmount(plan.setup_from),
    annual_discount_pct: annualDiscount,
    currency: "EUR",
    modules:
      plan.slug === "presenza"
        ? presenceModules
        : plan.slug === "prenotazioni"
          ? bookingModules
          : operationsModules,
    is_active: true,
    sort_order: index + 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
});

export const ORPHEO_PLATFORM_PACKAGES: PlatformPackage[] = ORPHEO_PRICING_PLANS.map((plan, index) => {
  const annualDiscount = Math.round((1 - plan.price_annual / plan.price_monthly) * 100);
  return {
    id: `pkg-${plan.slug}`,
    name: plan.marketing_name,
    slug: plan.slug,
    vertical: "creative",
    adapted_name: null,
    description: plan.description,
    price_monthly: plan.price_annual,
    price_yearly: plan.price_annual * 12,
    price_monthly_real: plan.price_monthly,
    setup_amount: parseSetupAmount(plan.setup_from),
    annual_discount_pct: annualDiscount,
    currency: "EUR",
    modules:
      plan.slug === "orpheo-presenza"
        ? ["website", "pressKit", "worksCatalog", "reviews", "gallery"]
        : plan.slug === "orpheo-pro"
          ? ["website", "pressKit", "worksCatalog", "crm", "analytics", "creativeBooking", "reputationReviews", "gallery", "staffRoles"]
          : ["website", "pressKit", "worksCatalog", "crm", "analytics", "creativeBooking", "rightsRoyalties", "reputationReviews", "fanbaseCommunity", "gallery", "staffRoles", "mail"],
    is_active: true,
    sort_order: 201 + index,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
});

PLATFORM_PACKAGES.push(...ORPHEO_PLATFORM_PACKAGES);

export const PLATFORM_ADDON_PACKAGES: PlatformPackage[] = [
  {
    id: "pkg-ai-phone",
    name: AI_ADDON.marketing_name,
    slug: "ai-phone",
    vertical: "food",
    adapted_name: null,
    description: "Add-on IA per chiamate inbound: nessun canone fisso, 3% sugli ordini confermati gestiti dall'IA.",
    price_monthly: AI_ADDON.monthly,
    price_yearly: 0,
    currency: "EUR",
    modules: aiAddonModules,
    is_active: true,
    sort_order: 100,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "pkg-ai-whatsapp",
    name: "Assistente WhatsApp AI",
    slug: "ai-whatsapp",
    vertical: "both",
    adapted_name: null,
    description: "Add-on IA per conversazioni inbound WhatsApp.",
    price_monthly: 40,
    price_yearly: 480,
    currency: "EUR",
    modules: aiWhatsappAddonModules,
    is_active: true,
    sort_order: 101,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

function primaryLocation(
  id: string,
  name: string,
  address: string | null,
  city: string | null,
  province: string | null,
  postal_code: string | null,
): LeadLocation {
  return { id, name, address, city, province, postal_code, country: "IT", is_primary: true };
}

export const PLATFORM_LEADS: PlatformLead[] = [
  {
    id: "kam",
    business_name: "Officina KAM",
    business_slug: "officinakam",
    business_vertical: "services",
    contact_name: "Officina KAM",
    contact_email: "info@officinakam.it",
    contact_phone: "+39 333 456 7890",
    address: "Via Bonfadini, 71",
    city: "Milano",
    province: "MI",
    postal_code: "20138",
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
    stage: "demo",
    temperature: "hot",
    source: "diretto",
    notes: "Officina auto e moto a Milano. Demo disponibile su previewSlug 'officinakam'.",
    locations: [primaryLocation("loc-kam-a", "Officina Milano", "Via Bonfadini, 71", "Milano", "MI", "20138")],
    demo_url: "https://demo.bizery.it/officinakam",
    demo_pr_url: null,
    official_domain: "officinakam.it",
    official_domain_active: false,
    proposed_package_slug: null,
    proposed_addons: [],
    proposed_extra_modules: [],
    proposed_billing_cycle: null,
    proposed_setup_amount: null,
    proposed_recurring_amount: null,
    proposal_updated_at: null,
    tenant_id: "officinakam",
    converted_at: null,
    sales_owner_id: null,
    sales_owner_name: null,
    created_by_id: null,
    created_by_name: null,
    created_at: "2026-05-18T10:00:00Z",
    updated_at: "2026-05-18T10:00:00Z",
  },
  {
    id: "doca",
    business_name: "Doca - Pane, Caffè, Saudade",
    business_slug: "doca",
    business_vertical: "food",
    contact_name: "Queren Girardi",
    contact_email: "info@doca.milano",
    contact_phone: "3520672840",
    address: "Via Breno, 2",
    city: "Milano",
    province: "MI",
    postal_code: "20139",
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
    stage: "demo",
    temperature: "warm",
    source: "diretto",
    notes: "Bakery brasiliana di Queren Girardi in zona Corvetto. Caffè filtro Cafezal, farine Mulino Viva. Orari di apertura: martedì-venerdì 08:00-18:30; sabato e domenica 08:30-13:00; lunedì chiuso. Prenotazioni via telefono o WhatsApp al 3520672840. Surprise Bag su Too Good To Go. Demo: previewSlug 'doca'. Verificare P.IVA prima dell'onboarding.",
    locations: [primaryLocation("loc-doca-a", "Doca Milano · Corvetto", "Via Breno, 2", "Milano", "MI", "20139")],
    demo_url: "https://demo.menuary.it/doca",
    demo_pr_url: null,
    official_domain: null,
    official_domain_active: false,
    proposed_package_slug: null,
    proposed_addons: [],
    proposed_extra_modules: [],
    proposed_billing_cycle: null,
    proposed_setup_amount: null,
    proposed_recurring_amount: null,
    proposal_updated_at: null,
    tenant_id: "doca",
    converted_at: null,
    sales_owner_id: null,
    sales_owner_name: null,
    created_by_id: null,
    created_by_name: null,
    created_at: "2026-05-23T10:00:00Z",
    updated_at: "2026-05-23T10:00:00Z",
  },
  {
    id: "nom-sushi",
    business_name: "Nøm sushi vibes",
    business_slug: "nom-sushi",
    business_vertical: "food",
    contact_name: "Nøm sushi vibes",
    contact_email: "hello@nomsushi.it",
    contact_phone: "010 8992422",
    address: "Salita di S. Matteo, 21 R",
    city: "Genova",
    province: "GE",
    postal_code: "16123",
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
    stage: "demo",
    temperature: "warm",
    source: "diretto",
    notes: "Sushi fusion all you can eat nel centro storico di Genova (Salita di S. Matteo 21 R). Lead in trattativa — demo creata da menu PDF pranzo/cena forniti. Formule AYCE pranzo 18,90 / cena 32,90 / aperisushi 13,90. Sito attuale su WordPress (nomsushivibes.wordpress.com). Moduli attivi: sito, menu (con vincoli orari), prenotazioni, reviews/Google Business. Verificare P.IVA, email definitiva e galleria foto piatti prima dell'onboarding.",
    locations: [primaryLocation("loc-nom-sushi-a", "Nøm sushi · Genova", "Salita di S. Matteo, 21 R", "Genova", "GE", "16123")],
    demo_url: "https://demo.menuary.it/nom-sushi",
    demo_pr_url: null,
    official_domain: null,
    official_domain_active: false,
    proposed_package_slug: null,
    proposed_addons: [],
    proposed_extra_modules: [],
    proposed_billing_cycle: null,
    proposed_setup_amount: null,
    proposed_recurring_amount: null,
    proposal_updated_at: null,
    tenant_id: "nom-sushi",
    converted_at: null,
    sales_owner_id: null,
    sales_owner_name: null,
    created_by_id: null,
    created_by_name: null,
    created_at: "2026-05-29T10:00:00Z",
    updated_at: "2026-05-29T10:00:00Z",
  },
  {
    id: "junior-food",
    business_name: "Junior Food",
    business_slug: "junior-food",
    business_vertical: "food",
    contact_name: "Junior Food",
    contact_email: null,
    contact_phone: "+39 389 479 6163",
    address: "Via Gianbattista Moroni",
    city: "Bergamo",
    province: "BG",
    postal_code: "24127",
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
    stage: "demo",
    temperature: "warm",
    source: "diretto",
    notes: "Ristorante sudamericano a Bergamo. Demo creata da struttura Figma fornita: hero, storia, menu, visita e form prenotazione. Preview slug 'junior-food'. Verificare dominio, P.IVA e asset fotografici ufficiali prima dell'onboarding.",
    locations: [primaryLocation("loc-junior-food-a", "Junior Food · Bergamo", "Via Gianbattista Moroni", "Bergamo", "BG", "24127")],
    demo_url: "https://demo.menuary.it/junior-food",
    demo_pr_url: null,
    official_domain: null,
    official_domain_active: false,
    proposed_package_slug: null,
    proposed_addons: [],
    proposed_extra_modules: [],
    proposed_billing_cycle: null,
    proposed_setup_amount: null,
    proposed_recurring_amount: null,
    proposal_updated_at: null,
    tenant_id: "junior-food",
    converted_at: null,
    sales_owner_id: null,
    sales_owner_name: null,
    created_by_id: null,
    created_by_name: null,
    created_at: "2026-05-29T10:00:00Z",
    updated_at: "2026-05-29T10:00:00Z",
  },
  {
    id: "6",
    business_name: "Studio Legale Aranzulla",
    business_slug: "studioaranzulla",
    business_vertical: "services",
    contact_name: "Lara Aranzulla",
    contact_email: "info@studiolegalearanzulla.it",
    contact_phone: null,
    address: null,
    city: null,
    province: null,
    postal_code: null,
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
    stage: "new",
    temperature: "warm",
    source: "diretto",
    notes: "Studio legale – sito inaccessibile (JS-rendered, dati da completare). Contatto: Avv. Lara Aranzulla. Demo in sviluppo su previewSlug 'studioaranzulla'. Verificare indirizzo, telefono e P.IVA prima dell'onboarding.",
    locations: [primaryLocation("loc-6a", "Studio principale", null, null, null, null)],
    demo_url: "https://demo.bizery.it/studioaranzulla",
    demo_pr_url: null,
    official_domain: "studiolegalearanzulla.it",
    official_domain_active: false,
    proposed_package_slug: null,
    proposed_addons: [],
    proposed_extra_modules: [],
    proposed_billing_cycle: null,
    proposed_setup_amount: null,
    proposed_recurring_amount: null,
    proposal_updated_at: null,
    tenant_id: null,
    converted_at: null,
    sales_owner_id: null,
    sales_owner_name: null,
    created_by_id: null,
    created_by_name: null,
    created_at: "2026-05-19T10:00:00Z",
    updated_at: "2026-05-19T10:00:00Z",
  },
];


export function getLocationPlanFactor(location: LeadLocation, index: number): number {
  return location.is_primary || index === 0 ? 1 : 0.5;
}

export function calculateMultiLocationTotal(baseAmount: number, locations: LeadLocation[]): number {
  const planFactor = locations.length > 0
    ? locations.reduce((sum, location, index) => sum + getLocationPlanFactor(location, index), 0)
    : 1;
  return baseAmount * planFactor;
}

export const PLATFORM_SUBSCRIPTIONS: PlatformSubscription[] = [];

export const PLATFORM_PAYMENTS: PlatformPayment[] = [];

export function calculateSubscriptionTotal(sub: PlatformSubscription): number {
  if (!sub.package) return sub.price_override ?? 0;
  if (sub.price_override !== null) return sub.price_override;
  const base = sub.billing_cycle === "yearly" ? sub.package.price_yearly ?? sub.package.price_monthly * 12 : sub.package.price_monthly;
  const planFactor = sub.location_plans?.reduce((sum, loc) => sum + loc.price_factor, 0) ?? 1;
  return base * planFactor;
}

export const PLATFORM_COMMISSION_RULES: PlatformCommissionRule[] = [
  { role: "superadmin", label: "Super Admin", commission_rate: 30, applies_to_sales: true },
  { role: "admin", label: "Admin", commission_rate: 30, applies_to_sales: true },
  { role: "venditore", label: "Venditore", commission_rate: 30, applies_to_sales: true },
  { role: "amministrazione", label: "Amministrazione", commission_rate: 30, applies_to_sales: true },
  { role: "gestore", label: "Gestore", commission_rate: 30, applies_to_sales: true },
  { role: "lead_inserter", label: "Inserimento lead", commission_rate: 10, applies_to_sales: false },
];

export function calculateFirstPaymentBase(sub: PlatformSubscription): number {
  const recurring = calculateSubscriptionTotal(sub);
  const setup = sub.setup_amount ?? 0;
  return setup + recurring;
}

export function calculateCommissionAmount(firstPaymentBase: number, commissionRate: number): number {
  return Math.round(firstPaymentBase * (commissionRate / 100) * 100) / 100;
}

export const PLATFORM_COMMISSIONS: PlatformCommission[] = PLATFORM_SUBSCRIPTIONS
  .filter((sub) => sub.lead?.tenant_id)
  .flatMap((sub, index) => {
    const lead = sub.lead!;
    const closingRule = PLATFORM_COMMISSION_RULES.find((item) => item.role === "venditore")!;
    const leadInsertRule = PLATFORM_COMMISSION_RULES.find((item) => item.role === "lead_inserter")!;
    const payment = PLATFORM_PAYMENTS.find((item) => item.subscription_id === sub.id)!;
    const recurring = calculateSubscriptionTotal(sub);
    const firstPaymentBase = calculateFirstPaymentBase(sub);

    const closingCommission: PlatformCommission = {
      id: `comm-${index + 1}`,
      lead_id: lead.id,
      tenant_id: lead.tenant_id,
      subscription_id: sub.id,
      payment_id: payment.id,
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
      status: payment.status === "paid" ? "approved" : "pending",
      closed_at: lead.converted_at ?? sub.started_at,
      paid_at: null,
    };

    if (!lead.created_by_id) return [closingCommission];

    const leadInsertCommission: PlatformCommission = {
      ...closingCommission,
      id: `comm-lead-insert-${index + 1}`,
      seller_id: lead.created_by_id,
      seller_name: lead.created_by_name ?? "Inseritore lead",
      seller_role: "lead_inserter",
      commission_kind: "lead_insert",
      commission_rate: leadInsertRule.commission_rate,
      commission_amount: calculateCommissionAmount(firstPaymentBase, leadInsertRule.commission_rate),
    };

    return [closingCommission, leadInsertCommission];
  });
