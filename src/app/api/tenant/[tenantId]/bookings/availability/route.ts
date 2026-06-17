import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { slotsForDate, romeWallClockToUtc } from "@/lib/pynkstudio/booking";

export const dynamic = "force-dynamic";

// Disponibilità slot di un giorno per la prenotazione call. Nessun dato personale:
// ritorna solo gli orari e se sono liberi.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  if (!findTenantById(tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const dateISO = new URL(request.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const slots = slotsForDate(dateISO);
  if (!slots.length) {
    return NextResponse.json({ date: dateISO, slots: [] });
  }

  const svc = createSupabaseServiceClient();
  const bookedStarts = new Set<number>();
  if (svc) {
    const dayStart = romeWallClockToUtc(dateISO, 0, 0).toISOString();
    const dayEnd = romeWallClockToUtc(dateISO, 23, 59).toISOString();
    const { data } = await svc
      .from("consultation_bookings")
      .select("starts_at")
      .eq("tenant_id", tenantId)
      .eq("status", "confirmed")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd);
    for (const row of data ?? []) bookedStarts.add(new Date(row.starts_at).getTime());
  }

  const now = Date.now();
  const out = slots.map((s) => ({
    time: s.time,
    startUtc: s.startUtc.toISOString(),
    available: s.startUtc.getTime() > now && !bookedStarts.has(s.startUtc.getTime()),
  }));

  return NextResponse.json({ date: dateISO, slots: out });
}
