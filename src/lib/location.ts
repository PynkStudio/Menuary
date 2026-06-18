import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { TenantLocation, LocationRoutingMode } from "./tenant";

type LocationRow = Database["public"]["Tables"]["locations"]["Row"] & {
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  routing_mode?: string | null;
};

function rowToLocation(row: LocationRow): TenantLocation {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug,
    address: row.address ?? null,
    city: row.city ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    hours: row.hours,
    isDefault: row.is_default,
    routingMode: (row.routing_mode as LocationRoutingMode) ?? "both",
  };
}

export async function fetchLocations(
  supabase: SupabaseClient<Database>,
  tenantId: string,
): Promise<TenantLocation[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("is_default", { ascending: false })
    .order("name");

  if (error || !data) return [];
  return (data as LocationRow[]).map(rowToLocation);
}

/** True solo quando il tenant ha 2+ sedi. Con 1 sede non si mostra nessuna UI di selezione. */
export function isMultiLocation(locations: TenantLocation[]): boolean {
  return locations.length > 1;
}

export function getDefaultLocation(
  locations: TenantLocation[],
): TenantLocation | undefined {
  return locations.find((l) => l.isDefault) ?? locations[0];
}

export function findLocationBySlug(
  locations: TenantLocation[],
  slug: string | null | undefined,
): TenantLocation | undefined {
  if (!slug) return undefined;
  return locations.find((l) => l.slug === slug);
}

/**
 * Risolve la sede attiva: prima prova per slug, poi cade sul default.
 * Se il tenant ha una sola sede, ritorna sempre quella (nessuna logica di selezione).
 */
export function resolveActiveLocation(
  locations: TenantLocation[],
  slug: string | null | undefined,
): TenantLocation | undefined {
  if (locations.length === 0) return undefined;
  if (locations.length === 1) return locations[0];
  return findLocationBySlug(locations, slug) ?? getDefaultLocation(locations);
}

/**
 * Filtra le sedi a cui uno staff member ha accesso.
 * Se `allowedLocationIds` è vuoto, lo staff vede tutte le sedi (comportamento legacy).
 */
export function filterAllowedLocations(
  locations: TenantLocation[],
  allowedLocationIds: string[],
): TenantLocation[] {
  if (allowedLocationIds.length === 0) return locations;
  return locations.filter((l) => allowedLocationIds.includes(l.id));
}

/**
 * Ritorna gli id delle location assegnate allo staff member.
 * Ritorna [] se lo staff non ha restrizioni (può vedere tutto).
 */
export async function fetchStaffAllowedLocationIds(
  supabase: SupabaseClient<Database>,
  adminUserId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("staff_locations")
    .select("location_id")
    .eq("admin_user_id", adminUserId);

  if (!data || data.length === 0) return [];
  return data.map((r) => r.location_id);
}
