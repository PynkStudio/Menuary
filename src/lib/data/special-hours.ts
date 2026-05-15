import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type SpecialHourRow = {
  id: string;
  date: string;          // "YYYY-MM-DD"
  closed: boolean;
  slots: string[];
  label: string | null;
  synced_to_google: boolean;
};

function db() {
  const c = createSupabaseServiceClient();
  if (!c) throw new Error("Supabase service client non disponibile");
  return c;
}

export async function getSpecialHours(tenantId: string): Promise<SpecialHourRow[]> {
  const { data } = await db()
    .from("tenant_special_hours")
    .select("id,date,closed,slots,label,synced_to_google")
    .eq("tenant_id", tenantId)
    .gte("date", new Date().toISOString().slice(0, 10)) // solo oggi in poi
    .order("date");
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
      { onConflict: "tenant_id,date" },
    );
}

export async function deleteSpecialHour(tenantId: string, id: string): Promise<void> {
  await db()
    .from("tenant_special_hours")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
}

export async function markSpecialHoursSynced(tenantId: string): Promise<void> {
  await db()
    .from("tenant_special_hours")
    .update({ synced_to_google: true })
    .eq("tenant_id", tenantId);
}

/** Orari straordinari futuri non ancora sincronizzati su Google. */
export async function getUnsyncedSpecialHours(tenantId: string): Promise<SpecialHourRow[]> {
  const { data } = await db()
    .from("tenant_special_hours")
    .select("id,date,closed,slots,label,synced_to_google")
    .eq("tenant_id", tenantId)
    .eq("synced_to_google", false)
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date");
  return (data ?? []).map((r) => ({ ...r, slots: (r.slots as string[]) ?? [] }));
}
