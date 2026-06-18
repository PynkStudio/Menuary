import { NextResponse } from "next/server";
import { after } from "next/server";
import { triggerGoogleHoursSync } from "@/lib/google/hours-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sanitizeHoursWeek, type DaySchedule } from "@/lib/venue-hours";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";
import { authorizeGestione } from "@/lib/gestione-auth";

const SLOT_RE = /^([01]\d|2[0-3]):[0-5]\d\s–\s([01]\d|2[0-3]):[0-5]\d$/;

function isValidWeek(week: unknown): week is DaySchedule[] {
  if (!Array.isArray(week)) return false;
  return week.every(
    (d) =>
      d &&
      typeof d.label === "string" &&
      typeof d.closed === "boolean" &&
      Array.isArray(d.slots) &&
      d.slots.every((s: unknown) => typeof s === "string" && (s === "" || SLOT_RE.test(s.trim()))),
  );
}

/**
 * POST /api/gestione/hours
 * Body: { tenantId, locationId?, hours }
 * Se locationId è omesso, scrive sulla sede di default del tenant.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { tenantId?: string; locationId?: string; hours?: unknown }
    | null;
  if (!body?.tenantId || !isValidWeek(body.hours)) {
    return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
  }

  const { data: access } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("tenant_id", body.tenantId)
    .eq("enabled", true)
    .maybeSingle();
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cleaned = sanitizeHoursWeek(body.hours).map((d) => ({
    ...d,
    slots: d.slots.filter((s) => s.trim().length > 0),
  }));

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "DB non disponibile" }, { status: 500 });

  const auth = await authorizeGestione(body.tenantId);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const locationId = auth.isDemo
    ? body.locationId
    : (await requireActiveGestioneLocation(body.tenantId)).id;

  if (!locationId) {
    return NextResponse.json(
      { error: "Nessuna sede trovata per il tenant" },
      { status: 404 },
    );
  }
  if (!auth.isDemo && body.locationId && body.locationId !== locationId) {
    return NextResponse.json({ error: "Sede non attiva" }, { status: 403 });
  }

  // Verifica che la location appartenga al tenant (evita scritture cross-tenant)
  const { data: loc } = await db
    .from("locations")
    .select("id,tenant_id")
    .eq("id", locationId)
    .maybeSingle();
  if (!loc || loc.tenant_id !== body.tenantId) {
    return NextResponse.json({ error: "Sede non valida" }, { status: 403 });
  }

  // locations.hours aggiunta nella migrazione 20260526; cast finché supabase
  // gen types non viene rilanciato.
  const { error } = await db
    .from("locations")
    .update({ hours: cleaned } as never)
    .eq("id", locationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  after(() => triggerGoogleHoursSync(body.tenantId!, "regular"));

  return NextResponse.json({ ok: true, locationId });
}
