import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TenantProfile, TenantFeatureFlags, TenantTheme } from "@/lib/tenant";

const TENANT_SELECT = "id,name,label,domains,preview_slug,enabled,vertical,status,theme,features" as const;

export async function getTenantById(id: string): Promise<TenantProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select(TENANT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
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
  return {
    id: r.id,
    name: r.name,
    label: r.label,
    vertical: (r.vertical as TenantProfile["vertical"]) ?? "food",
    domains: r.domains,
    previewSlug: r.preview_slug ?? undefined,
    enabled: r.enabled,
    status: (r.status as TenantProfile["status"]) ?? "active",
    theme: r.theme as TenantTheme,
    features: r.features as TenantFeatureFlags,
  };
}
