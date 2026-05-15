import { NextResponse } from "next/server";
import { syncRegularHours, syncSpecialHours } from "@/lib/google/my-business";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import { getSpecialHours, markSpecialHoursSynced } from "@/lib/data/special-hours";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { DaySchedule } from "@/lib/venue-hours";

// POST /api/gestione/google/sync-hours
// Body: { tenantId, mode: "regular" | "special" | "all" }
// Legge gli orari dal DB e li sincronizza su Google Business Profile.

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId, mode = "all" } = (await request.json()) as {
    tenantId: string;
    mode?: "regular" | "special" | "all";
  };

  const location = await getPrimaryLocation(tenantId);
  if (!location) return NextResponse.json({ error: "Sede Google non collegata" }, { status: 404 });

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "DB non disponibile" }, { status: 500 });

  const synced: string[] = [];
  const errors: string[] = [];

  // ── Orari settimanali standard ─────────────────────────────────────────────
  if (mode === "regular" || mode === "all") {
    const { data: tenantRow } = await db
      .from("tenants")
      .select("hours")
      .eq("id", tenantId)
      .single();

    const week = tenantRow?.hours as DaySchedule[] | null;
    if (week?.length) {
      try {
        await syncRegularHours(tenantId, location.locationResourceName, week);
        synced.push("regular");
      } catch (e) {
        errors.push(`regular: ${(e as Error).message}`);
      }
    }
  }

  // ── Orari straordinari ────────────────────────────────────────────────────
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

  return NextResponse.json({
    ok: errors.length === 0,
    synced,
    errors: errors.length ? errors : undefined,
  });
}
