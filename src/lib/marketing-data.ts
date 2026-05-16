import { TENANTS } from "./tenant-registry";
import { getTenantContent } from "./tenant-content";
import { createSupabaseServiceClient } from "./supabase/service";
import type { TenantProfile } from "./tenant";
import { PRICING_PLANS, type PricingPlan } from "./platform-pricing";

export type MarketingTenant = {
  id: string;
  name: string;
  city: string;
  previewSlug?: string;
  url: string;
  image: string;
};

export type MarketingReview = {
  id: string;
  author: string;
  rating: number;
  text: string;
  dateLabel: string | null;
  tenantName: string;
  tenantCity: string;
};

export type MarketingHomeData = {
  activeTenants: MarketingTenant[];
  testimonials: MarketingReview[];
  activeCount: number;
};

type Vertical = TenantProfile["vertical"];

// Tenant di riferimento per ogni verticale: sono i nostri tenant demo/interni
// e non vanno esibiti come prova sociale sulla marketing home corrispondente.
const MARKETING_EXCLUDE_IDS: Record<Vertical, Set<string>> = {
  food: new Set(["bepork", "faak"]),
  services: new Set(["bizery-demo"]),
};

const PREVIEW_HOST: Record<Vertical, string> = {
  food: "https://demo.menuary.it",
  services: "https://demo.bizery.it",
};

function toMarketingTenant(profile: TenantProfile): MarketingTenant {
  const content = getTenantContent(profile.id);
  const host = PREVIEW_HOST[profile.vertical] ?? "https://demo.menuary.it";
  const previewUrl = profile.previewSlug
    ? `${host}/${profile.previewSlug}`
    : content.url;
  return {
    id: profile.id,
    name: profile.name,
    city: content.address.city,
    previewSlug: profile.previewSlug,
    url: previewUrl,
    image: content.hero.backdrop,
  };
}

function getActiveTenantProfiles(vertical: Vertical): TenantProfile[] {
  const excluded = MARKETING_EXCLUDE_IDS[vertical] ?? new Set<string>();
  return TENANTS.filter(
    (t) =>
      t.vertical === vertical &&
      t.enabled &&
      t.status === "active" &&
      !excluded.has(t.id),
  );
}

export async function getMarketingHomeData(
  vertical: Vertical = "food",
): Promise<MarketingHomeData> {
  const profiles = getActiveTenantProfiles(vertical);
  const activeTenants = profiles.map(toMarketingTenant);

  if (profiles.length === 0) {
    return { activeTenants: [], testimonials: [], activeCount: 0 };
  }

  const tenantIds = profiles.map((p) => p.id);
  const nameById = new Map(profiles.map((p) => [p.id, p.name] as const));
  const cityById = new Map(
    profiles.map((p) => [p.id, getTenantContent(p.id).address.city] as const),
  );

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { activeTenants, testimonials: [], activeCount: profiles.length };
  }

  const { data } = await supabase
    .from("reviews")
    .select("id, author, rating, text, date_label, tenant_id")
    .in("tenant_id", tenantIds)
    .eq("published", true)
    .eq("source", "google_places")
    .gte("rating", 5)
    .order("position", { ascending: true })
    .limit(6);

  const testimonials: MarketingReview[] = (data ?? []).map((r) => ({
    id: r.id,
    author: r.author,
    rating: r.rating,
    text: r.text,
    dateLabel: r.date_label,
    tenantName: nameById.get(r.tenant_id) ?? r.tenant_id,
    tenantCity: cityById.get(r.tenant_id) ?? "",
  }));

  return {
    activeTenants,
    testimonials,
    activeCount: profiles.length,
  };
}

/**
 * Legge i piani commerciali da Supabase (platform_packages).
 * Fallback su PRICING_PLANS hardcoded se il DB non è raggiungibile.
 *
 * Mapping colonne DB → PricingPlan:
 *   price_monthly          → price_annual  (canone mensile equiv. pagamento annuale)
 *   price_monthly_billing  → price_monthly (canone mensile con fatturazione mensile)
 */
export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return PRICING_PLANS;

  const { data, error } = await supabase
    .from("platform_packages")
    .select(
      "slug, marketing_name, tagline, marketing_description, price_monthly, price_monthly_billing, setup_from, marketing_items, is_featured, cta_label",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return PRICING_PLANS;

  return data.map((row) => ({
    slug: row.slug,
    marketing_name: row.marketing_name ?? row.slug,
    tagline: row.tagline ?? "",
    description: row.marketing_description ?? "",
    price_annual: row.price_monthly,
    price_monthly: row.price_monthly_billing ?? row.price_monthly,
    setup_from: row.setup_from ?? "",
    marketing_items: row.marketing_items ?? [],
    is_featured: row.is_featured,
    cta_label: row.cta_label ?? undefined,
  }));
}
