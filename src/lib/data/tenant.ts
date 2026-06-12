import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { findTenantById } from "@/lib/tenant-registry";
import type { TenantProfile, TenantFeatureFlags, TenantTheme } from "@/lib/tenant";

const TENANT_SELECT = "id,name,label,domains,preview_slug,enabled,vertical,status,theme,features" as const;

export async function getTenantById(id: string): Promise<TenantProfile | null> {
  const service = createSupabaseServiceClient();
  const supabase = service ?? await createSupabaseServerClient();
  const { data } = await supabase
    .from("tenants")
    .select(TENANT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (!data) return findTenantById(id) ?? null;
  return rowToProfile(data);
}

export async function getTenantByDomain(hostname: string): Promise<TenantProfile | null> {
  const normalized = hostname.toLowerCase().split(":")[0] ?? hostname;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("tenants")
    .select(TENANT_SELECT)
    .contains("domains", [normalized])
    .maybeSingle();
  return data ? rowToProfile(data) : null;
}

export async function getTenantByPreviewSlug(slug: string): Promise<TenantProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("tenants")
    .select(TENANT_SELECT)
    .eq("preview_slug", slug)
    .maybeSingle();
  return data ? rowToProfile(data) : null;
}

type Row = {
  id: string;
  name: string;
  label: string;
  domains: string[];
  preview_slug: string | null;
  enabled: boolean;
  vertical: string | null;
  status: string | null;
  theme: unknown;
  features: unknown;
};

function rowToProfile(r: Row): TenantProfile {
  const fallback = findTenantById(r.id);
  const keepRegistryIdentity = fallback?.vertical === "creative";
  const dbFeatures =
    r.features && typeof r.features === "object" && !Array.isArray(r.features)
      ? (r.features as Partial<TenantFeatureFlags>)
      : {};
  const dbTheme =
    r.theme && typeof r.theme === "object" && !Array.isArray(r.theme)
      ? (r.theme as Partial<TenantTheme>)
      : {};

  return {
    id: r.id,
    name: keepRegistryIdentity ? fallback.name : r.name ?? fallback?.name ?? r.id,
    label: keepRegistryIdentity ? fallback.label : r.label ?? fallback?.label ?? r.name ?? r.id,
    vertical: keepRegistryIdentity
      ? fallback.vertical
      : (r.vertical as TenantProfile["vertical"]) ?? fallback?.vertical ?? "food",
    domains: r.domains ?? fallback?.domains ?? [],
    previewSlug: r.preview_slug ?? fallback?.previewSlug,
    enabled: r.enabled,
    status: (r.status as TenantProfile["status"]) ?? fallback?.status ?? "active",
    theme: { ...(fallback?.theme ?? {}), ...dbTheme } as TenantTheme,
    features: { ...(fallback?.features ?? {}), ...dbFeatures } as TenantFeatureFlags,
  };
}
