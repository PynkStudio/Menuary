import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/** Tipo di eccezione oraria. */
export type SpecialHourKind =
  | "single"           // data singola
  | "range"            // dal date al end_date
  | "weekly-in-range"; // ogni <weekday> dal date al end_date

export type SpecialHourRow = {
  id: string;
  date: string;         // "YYYY-MM-DD" — data singola o inizio intervallo
  closed: boolean;
  slots: string[];
  label: string | null;
  synced_to_google: boolean;
  location_id: string | null;
  kind: SpecialHourKind;
  end_date: string | null; // null se kind === "single"
  weekday: number | null;  // 0=lun … 6=dom — null se kind !== "weekly-in-range"
};

// Tipo raw da Supabase: le nuove colonne non sono ancora nei tipi generati.
// Cast su "as never" per bypassare fino all'applicazione della migration.
type RawRow = Record<string, unknown>;

function db() {
  const c = createSupabaseServiceClient();
  if (!c) throw new Error("Supabase service client non disponibile");
  return c;
}

function normalize(r: RawRow): SpecialHourRow {
  return {
    id: r.id as string,
    date: r.date as string,
    closed: r.closed as boolean,
    slots: (r.slots as string[]) ?? [],
    label: (r.label as string | null) ?? null,
    synced_to_google: r.synced_to_google as boolean,
    location_id: (r.location_id as string | null) ?? null,
    kind: ((r.kind as SpecialHourKind) ?? "single"),
    end_date: (r.end_date as string | null) ?? null,
    weekday: (r.weekday as number | null) ?? null,
  };
}

const SELECT =
  "id,date,closed,slots,label,synced_to_google,location_id,kind,end_date,weekday";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (db().from("tenant_special_hours" as never) as any)
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .gte("date", today)
    .order("date");

  if (locationId) {
    q = q.or(`location_id.eq.${locationId},location_id.is.null`);
  }

  const { data } = await q;
  return ((data ?? []) as RawRow[]).map(normalize);
}

export async function upsertSpecialHour(
  tenantId: string,
  entry: Omit<SpecialHourRow, "id" | "synced_to_google">,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db().from("tenant_special_hours" as never) as any).insert({
    tenant_id: tenantId,
    ...entry,
    synced_to_google: false,
  });
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (db().from("tenant_special_hours" as never) as any)
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .eq("synced_to_google", false)
    .gte("date", today)
    .order("date");

  if (locationId) {
    q = q.or(`location_id.eq.${locationId},location_id.is.null`);
  }

  const { data } = await q;
  return ((data ?? []) as RawRow[]).map(normalize);
}
