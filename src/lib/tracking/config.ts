import type { PlatformMode } from "@/lib/platform";
import type { TenantProfile } from "@/lib/tenant";
import type { ConversionName, TrackingConfig } from "./types";

type MarketingBrand = "menuary" | "bizery" | "orpheo";

const MARKETING_BRAND_BY_MODE: Partial<Record<PlatformMode, MarketingBrand>> = {
  marketing: "menuary",
  "marketing-bizery": "bizery",
  "marketing-orpheo": "orpheo",
};

const CONVERSIONS: ConversionName[] = ["lead", "booking", "order", "contact"];

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/**
 * I siti marketing leggono gli ID da env, così si cambiano da Vercel senza
 * deploy di codice: TRACKING_<BRAND>_GA4_ID, TRACKING_<BRAND>_GOOGLE_ADS_ID,
 * TRACKING_<BRAND>_GOOGLE_ADS_<CONVERSION>_LABEL, TRACKING_<BRAND>_META_PIXEL_ID,
 * TRACKING_<BRAND>_OPENAI_PIXEL_ID.
 */
function marketingConfig(brand: MarketingBrand): TrackingConfig {
  const prefix = `TRACKING_${brand.toUpperCase()}`;
  const labels = Object.fromEntries(
    CONVERSIONS.map((name) => [name, env(`${prefix}_GOOGLE_ADS_${name.toUpperCase()}_LABEL`)]).filter(
      ([, label]) => Boolean(label),
    ),
  ) as TrackingConfig["googleAdsLabels"];
  return {
    siteKey: brand,
    ga4Id: env(`${prefix}_GA4_ID`),
    googleAdsId: env(`${prefix}_GOOGLE_ADS_ID`),
    googleAdsLabels: labels,
    metaPixelId: env(`${prefix}_META_PIXEL_ID`),
    openaiPixelId: env(`${prefix}_OPENAI_PIXEL_ID`),
    cookiePolicyHref: "/cookie",
  };
}

/**
 * Config di tracciamento del sito servito dalla richiesta corrente.
 * `null` per le superfici non pubbliche (gestione, admin, cassa, …): lì non si
 * traccia nulla e non si raccoglie attribuzione.
 */
export function resolveTrackingConfig(
  mode: PlatformMode,
  tenant: TenantProfile | undefined,
): TrackingConfig | null {
  const brand = MARKETING_BRAND_BY_MODE[mode];
  if (brand) return marketingConfig(brand);
  if (mode !== "tenant" || !tenant) return null;
  return {
    siteKey: `tenant:${tenant.id}`,
    cookiePolicyHref: "/cookie",
    ...tenant.tracking,
  };
}
