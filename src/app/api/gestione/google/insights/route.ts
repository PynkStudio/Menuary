import { NextResponse } from "next/server";
import { getPerformanceMetrics, type DatedValue } from "@/lib/google/my-business";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Tipi esposti al client ───────────────────────────────────────────────────

export type DailyPoint = { date: string; value: number }; // "YYYY-MM-DD"

export type InsightsResponse = {
  period: { from: string; to: string };
  totals: {
    views: number;
    websiteClicks: number;
    calls: number;
    directions: number;
  };
  // Serie giornaliera visualizzazioni (Maps + Search, mobile + desktop)
  viewsSeries: DailyPoint[];
  // Serie per KPI secondari
  clicksSeries: DailyPoint[];
  callsSeries: DailyPoint[];
  directionsSeries: DailyPoint[];
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function dateKey(d: DatedValue["date"]): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

function sumSeries(datedValues: DatedValue[]): number {
  return datedValues.reduce((acc, dv) => acc + (parseInt(dv.value || "0", 10) || 0), 0);
}

function toPoints(datedValues: DatedValue[]): DailyPoint[] {
  return datedValues.map((dv) => ({
    date: dateKey(dv.date),
    value: parseInt(dv.value || "0", 10) || 0,
  }));
}

function mergeSeries(...series: DatedValue[][]): DailyPoint[] {
  const map = new Map<string, number>();
  for (const s of series) {
    for (const dv of s) {
      const k = dateKey(dv.date);
      map.set(k, (map.get(k) ?? 0) + (parseInt(dv.value || "0", 10) || 0));
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

function dateParam(d: Date) {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

// GET /api/gestione/google/insights?tenantId=bepork&days=30
export async function GET(request: Request) {
  const url    = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");
  const days   = Math.min(parseInt(url.searchParams.get("days") ?? "30", 10), 90);

  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const location = await getPrimaryLocation(tenantId);
  if (!location) return NextResponse.json({ error: "Sede Google non collegata" }, { status: 404 });

  const endDate   = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  try {
    const data = await getPerformanceMetrics(
      tenantId,
      location.locationResourceName,
      dateParam(startDate),
      dateParam(endDate),
    );

    // Indicizza le serie per nome metrica
    const byMetric = new Map(
      data.multiDailyMetricTimeSeries.map((s) => [s.dailyMetric, s.timeSeries.datedValues]),
    );

    const get = (key: string): DatedValue[] => byMetric.get(key as never) ?? [];

    const desktopMaps    = get("BUSINESS_IMPRESSIONS_DESKTOP_MAPS");
    const mobileMaps     = get("BUSINESS_IMPRESSIONS_MOBILE_MAPS");
    const desktopSearch  = get("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH");
    const mobileSearch   = get("BUSINESS_IMPRESSIONS_MOBILE_SEARCH");
    const websiteClicks  = get("WEBSITE_CLICKS");
    const callClicks     = get("CALL_CLICKS");
    const directions     = get("BUSINESS_DIRECTION_REQUESTS");

    const response: InsightsResponse = {
      period: {
        from: startDate.toISOString().slice(0, 10),
        to:   endDate.toISOString().slice(0, 10),
      },
      totals: {
        views:         sumSeries(desktopMaps) + sumSeries(mobileMaps) + sumSeries(desktopSearch) + sumSeries(mobileSearch),
        websiteClicks: sumSeries(websiteClicks),
        calls:         sumSeries(callClicks),
        directions:    sumSeries(directions),
      },
      viewsSeries:      mergeSeries(desktopMaps, mobileMaps, desktopSearch, mobileSearch),
      clicksSeries:     toPoints(websiteClicks),
      callsSeries:      toPoints(callClicks),
      directionsSeries: toPoints(directions),
    };

    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
