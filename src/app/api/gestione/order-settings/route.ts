import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { DEFAULT_ORDER_SETTINGS, loadOrderSettings } from "@/lib/orders/order-settings";
import type { TenantOrderSettings } from "@/lib/types";

type SettingsPatch = {
  tenantId?: string;
  locationId?: string | null;
  takeawayEnabled?: boolean;
  dineInEnabled?: boolean;
  takeawayWindowBeforeOpenMin?: number | null;
  takeawayWindowBeforeCloseMin?: number | null;
  dineInWindowBeforeOpenMin?: number | null;
  dineInWindowBeforeCloseMin?: number | null;
  autoAcceptEnabled?: boolean;
  autoAcceptMaxTotal?: number | null;
  autoAcceptMaxItems?: number | null;
  autoAcceptOnlyReturning?: boolean;
  autoAcceptNoNotes?: boolean;
  pendingTimeoutSeconds?: number;
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
  const locationId = locationFrom(req);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const settings = await loadOrderSettings(supabase, tenantId, locationId);
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as SettingsPatch | null;
  const tenantId = tenantFrom(req, body);
  const locationId = locationFrom(req, body);
  if (!tenantId || !body) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Sanity check sui valori numerici (no negativi, range ragionevole).
  const pendingTimeout = body.pendingTimeoutSeconds;
  if (pendingTimeout != null && (pendingTimeout < 30 || pendingTimeout > 600)) {
    return NextResponse.json(
      { error: "pendingTimeoutSeconds deve essere tra 30 e 600" },
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
    autoAcceptEnabled: body.autoAcceptEnabled ?? existing.autoAcceptEnabled,
    autoAcceptMaxTotal:
      body.autoAcceptMaxTotal !== undefined ? body.autoAcceptMaxTotal : existing.autoAcceptMaxTotal,
    autoAcceptMaxItems:
      body.autoAcceptMaxItems !== undefined ? body.autoAcceptMaxItems : existing.autoAcceptMaxItems,
    autoAcceptOnlyReturning:
      body.autoAcceptOnlyReturning ?? existing.autoAcceptOnlyReturning,
    autoAcceptNoNotes: body.autoAcceptNoNotes ?? existing.autoAcceptNoNotes,
    pendingTimeoutSeconds: body.pendingTimeoutSeconds ?? existing.pendingTimeoutSeconds,
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
        takeaway_window_before_open_min: merged.takeawayWindowBeforeOpenMin,
        takeaway_window_before_close_min: merged.takeawayWindowBeforeCloseMin,
        dine_in_window_before_open_min: merged.dineInWindowBeforeOpenMin,
        dine_in_window_before_close_min: merged.dineInWindowBeforeCloseMin,
        auto_accept_enabled: merged.autoAcceptEnabled,
        auto_accept_max_total: merged.autoAcceptMaxTotal,
        auto_accept_max_items: merged.autoAcceptMaxItems,
        auto_accept_only_returning: merged.autoAcceptOnlyReturning,
        auto_accept_no_notes: merged.autoAcceptNoNotes,
        pending_timeout_seconds: merged.pendingTimeoutSeconds,
      })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("tenant_order_settings").insert({
      tenant_id: tenantId,
      location_id: locationId,
      takeaway_enabled: merged.takeawayEnabled,
      dine_in_enabled: merged.dineInEnabled,
      takeaway_window_before_open_min: merged.takeawayWindowBeforeOpenMin,
      takeaway_window_before_close_min: merged.takeawayWindowBeforeCloseMin,
      dine_in_window_before_open_min: merged.dineInWindowBeforeOpenMin,
      dine_in_window_before_close_min: merged.dineInWindowBeforeCloseMin,
      auto_accept_enabled: merged.autoAcceptEnabled,
      auto_accept_max_total: merged.autoAcceptMaxTotal,
      auto_accept_max_items: merged.autoAcceptMaxItems,
      auto_accept_only_returning: merged.autoAcceptOnlyReturning,
      auto_accept_no_notes: merged.autoAcceptNoNotes,
      pending_timeout_seconds: merged.pendingTimeoutSeconds,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fresh = await loadOrderSettings(supabase, tenantId, locationId);
  return NextResponse.json({ settings: fresh });
}
