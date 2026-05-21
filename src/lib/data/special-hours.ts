import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type SpecialHourRow = {
  id: string;
  date: string;          // "YYYY-MM-DD"
  closed: boolean;
  slots: string[];
  label: string | null;
  synced_to_google: boolean;
  location_id: string | null;
};

function db() {
  const c = createSupabaseServiceClient();
  if (!c) throw new Error("Supabase service client non disponibile");
  return c;
}

const SELECT = "id,date,closed,slots,label,synced_to_google,location_id" as const;

/**
 * Orari straordinari futuri di un tenant. Se `locationId` è passato, filtra
 * sui record di quella sede + i record "globali" (location_id NULL) che valgono
 * per tutte le sedi. Senza locationId, ritorna tutto (uso legacy).
 */
export async function getSpecialHours(
  tenantId: string,
  locationId?: string | null,
): Promise<SpecialHourRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  let q = db()
    .from("tenant_special_hours")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .gte("date", today)
    .order("date");

  if (locationId) {
    // Record per la sede + record globali (NULL)
    q = q.or(`location_id.eq.${locationId},location_id.is.null`);
  }

  const { data } = await q;
  return (data ?? []).map((r) => ({
    ...r,
    slots: (r.slots as string[]) ?? [],
  }));
}

export async function upsertSpecialHour(
  tenantId: string,
  entry: Omit<SpecialHourRow, "id" | "synced_to_google">,
): Promise<void> {
  await db()
    .from("tenant_special_hours")
    .upsert(
      { tenant_id: tenantId, ...entry, synced_to_google: false },
      { onConflict: "tenant_id,date,location_id" },
    );
}

export async function deleteSpecialHour(tenantId: string, id: string): Promise<void> {
  await db()
    .from("tenant_special_hours")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
}

export async function markSpecialHoursSynced(
  tenantId: string,
  locationId?: string | null,
): Promise<void> {
  let q = db()
    .from("tenant_special_hours")
    .update({ synced_to_google: true })
    .eq("tenant_id", tenantId);
  if (locationId) q = q.eq("location_id", locationId);
  await q;
}

/** Orari straordinari futuri non ancora sincronizzati su Google. */
export async function getUnsyncedSpecialHours(
  tenantId: string,
  locationId?: string | null,
): Promise<SpecialHourRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  let q = db()
    .from("tenant_special_hours")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .eq("synced_to_google", false)
    .gte("date", today)
    .order("date");

  if (locationId) {
    q = q.or(`location_id.eq.${locationId},location_id.is.null`);
  }

  const { data } = await q;
  return (data ?? []).map((r) => ({ ...r, slots: (r.slots as string[]) ?? [] }));
}
