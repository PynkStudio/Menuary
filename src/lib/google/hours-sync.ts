import "server-only";

import { getPrimaryLocation } from "@/lib/data/google-sync";
import { getSpecialHours, markSpecialHoursSynced } from "@/lib/data/special-hours";
import { syncRegularHours, syncSpecialHours } from "@/lib/google/my-business";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { DaySchedule } from "@/lib/venue-hours";

export type HoursSyncMode = "regular" | "special" | "all";

export type HoursSyncResult = {
  synced: string[];
  errors?: string[];
};

export async function runGoogleHoursSync(
  tenantId: string,
  mode: HoursSyncMode = "all",
): Promise<HoursSyncResult> {
  const location = await getPrimaryLocation(tenantId);
  if (!location) throw new Error("Sede Google non collegata");

  const db = createSupabaseServiceClient();
  if (!db) throw new Error("DB non disponibile");

  const synced: string[] = [];
  const errors: string[] = [];

  if (mode === "regular" || mode === "all") {
    const { data: googleLink } = await db
      .from("tenant_google_locations")
      .select("location_id")
      .eq("tenant_id", tenantId)
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle();

    let week: DaySchedule[] | null = null;
    if (googleLink?.location_id) {
      const { data: locRow } = (await db
        .from("locations")
        .select("hours" as never)
        .eq("id", googleLink.location_id)
        .single()) as { data: { hours: DaySchedule[] | null } | null };
      const locHours = locRow?.hours ?? null;
      if (locHours?.length) week = locHours;
    }

    if (!week) {
      const { data: tenantRow } = await db
        .from("tenants")
        .select("hours")
        .eq("id", tenantId)
        .single();
      week = (tenantRow?.hours as DaySchedule[] | null) ?? null;
    }

    if (week?.length) {
      try {
        await syncRegularHours(tenantId, location.locationResourceName, week);
        synced.push("regular");
      } catch (e) {
        errors.push(`regular: ${(e as Error).message}`);
      }
    }
  }

  if (mode === "special" || mode === "all") {
    const specials = await getSpecialHours(tenantId);
    if (specials.length) {
      try {
        await syncSpecialHours(tenantId, location.locationResourceName, specials);
        await markSpecialHoursSynced(tenantId);
        synced.push("special");
      } catch (e) {
        errors.push(`special: ${(e as Error).message}`);
      }
    }
  }

  return {
    synced,
    errors: errors.length ? errors : undefined,
  };
}

export async function triggerGoogleHoursSync(
  tenantId: string,
  mode: HoursSyncMode,
): Promise<void> {
  try {
    await runGoogleHoursSync(tenantId, mode);
  } catch (e) {
    console.error("[google-hours-sync] automatic sync failed", {
      tenantId,
      mode,
      error: (e as Error).message,
    });
  }
}
