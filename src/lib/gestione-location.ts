import "server-only";

import { cookies, headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import type { TenantLocation } from "@/lib/tenant";

const COOKIE_PREFIX = "menuary_gestione_location_";

export function gestioneLocationCookieName(tenantId: string): string {
  return `${COOKIE_PREFIX}${tenantId}`;
}

export async function readGestioneLocationId(tenantId: string): Promise<string | null> {
  return (await cookies()).get(gestioneLocationCookieName(tenantId))?.value ?? null;
}

export async function getActiveGestioneLocation(
  tenantId: string,
): Promise<TenantLocation | null> {
  const db = createSupabaseServiceClient();
  if (!db) return null;

  const { data } = await db
    .from("locations")
    .select("id,tenant_id,name,slug,address,city,phone,email,hours,is_default,routing_mode")
    .eq("tenant_id", tenantId)
    .order("is_default", { ascending: false })
    .order("name");

  const locations = (data ?? []).map<TenantLocation>((location) => ({
    id: location.id,
    tenantId: location.tenant_id,
    name: location.name,
    slug: location.slug,
    address: location.address,
    city: location.city,
    phone: location.phone,
    email: location.email,
    hours: location.hours,
    isDefault: location.is_default,
    routingMode: location.routing_mode as TenantLocation["routingMode"],
  }));

  if (locations.length === 0) return null;
  if (locations.length === 1) return locations[0];

  const selectedId = await readGestioneLocationId(tenantId);
  const selected = locations.find((location) => location.id === selectedId);
  if (!selected) throw new Error("gestione_location_required");

  const host = (await headers()).get("host") ?? "";
  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return selected;

  const [{ data: siteadmin }, { data: tenantadmin }, { data: adminUser }] = await Promise.all([
    supabase.from("siteadmin").select("id").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    supabase.from("tenantadmin").select("id").eq("user_id", user.id).eq("tenant_id", tenantId).eq("enabled", true).maybeSingle(),
    supabase.from("admin_users").select("id").eq("auth_user_id", user.id).eq("tenant_id", tenantId).eq("enabled", true).maybeSingle(),
  ]);

  if (siteadmin || tenantadmin || !adminUser) return selected;

  const { data: restrictions } = await supabase
    .from("staff_locations")
    .select("location_id")
    .eq("admin_user_id", adminUser.id);

  if (!restrictions?.length || restrictions.some((row) => row.location_id === selected.id)) {
    return selected;
  }

  throw new Error("gestione_location_forbidden");
}

export async function requireActiveGestioneLocation(tenantId: string): Promise<TenantLocation> {
  const location = await getActiveGestioneLocation(tenantId);
  if (!location) throw new Error("gestione_location_missing");
  return location;
}
