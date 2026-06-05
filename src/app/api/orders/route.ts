import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  cartLinesToDbRows,
  dbLinesToOrderLines,
  dbRowToOrder,
  type DbOrder,
  type DbOrderLine,
} from "@/lib/api/orders";
import { recordCustomerEvent, resolveCustomerIdentity } from "@/lib/crm/customer-identity";
import { evaluateAutoAccept, loadOrderSettings, resolveOrderNoticeMinutes } from "@/lib/orders/order-settings";
import { notifyCustomerOrderStatus } from "@/lib/orders/order-notifications";
import { checkOrderingWindow, type OrderChannel } from "@/lib/orders/ordering-window";
import { sendOrderConfirmationEmail } from "@/lib/orders/send-confirmation-email";
import { validateMenuItemsForOrderChannel } from "@/lib/menu-order-channels";
import { COPERTO_ITEM_ID } from "@/lib/coperto";
import { findTenantById } from "@/lib/tenant-registry";
import type { CartLine, OrderDineOption } from "@/lib/types";
import type { Database } from "@/lib/database.types";

// ─── POST /api/orders — crea ordine ──────────────────────────────────────────

export type CreateOrderBody = {
  tenantId: string;
  type: "asporto" | "tavolo";
  lines: CartLine[];
  total: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  menuaryUserId?: string | null;
  pickupTime?: string;
  pickupDate?: string;
  desiredTime?: string;
  notes?: string;
  tableId?: string;
  tableLabel?: string;
  sessionId?: string;
  sessionCode?: string;
  dinerClientId?: string;
  dinerNickname?: string;
  /** Per locali senza tavoli numerati: 'dine_in' (vassoio) vs 'takeaway' (sacchetto). */
  dineOption?: OrderDineOption;
  /** ID sede da cui proviene l'ordine — null per tenant single-location */
  locationId?: string;
};

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const body: CreateOrderBody = await req.json();
  const { tenantId, type, lines, total, locationId, ...rest } = body;

  if (!tenantId || !type || !lines?.length) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  const invalidMenuItems = await validateMenuItemsForOrderChannel(supabase, {
    tenantId,
    itemCodes: lines.map((line) => line.itemId).filter((itemId) => itemId !== COPERTO_ITEM_ID),
    channel: type === "tavolo" ? "table" : "online",
    tableId: rest.tableId ?? null,
  });
  if (invalidMenuItems.length > 0) {
    return NextResponse.json(
      { error: "Alcuni prodotti non sono disponibili per questo canale.", code: "items_not_in_active_menu", items: invalidMenuItems },
      { status: 422 },
    );
  }

  // Genera codice ordine atomico (B001, B002…)
  const { data: codeRow, error: codeErr } = await supabase.rpc("next_order_code", {
    p_tenant_id: tenantId,
    p_prefix: "B",
  });
  if (codeErr) return NextResponse.json({ error: codeErr.message }, { status: 500 });

  const identity = await resolveCustomerIdentity({
    tenantId,
    phone: rest.customerPhone,
    displayName: rest.customerName,
    source: "web",
  });

  // ── Settings ordine + valutazione auto-accept ──────────────────────────────
  const settings = await loadOrderSettings(supabase, tenantId, locationId ?? null);

  // ── Validazione finestra orari (skip per ordini tavolo da QR: il cliente è già fisicamente nel locale) ──
  if (type === "asporto") {
    const channel: OrderChannel =
      rest.dineOption === "dine_in"
        ? "dine_in"
        : rest.dineOption === "delivery"
          ? "delivery"
          : "takeaway";
    const windowCheck = await checkOrderingWindow(supabase, {
      tenantId,
      locationId: locationId ?? null,
      settings,
      channel,
    });
    if (!windowCheck.ok) {
      const messages: Record<string, string> = {
        channel_disabled: "Questo canale di ordine non è attivo.",
        closed_today: "Oggi il locale è chiuso.",
        outside_window: "Gli ordini non sono attivi in questa fascia oraria.",
        no_hours_configured: "Orari non configurati.",
      };
      return NextResponse.json(
        { error: messages[windowCheck.reason] ?? "ordering_not_available", code: windowCheck.reason },
        { status: 422 },
      );
    }
  }

  const itemsCount = lines.reduce((acc, l) => acc + l.qty, 0);
  const hasNotes =
    Boolean(rest.notes && rest.notes.trim().length > 0) ||
    lines.some((l) => Boolean(l.note && l.note.trim().length > 0));
  const isReturningCustomer = Boolean(identity?.registered) || Boolean(identity?.customerId);
  const crmEnabled = Boolean(findTenantById(tenantId)?.features.crm);
  const noticeMinutes = resolveOrderNoticeMinutes({
    pickupTime: rest.pickupTime,
    pickupDate: rest.pickupDate,
    desiredTime: rest.desiredTime,
  });

  const autoAccepted = evaluateAutoAccept(settings, {
    total,
    itemsCount,
    hasNotes,
    isReturningCustomer,
    crmEnabled,
    noticeMinutes,
  });

  const initialStatus = autoAccepted ? "nuovo" : "pending_confirmation";
  const confirmationExpiresAt = autoAccepted
    ? null
    : new Date(Date.now() + settings.pendingTimeoutSeconds * 1000).toISOString();
  const confirmedAt = autoAccepted ? new Date().toISOString() : null;

  // Inserisci ordine
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenantId,
      code: codeRow as string,
      type,
      total,
      status: initialStatus,
      table_id: rest.tableId ?? null,
      table_label: rest.tableLabel ?? null,
      session_id: rest.sessionId ?? null,
      session_code: rest.sessionCode ?? null,
      diner_client_id: rest.dinerClientId ?? null,
      diner_nickname: rest.dinerNickname ?? null,
      customer_name: rest.customerName ?? null,
      customer_email: rest.customerEmail ?? null,
      customer_phone: identity?.phone ?? rest.customerPhone ?? null,
      customer_id: identity?.customerId ?? null,
      menuary_user_id: rest.menuaryUserId ?? identity?.menuaryUserId ?? null,
      pickup_time: rest.pickupTime ?? null,
      desired_time: rest.desiredTime ?? rest.pickupTime ?? null,
      notes: rest.notes ?? null,
      location_id: locationId ?? null,
      dine_option: rest.dineOption ?? null,
      confirmation_expires_at: confirmationExpiresAt,
      confirmed_at: confirmedAt,
      auto_accepted: autoAccepted,
    } as never)
    .select("id, code, public_token, customer_phone")
    .single();

  if (orderErr || !order) return NextResponse.json({ error: orderErr?.message }, { status: 500 });

  if (identity) {
    await recordCustomerEvent({
      tenantId,
      customerId: identity.customerId,
      eventKind: type === "asporto" ? "takeaway_order_created" : "table_order_created",
      refId: order.id,
      meta: {
        source: "web",
        registered: identity.registered,
        total,
        orderType: type,
        autoAccepted,
        initialStatus,
      },
    });
  }

  // Inserisci righe ordine
  const lineRows = cartLinesToDbRows(order.id, lines);
  if (lineRows.length > 0) {
    const { error: linesErr } = await supabase.from("order_lines").insert(lineRows);
    if (linesErr) return NextResponse.json({ error: linesErr.message }, { status: 500 });
  }

  // Auto-accept: notifichiamo subito il cliente per email (best-effort).
  if (autoAccepted) {
    void sendOrderConfirmationEmail(supabase, order.id).catch(() => {});
  }
  void notifyCustomerOrderStatus({
    tenantId,
    orderId: order.id,
    code: order.code,
    publicToken: (order as { public_token?: string }).public_token ?? "",
    customerPhone: (order as { customer_phone?: string | null }).customer_phone,
    kind: autoAccepted ? "confirmed" : "created",
    req,
  });

  return NextResponse.json(
    {
      id: order.id,
      code: order.code,
      publicToken: (order as { public_token?: string }).public_token ?? null,
      status: initialStatus,
      autoAccepted,
      confirmationExpiresAt,
      pendingTimeoutSeconds: settings.pendingTimeoutSeconds,
    },
    { status: 201 },
  );
}

// ─── GET /api/orders?tenantId=…&status=…&sessionId=… ─────────────────────────

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const status = url.searchParams.get("status");
  const sessionId = url.searchParams.get("sessionId");

  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  let query = supabase
    .from("orders")
    .select("*, order_lines(*)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as Database["public"]["Enums"]["order_status"]);
  if (sessionId) query = query.eq("session_id", sessionId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = (data ?? []).map((row) => {
 const { order_lines: dbLines, ...orderRow } =
  row as unknown as DbOrder & { order_lines: DbOrderLine[] };
    const lines = dbLinesToOrderLines(
      (dbLines ?? []).sort((a, b) => a.position - b.position),
    );
    return dbRowToOrder(orderRow, lines);
  });

  return NextResponse.json(orders);
}
