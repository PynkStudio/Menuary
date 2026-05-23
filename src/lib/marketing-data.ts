import { TENANTS } from "./tenant-registry";
import { getTenantContent } from "./tenant-content";
import { createSupabaseServiceClient } from "./supabase/service";
import type { TenantProfile } from "./tenant";
import {
  AI_ADDON,
  PRICING_PLANS,
  mergeBizeryPlans,
  type PricingAddon,
  type PricingPlan,
} from "./platform-pricing";
import { DEFAULT_MARKET, getMarket, type MarketCode } from "./markets";

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
  services: new Set(),
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
 * Piani Bizery: prezzi da Supabase, copy adattata per il verticale services.
 */
export async function fetchBizeryPricingPlans(marketCode: MarketCode = DEFAULT_MARKET): Promise<PricingPlan[]> {
  const dbPlans = await fetchPricingPlans(marketCode);
  return mergeBizeryPlans(dbPlans);
}

export async function fetchPricingAddons(marketCode: MarketCode = DEFAULT_MARKET): Promise<PricingAddon[]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return [AI_ADDON];

  const { data, error } = await (supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          eq: (column: string, value: unknown) => {
            order: (column: string, options: { ascending: boolean }) => Promise<{ data: Array<Record<string, unknown>> | null; error: unknown }>;
          };
        };
      };
    };
  })
    .from("platform_packages")
    .select(
      "slug, marketing_name, tagline, marketing_description, price_monthly, price_monthly_billing, setup_from, marketing_items, min_package_slug, settings",
    )
    .eq("package_kind", "addon")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return [AI_ADDON];

  const slugs = data.map((row) => String(row.slug));
  const { data: marketRows } = await (supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          in: (column: string, values: string[]) => Promise<{ data: Array<Record<string, unknown>> | null }>;
        };
      };
    };
  })
    .from("platform_package_market_prices")
    .select("package_slug, currency, price_monthly, setup_from")
    .eq("country_code", marketCode)
    .in("package_slug", slugs);

  const marketBySlug = new Map((marketRows ?? []).map((row) => [String(row.package_slug), row]));
  const fallbackMarket = getMarket(marketCode);

  return data.map((row) => {
    const market = marketBySlug.get(String(row.slug));
    const settings = (row.settings && typeof row.settings === "object" ? row.settings : {}) as PricingAddon["settings"];
    return {
      slug: String(row.slug),
      marketing_name: String(row.marketing_name ?? row.slug),
      tagline: String(row.tagline ?? ""),
      description: String(row.marketing_description ?? ""),
      monthly: Number(market?.price_monthly ?? row.price_monthly ?? 0),
      currency: String(market?.currency ?? fallbackMarket.currency),
      minPlan: String(row.min_package_slug ?? "prenotazioni"),
      setup_from: market?.setup_from != null ? String(market.setup_from) : (row.setup_from ? String(row.setup_from) : undefined),
      items: Array.isArray(row.marketing_items) ? row.marketing_items.map(String) : [],
      minutesNote: String(settings.overageMode === "fixed" ? "Extra minuti addebitati secondo listino concordato." : AI_ADDON.minutesNote),
      settings,
    };
  });
}

/**
 * Legge i piani commerciali da Supabase (platform_packages).
 * Fallback su PRICING_PLANS hardcoded se il DB non è raggiungibile.
 *
 * Mapping colonne DB → PricingPlan:
 *   price_monthly          → price_annual  (canone mensile equiv. pagamento annuale)
 *   price_monthly_billing  → price_monthly (canone mensile con fatturazione mensile)
 */
export async function fetchPricingPlans(marketCode: MarketCode = DEFAULT_MARKET): Promise<PricingPlan[]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return PRICING_PLANS;

  const { data, error } = await (supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          eq: (column: string, value: unknown) => {
            order: (column: string, options: { ascending: boolean }) => Promise<{ data: Array<Record<string, unknown>> | null; error: unknown }>;
          };
        };
      };
    };
  })
    .from("platform_packages")
    .select(
      "slug, marketing_name, tagline, marketing_description, price_monthly, price_monthly_billing, setup_from, marketing_items, is_featured, cta_label",
    )
    .eq("package_kind", "base")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return PRICING_PLANS;

  const packageIds = data.map((row) => String(row.slug));
  const { data: marketRows } = await (supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          in: (column: string, values: string[]) => Promise<{ data: Array<Record<string, unknown>> | null }>;
        };
      };
    };
  })
    .from("platform_package_market_prices")
    .select("package_slug, currency, price_monthly, price_monthly_billing, setup_from")
    .eq("country_code", marketCode)
    .in("package_slug", packageIds);

  const marketBySlug = new Map((marketRows ?? []).map((row) => [String(row.package_slug), row]));

  return data.map((row) => {
    const market = marketBySlug.get(String(row.slug));
    const fallbackMarket = getMarket(marketCode);
    return {
    slug: String(row.slug),
    marketing_name: String(row.marketing_name ?? row.slug),
    tagline: String(row.tagline ?? ""),
    description: String(row.marketing_description ?? ""),
    price_annual: Number(market?.price_monthly ?? row.price_monthly),
    price_monthly: Number(market?.price_monthly_billing ?? row.price_monthly_billing ?? row.price_monthly),
    currency: String(market?.currency ?? fallbackMarket.currency),
    setup_from: String(market?.setup_from ?? row.setup_from ?? ""),
    marketing_items: Array.isArray(row.marketing_items) ? row.marketing_items.map(String) : [],
    is_featured: row.is_featured === true,
    cta_label: row.cta_label ? String(row.cta_label) : undefined,
  };
  });
}
