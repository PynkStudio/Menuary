import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type SyncLogEntry = {
  tenant_id: string;
  reviews_fetched?: number;
  rating?: number;
  rating_count?: number;
  status: "success" | "error" | "skipped";
  error_message?: string;
};

function db() {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("Supabase service client non disponibile — controlla SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

/** Restituisce il timestamp dell'ultimo sync riuscito per un tenant, o null. */
export async function getLastSuccessfulSync(tenantId: string): Promise<Date | null> {
  const { data } = await db()
    .from("google_sync_log")
    .select("synced_at")
    .eq("tenant_id", tenantId)
    .eq("status", "success")
    .order("synced_at", { ascending: false })
    .limit(1)
    .single();

  return data ? new Date(data.synced_at) : null;
}

/** True se il tenant ha almeno un sync completato con successo. */
export async function hasEverSynced(tenantId: string): Promise<boolean> {
  return (await getLastSuccessfulSync(tenantId)) !== null;
}

/** Registra il risultato di un ciclo di sync. */
export async function insertSyncLog(entry: SyncLogEntry): Promise<void> {
  await db().from("google_sync_log").insert(entry);
}

export type GoogleLocation = {
  locationResourceName: string;
  placeId: string | null;
  locationName: string | null;
  isPrimary: boolean;
};

/**
 * Restituisce le sedi Google collegate al tenant, ordinate per is_primary DESC.
 * Il cron usa solo la sede primaria; quando implementeremo il multi-location
 * si itererà su tutte.
 */
export async function getLinkedLocations(tenantId: string): Promise<GoogleLocation[]> {
  const { data } = await db()
    .from("tenant_google_locations")
    .select("location_resource_name,place_id,location_name,is_primary")
    .eq("tenant_id", tenantId)
    .order("is_primary", { ascending: false });

  return (data ?? []).map((r) => ({
    locationResourceName: r.location_resource_name,
    placeId: r.place_id,
    locationName: r.location_name,
    isPrimary: r.is_primary,
  }));
}

/** Restituisce la sede primaria collegata, o null se il tenant non ha ancora fatto il linking. */
export async function getPrimaryLocation(tenantId: string): Promise<GoogleLocation | null> {
  const locations = await getLinkedLocations(tenantId);
  return locations.find((l) => l.isPrimary) ?? locations[0] ?? null;
}

/** Salva o aggiorna il refresh_token OAuth per un tenant. */
export async function upsertGoogleAuth(
  tenantId: string,
  refreshToken: string,
  authorizedBy?: string,
): Promise<void> {
  await db().from("tenant_google_auth").upsert(
    { tenant_id: tenantId, refresh_token: refreshToken, authorized_by: authorizedBy, authorized_at: new Date().toISOString() },
    { onConflict: "tenant_id" },
  );
}

/** Recupera il refresh_token per un tenant (usato da my-business.ts per rinnovare l'access token). */
export async function getRefreshToken(tenantId: string): Promise<string | null> {
  const { data } = await db()
    .from("tenant_google_auth")
    .select("refresh_token")
    .eq("tenant_id", tenantId)
    .single();
  return data?.refresh_token ?? null;
}

/**
 * Determina se un tenant è eleggibile per il sync Google Places.
 *
 * Regole:
 *  - "offline"  → mai (skip immediato prima ancora di chiamare questa funzione)
 *  - "trial"    → solo se non ha mai completato un sync con successo
 *  - "active"   → se l'ultimo sync riuscito è più vecchio di 30 giorni (o assente)
 */
export async function isSyncEligible(
  tenantId: string,
  status: "active" | "trial",
): Promise<boolean> {
  if (status === "trial") {
    return !(await hasEverSynced(tenantId));
  }

  const lastSync = await getLastSuccessfulSync(tenantId);
  if (!lastSync) return true;

  const daysSince = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= 30;
}
