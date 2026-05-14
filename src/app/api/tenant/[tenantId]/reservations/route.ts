import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isAdminRequest } from "@/lib/api/admin-guard";
import {
  reservationNeedsManualApproval,
  suggestTableForReservation,
  type ReservationSlot,
  type TableForPlanner,
} from "@/lib/reservations/engine";

type CreateBody = {
  customerName: string;
  customerPhone: string;
  covers: number;
  reservationDate: string;
  reservationTime: string;
  notes?: string;
  specialRequestTags?: string[];
  menuaryUserId?: string | null;
};

function normalizeDate(raw: string): string | null {
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await ctx.params;
  if (!findTenantById(tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "supabase_service_unconfigured" }, { status: 503 });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const reservationDate = normalizeDate(body.reservationDate);
  if (
    !body.customerName?.trim() ||
    !body.customerPhone?.trim() ||
    !reservationDate ||
    !body.reservationTime?.trim()
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const covers = Math.max(1, Math.min(99, Number(body.covers) || 1));
  const tags = Array.isArray(body.specialRequestTags) ? body.specialRequestTags : [];
  const notes = body.notes?.trim() ?? "";
  const manual = reservationNeedsManualApproval(notes, tags);

  const { data: tablesRaw, error: te } = await svc
    .from("tables")
    .select("id,label,seats,area")
    .eq("tenant_id", tenantId);

  if (te) {
    return NextResponse.json({ error: te.message }, { status: 500 });
  }

  const tables: TableForPlanner[] = (tablesRaw ?? []).map((t) => ({
    id: t.id,
    label: t.label,
    seats: t.seats,
    area: t.area ?? "Sala",
  }));

  const { data: existingRows } = await svc
    .from("reservation_requests")
    .select("table_id,covers,reservation_date,reservation_time,status")
    .eq("tenant_id", tenantId)
    .eq("reservation_date", reservationDate);

  const existing: ReservationSlot[] = (existingRows ?? []).map((r) => ({
    tableId: r.table_id,
    covers: r.covers,
    reservationDate: r.reservation_date,
    reservationTime: r.reservation_time,
    status: r.status,
  }));

  const { tableId, assignedArea } = manual
    ? { tableId: null as string | null, assignedArea: null as string | null }
    : suggestTableForReservation(tables, existing, covers);

  const status = manual ? "pending_manual" : tableId ? "auto_proposed" : "pending_manual";

  const { data: row, error: ins } = await svc
    .from("reservation_requests")
    .insert({
      tenant_id: tenantId,
      customer_name: body.customerName.trim(),
      customer_phone: body.customerPhone.trim(),
      covers,
      reservation_date: reservationDate,
      reservation_time: body.reservationTime.trim(),
      notes: notes || null,
      special_request_tags: tags,
      status,
      table_id: tableId,
      assigned_area: assignedArea,
      menuary_user_id: body.menuaryUserId ?? null,
      channel: "web",
    })
    .select("id")
    .single();

  if (ins) {
    return NextResponse.json({ error: ins.message }, { status: 500 });
  }

  return NextResponse.json({ id: row.id, status, tableId, assignedArea });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tenantId } = await ctx.params;
  if (!findTenantById(tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "supabase_service_unconfigured" }, { status: 503 });
  }

  const { data, error } = await svc
    .from("reservation_requests")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reservations: data ?? [] });
}
