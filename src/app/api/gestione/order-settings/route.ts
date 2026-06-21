import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { DEFAULT_ORDER_SETTINGS, loadOrderSettings } from "@/lib/orders/order-settings";
import type { TenantOrderSettings } from "@/lib/types";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";

type SettingsPatch = {
  tenantId?: string;
  locationId?: string | null;
  takeawayEnabled?: boolean;
  dineInEnabled?: boolean;
  deliveryEnabled?: boolean;
  takeawayWindowBeforeOpenMin?: number | null;
  takeawayWindowBeforeCloseMin?: number | null;
  dineInWindowBeforeOpenMin?: number | null;
  dineInWindowBeforeCloseMin?: number | null;
  deliveryWindowBeforeOpenMin?: number | null;
  deliveryWindowBeforeCloseMin?: number | null;
  autoAcceptEnabled?: boolean;
  autoAcceptMaxTotal?: number | null;
  autoAcceptMaxItems?: number | null;
  autoAcceptOnlyReturning?: boolean;
  autoAcceptNoNotes?: boolean;
  autoAcceptMinNoticeMinutes?: number | null;
  pendingTimeoutSeconds?: number;
  avgHandlingMinutes?: number;
};

function tenantFrom(req: NextRequest, body?: SettingsPatch | null) {
  return req.nextUrl.searchParams.get("tenantId") ?? body?.tenantId ?? "";
}

function locationFrom(req: NextRequest, body?: SettingsPatch | null): string | null {
  const q = req.nextUrl.searchParams.get("locationId");
  if (q) return q;
  if (body && body.locationId !== undefined) return body.locationId;
  return null;
}

export async function GET(req: NextRequest) {
  const tenantId = tenantFrom(req);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const requestedLocationId = locationFrom(req);
  const locationId = auth.isDemo
    ? requestedLocationId
    : (await requireActiveGestioneLocation(tenantId)).id;
  if (!auth.isDemo && requestedLocationId && requestedLocationId !== locationId) {
    return NextResponse.json({ error: "location_mismatch" }, { status: 403 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const settings = await loadOrderSettings(supabase, tenantId, locationId);
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as SettingsPatch | null;
  const tenantId = tenantFrom(req, body);
  if (!tenantId || !body) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const requestedLocationId = locationFrom(req, body);
  const locationId = auth.isDemo
    ? requestedLocationId
    : (await requireActiveGestioneLocation(tenantId)).id;
  if (!auth.isDemo && requestedLocationId && requestedLocationId !== locationId) {
    return NextResponse.json({ error: "location_mismatch" }, { status: 403 });
  }

  // Sanity check sui valori numerici (no negativi, range ragionevole).
  const pendingTimeout = body.pendingTimeoutSeconds;
  if (pendingTimeout != null && (pendingTimeout < 30 || pendingTimeout > 600)) {
    return NextResponse.json(
      { error: "pendingTimeoutSeconds deve essere tra 30 e 600" },
      { status: 422 },
    );
  }
  const minNotice = body.autoAcceptMinNoticeMinutes;
  if (minNotice != null && (minNotice < 0 || minNotice > 10080)) {
    return NextResponse.json(
      { error: "autoAcceptMinNoticeMinutes deve essere tra 0 e 10080" },
      { status: 422 },
    );
  }
  const avgHandling = body.avgHandlingMinutes;
  if (avgHandling != null && (avgHandling < 0 || avgHandling > 600)) {
    return NextResponse.json(
      { error: "avgHandlingMinutes deve essere tra 0 e 600" },
      { status: 422 },
    );
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  // Carichiamo eventuale riga esistente per fare upsert merge.
  const existing = await loadOrderSettings(supabase, tenantId, locationId);

  const merged: Omit<TenantOrderSettings, "id"> = {
    tenantId,
    locationId,
    takeawayEnabled: body.takeawayEnabled ?? existing.takeawayEnabled ?? DEFAULT_ORDER_SETTINGS.takeawayEnabled,
    dineInEnabled: body.dineInEnabled ?? existing.dineInEnabled ?? DEFAULT_ORDER_SETTINGS.dineInEnabled,
    deliveryEnabled: body.deliveryEnabled ?? existing.deliveryEnabled ?? DEFAULT_ORDER_SETTINGS.deliveryEnabled,
    takeawayWindowBeforeOpenMin:
      body.takeawayWindowBeforeOpenMin !== undefined
        ? body.takeawayWindowBeforeOpenMin
        : existing.takeawayWindowBeforeOpenMin,
    takeawayWindowBeforeCloseMin:
      body.takeawayWindowBeforeCloseMin !== undefined
        ? body.takeawayWindowBeforeCloseMin
        : existing.takeawayWindowBeforeCloseMin,
    dineInWindowBeforeOpenMin:
      body.dineInWindowBeforeOpenMin !== undefined
        ? body.dineInWindowBeforeOpenMin
        : existing.dineInWindowBeforeOpenMin,
    dineInWindowBeforeCloseMin:
      body.dineInWindowBeforeCloseMin !== undefined
        ? body.dineInWindowBeforeCloseMin
        : existing.dineInWindowBeforeCloseMin,
    deliveryWindowBeforeOpenMin:
      body.deliveryWindowBeforeOpenMin !== undefined
        ? body.deliveryWindowBeforeOpenMin
        : existing.deliveryWindowBeforeOpenMin,
    deliveryWindowBeforeCloseMin:
      body.deliveryWindowBeforeCloseMin !== undefined
        ? body.deliveryWindowBeforeCloseMin
        : existing.deliveryWindowBeforeCloseMin,
    autoAcceptEnabled: body.autoAcceptEnabled ?? existing.autoAcceptEnabled,
    autoAcceptMaxTotal:
      body.autoAcceptMaxTotal !== undefined ? body.autoAcceptMaxTotal : existing.autoAcceptMaxTotal,
    autoAcceptMaxItems:
      body.autoAcceptMaxItems !== undefined ? body.autoAcceptMaxItems : existing.autoAcceptMaxItems,
    autoAcceptOnlyReturning:
      body.autoAcceptOnlyReturning ?? existing.autoAcceptOnlyReturning,
    autoAcceptNoNotes: body.autoAcceptNoNotes ?? existing.autoAcceptNoNotes,
    autoAcceptMinNoticeMinutes:
      body.autoAcceptMinNoticeMinutes !== undefined
        ? body.autoAcceptMinNoticeMinutes
        : existing.autoAcceptMinNoticeMinutes,
    pendingTimeoutSeconds: body.pendingTimeoutSeconds ?? existing.pendingTimeoutSeconds,
    avgHandlingMinutes: body.avgHandlingMinutes ?? existing.avgHandlingMinutes,
  };

  // L'unique index parziale (tenant_id) WHERE location_id IS NULL non è gestibile
  // direttamente da upsert con onConflict; quindi facciamo update se esiste id,
  // altrimenti insert.
  if (existing.id) {
    const { error } = await supabase
      .from("tenant_order_settings")
      .update({
        takeaway_enabled: merged.takeawayEnabled,
        dine_in_enabled: merged.dineInEnabled,
        delivery_enabled: merged.deliveryEnabled,
        takeaway_window_before_open_min: merged.takeawayWindowBeforeOpenMin,
        takeaway_window_before_close_min: merged.takeawayWindowBeforeCloseMin,
        dine_in_window_before_open_min: merged.dineInWindowBeforeOpenMin,
        dine_in_window_before_close_min: merged.dineInWindowBeforeCloseMin,
        delivery_window_before_open_min: merged.deliveryWindowBeforeOpenMin,
        delivery_window_before_close_min: merged.deliveryWindowBeforeCloseMin,
        auto_accept_enabled: merged.autoAcceptEnabled,
        auto_accept_max_total: merged.autoAcceptMaxTotal,
        auto_accept_max_items: merged.autoAcceptMaxItems,
        auto_accept_only_returning: merged.autoAcceptOnlyReturning,
        auto_accept_no_notes: merged.autoAcceptNoNotes,
        auto_accept_min_notice_minutes: merged.autoAcceptMinNoticeMinutes,
        pending_timeout_seconds: merged.pendingTimeoutSeconds,
        avg_handling_minutes: merged.avgHandlingMinutes,
      })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("tenant_order_settings").insert({
      tenant_id: tenantId,
      location_id: locationId,
      takeaway_enabled: merged.takeawayEnabled,
      dine_in_enabled: merged.dineInEnabled,
      delivery_enabled: merged.deliveryEnabled,
      takeaway_window_before_open_min: merged.takeawayWindowBeforeOpenMin,
      takeaway_window_before_close_min: merged.takeawayWindowBeforeCloseMin,
      dine_in_window_before_open_min: merged.dineInWindowBeforeOpenMin,
      dine_in_window_before_close_min: merged.dineInWindowBeforeCloseMin,
      delivery_window_before_open_min: merged.deliveryWindowBeforeOpenMin,
      delivery_window_before_close_min: merged.deliveryWindowBeforeCloseMin,
      auto_accept_enabled: merged.autoAcceptEnabled,
      auto_accept_max_total: merged.autoAcceptMaxTotal,
      auto_accept_max_items: merged.autoAcceptMaxItems,
      auto_accept_only_returning: merged.autoAcceptOnlyReturning,
      auto_accept_no_notes: merged.autoAcceptNoNotes,
      auto_accept_min_notice_minutes: merged.autoAcceptMinNoticeMinutes,
      pending_timeout_seconds: merged.pendingTimeoutSeconds,
      avg_handling_minutes: merged.avgHandlingMinutes,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fresh = await loadOrderSettings(supabase, tenantId, locationId);
  return NextResponse.json({ settings: fresh });
}
