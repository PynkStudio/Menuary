import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TenantProfile, TenantFeatureFlags, TenantTheme } from "@/lib/tenant";

export async function getTenantById(id: string): Promise<TenantProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id,name,label,domains,preview_slug,enabled,theme,features")
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
    .select("id,name,label,domains,preview_slug,enabled,theme,features")
    .contains("domains", [normalized])
    .maybeSingle();
  return data ? rowToProfile(data) : null;
}

export async function getTenantByPreviewSlug(slug: string): Promise<TenantProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("tenants")
    .select("id,name,label,domains,preview_slug,enabled,theme,features")
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
  theme: unknown;
  features: unknown;
};

function rowToProfile(r: Row): TenantProfile {
  return {
    id: r.id,
    name: r.name,
    label: r.label,
    // La colonna `vertical` non è ancora presente sulla tabella Supabase:
    // tutti i tenant attuali sono ristoranti, quindi default a "food".
    vertical: "food",
    domains: r.domains,
    previewSlug: r.preview_slug ?? undefined,
    enabled: r.enabled,
    theme: r.theme as TenantTheme,
    features: r.features as TenantFeatureFlags,
  };
}
