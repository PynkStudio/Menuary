import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { loadOrderSettings } from "@/lib/orders/order-settings";
import {
  scheduleDayForDate,
  generateTimeSlots,
  defaultHoursWeekForTenant,
  type DaySchedule,
} from "@/lib/venue-hours";

type SupabaseClient = ReturnType<typeof createSupabaseServiceClient>;

const WINDOW_DAYS = 7;
const SLOT_STEP_MINUTES = 15;
const TZ = "Europe/Rome";

function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowInTimezone(): Date {
  const str = new Date().toLocaleString("en-US", { timeZone: TZ });
  return new Date(str);
}

async function loadWeekHours(
  supabase: NonNullable<SupabaseClient>,
  tenantId: string,
  locationId: string | null,
): Promise<DaySchedule[] | null> {
  if (locationId) {
    const { data: loc } = await supabase
      .from("locations")
      .select("hours")
      .eq("id", locationId)
      .maybeSingle();
    if (loc?.hours && Array.isArray(loc.hours) && loc.hours.length > 0) return loc.hours as DaySchedule[];
  }
  const { data: tenant } = await supabase
    .from("tenants")
    .select("hours")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenant?.hours && Array.isArray(tenant.hours) && tenant.hours.length > 0) return tenant.hours as DaySchedule[];
  return null;
}

async function loadSpecialHours(
  supabase: NonNullable<SupabaseClient>,
  tenantId: string,
  locationId: string | null,
  dates: string[],
): Promise<Map<string, { closed: boolean; slots: string[] }>> {
  const map = new Map<string, { closed: boolean; slots: string[] }>();
  if (dates.length === 0) return map;
  const { data } = await supabase
    .from("tenant_special_hours")
    .select("date, closed, slots, location_id")
    .eq("tenant_id", tenantId)
    .in("date", dates);
  if (!data) return map;
  for (const row of data) {
    const existing = map.get(row.date);
    const isExact = row.location_id === locationId;
    const isGlobal = row.location_id === null;
    if (!existing || isExact) {
      if (isExact || isGlobal) {
        map.set(row.date, {
          closed: row.closed,
          slots: Array.isArray(row.slots) ? (row.slots as string[]) : [],
        });
      }
    }
  }
  return map;
}

type AvailableDay = {
  date: string;
  label: string;
  slots: string[];
};

/**
 * GET /api/orders/public-settings?tenantId=…&locationId=…
 *
 * Endpoint pubblico (no auth): espone i flag canale + giorni/orari disponibili
 * per il selettore ordini nel frontend.
 */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const locationId = req.nextUrl.searchParams.get("locationId");
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const s = await loadOrderSettings(supabase, tenantId, locationId ?? null);

  const weekHours = await loadWeekHours(supabase, tenantId, locationId ?? null);
  const hours = weekHours ?? defaultHoursWeekForTenant(tenantId);

  const now = nowInTimezone();
  const today = isoDateLocal(now);
  const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const candidateDates: Date[] = [];
  for (let i = 0; i < WINDOW_DAYS; i++) {
    candidateDates.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
  }

  const specialHours = await loadSpecialHours(
    supabase,
    tenantId,
    locationId ?? null,
    candidateDates.map(isoDateLocal),
  );

  const days: AvailableDay[] = [];
  const dayLabels = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];

  for (const d of candidateDates) {
    const iso = isoDateLocal(d);
    const special = specialHours.get(iso);
    let daySched: DaySchedule;
    if (special) {
      daySched = { label: "", closed: special.closed, slots: special.slots };
    } else {
      daySched = scheduleDayForDate(hours, d);
    }
    if (daySched.closed) continue;

    let allSlots = generateTimeSlots(daySched.slots, SLOT_STEP_MINUTES);

    if (iso === today) {
      const minTime = addMinutes(currentHHMM, 20);
      allSlots = allSlots.filter((s) => s >= minTime);
    }
    if (allSlots.length === 0) continue;

    const dow = (d.getDay() + 6) % 7;
    const label = iso === today
      ? "Oggi"
      : iso === isoDateLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
        ? "Domani"
        : `${dayLabels[dow]} ${d.getDate()}/${d.getMonth() + 1}`;

    days.push({ date: iso, label, slots: allSlots });
  }

  return NextResponse.json({
    takeawayEnabled: s.takeawayEnabled,
    dineInEnabled: s.dineInEnabled,
    deliveryEnabled: s.deliveryEnabled,
    availableDays: days,
  });
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const rh = Math.floor(total / 60) % 24;
  const rm = Math.ceil((total % 60) / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
  if (rm >= 60) {
    return `${String(rh + 1).padStart(2, "0")}:00`;
  }
  return `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
}
