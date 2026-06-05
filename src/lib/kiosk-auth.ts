import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";

export type KioskDeviceContext = {
  id: string;
  tenant_id: string;
  location_id: string | null;
  name: string;
  enabled: boolean;
  config: Json;
};

/**
 * Verifica il device_token presentato dal kiosk (header X-Kiosk-Token).
 * Aggiorna last_seen_at e ritorna il contesto del device, oppure null se
 * non autorizzato o disabilitato.
 */
export async function resolveKioskDevice(
  svc: SupabaseClient<Database>,
  token: string | null,
): Promise<KioskDeviceContext | null> {
  if (!token) return null;
  const { data } = await svc
    .from("kiosk_devices")
    .select("id, tenant_id, location_id, name, enabled, config")
    .eq("device_token", token)
    .maybeSingle();
  if (!data || !data.enabled) return null;

  // Heartbeat: aggiorna last_seen_at ma non bloccare se fallisce.
  await svc
    .from("kiosk_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id);

  return data as KioskDeviceContext;
}
