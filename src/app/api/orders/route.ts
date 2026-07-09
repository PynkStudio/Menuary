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
import { evaluateAutoAccept, loadOrderSettings, resolveOrderNoticeMinutes, resolvePendingTimeoutSeconds } from "@/lib/orders/order-settings";
import { dispatchComandaForOrder } from "@/lib/printing/dispatch";
import { notifyCustomerOrderStatus } from "@/lib/orders/order-notifications";
import { checkOrderingWindow, type OrderChannel } from "@/lib/orders/ordering-window";
import { sendOrderConfirmationEmail } from "@/lib/orders/send-confirmation-email";
import { validateMenuItemsForOrderChannel } from "@/lib/menu-order-channels";
import { COPERTO_ITEM_ID } from "@/lib/coperto";
import { findTenantById } from "@/lib/tenant-registry";
import { notifyOperationalNewOrder } from "@/lib/notifications/operational-order-push";
import { recordPlatformErrorFromRequest } from "@/lib/platform-errors";
import type { CartLine, OrderDineOption } from "@/lib/types";
import type { Database } from "@/lib/database.types";

// ─── POST /api/orders — crea ordine ──────────────────────────────────────────

function normalizeDesiredOrderTime(input: { desiredTime?: string | null; pickupTime?: string | null; pickupDate?: string | null }): string | null {
  const rawTime = (input.desiredTime ?? input.pickupTime ?? "").trim();
  if (!rawTime) return null;
  const date = input.pickupDate?.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") && /^\d{1,2}:\d{2}$/.test(rawTime)) {
    const [hour, minute] = rawTime.split(":");
    return `${date} ${hour!.padStart(2, "0")}:${minute}`;
  }
  return rawTime;
}

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
  deliveryAddress?: string;
  deliveryDoorbell?: string;
  deliveryFloor?: string;
  deliveryNotes?: string;
};

async function logOrderApiError(
  req: NextRequest,
  error: unknown,
  context: {
    tenantId?: string | null;
    locationId?: string | null;
    orderId?: string | null;
    operation: string;
    title: string;
    httpStatus?: number;
    metadata?: Record<string, unknown>;
  },
) {
  await recordPlatformErrorFromRequest(req, {
    error,
    source: "api",
    severity: context.httpStatus && context.httpStatus < 500 ? "warning" : "error",
    tenantId: context.tenantId ?? null,
    locationId: context.locationId ?? null,
    orderId: context.orderId ?? null,
    flow: "orders",
    operation: context.operation,
    title: context.title,
    httpStatus: context.httpStatus ?? 500,
    metadata: context.metadata as Record<string, never>,
  }).catch(() => undefined);
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const body: CreateOrderBody = await req.json().catch((error) => {
    void logOrderApiError(req, error, {
      operation: "parse_body",
      title: "Creazione ordine: body JSON non valido",
      httpStatus: 400,
    });
    return null as unknown as CreateOrderBody;
  });
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  const { tenantId, type, lines, total, locationId, ...rest } = body;

  if (!tenantId || !type || !lines?.length) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  if (rest.dineOption === "delivery" && !rest.deliveryAddress?.trim()) {
    return NextResponse.json({ error: "Indirizzo di consegna obbligatorio per delivery.", code: "delivery_address_required" }, { status: 422 });
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
  if (codeErr) {
    await logOrderApiError(req, codeErr, {
      tenantId,
      locationId,
      operation: "next_order_code",
      title: "Creazione ordine: generazione codice fallita",
      metadata: { orderType: type, total, customerPhone: rest.customerPhone ?? null },
    });
    return NextResponse.json({ error: codeErr.message }, { status: 500 });
  }

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
  const desiredTime = normalizeDesiredOrderTime({
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
  const pendingTimeoutSeconds = resolvePendingTimeoutSeconds(settings.pendingTimeoutSeconds);
  const confirmationExpiresAt = autoAccepted
    ? null
    : new Date(Date.now() + pendingTimeoutSeconds * 1000).toISOString();
  const confirmedAt = autoAccepted ? new Date().toISOString() : null;

  // Inserisci ordine
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenantId,
      code: codeRow as string,
      type,
      total,
      source: "web",
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
      desired_time: desiredTime,
      notes: rest.notes ?? null,
      location_id: locationId ?? null,
      dine_option: rest.dineOption ?? null,
      delivery_address: rest.deliveryAddress?.trim() || null,
      delivery_doorbell: rest.deliveryDoorbell?.trim() || null,
      delivery_floor: rest.deliveryFloor?.trim() || null,
      delivery_notes: rest.deliveryNotes?.trim() || null,
      confirmation_expires_at: confirmationExpiresAt,
      confirmed_at: confirmedAt,
      auto_accepted: autoAccepted,
    } as never)
    .select("id, code, public_token, customer_phone")
    .single();

  if (orderErr || !order) {
    await logOrderApiError(req, orderErr ?? new Error("order_insert_empty"), {
      tenantId,
      locationId,
      operation: "insert_order",
      title: "Creazione ordine: inserimento ordine fallito",
      metadata: {
        orderType: type,
        total,
        linesCount: lines.length,
        customerName: rest.customerName ?? null,
        customerPhone: rest.customerPhone ?? null,
        tableId: rest.tableId ?? null,
        sessionId: rest.sessionId ?? null,
        dineOption: rest.dineOption ?? null,
        autoAccepted,
        initialStatus,
      },
    });
    return NextResponse.json({ error: orderErr?.message }, { status: 500 });
  }

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
    if (linesErr) {
      await logOrderApiError(req, linesErr, {
        tenantId,
        locationId,
        orderId: order.id,
        operation: "insert_order_lines",
        title: "Creazione ordine: inserimento righe fallito",
        metadata: { orderCode: order.code, linesCount: lineRows.length, itemIds: lines.map((line) => line.itemId) },
      });
      return NextResponse.json({ error: linesErr.message }, { status: 500 });
    }
  }

  // Stampa comanda server-side (es. stampante cloud SUNMI) per ordini accettati.
  // QZ è gestito lato client; dispatch è no-op se non configurato. Mai bloccante.
  if (autoAccepted) {
    void dispatchComandaForOrder(supabase, tenantId, order.id, locationId ?? null).catch((error) => {
      void logOrderApiError(req, error, {
        tenantId,
        locationId,
        orderId: order.id,
        operation: "dispatch_comanda",
        title: "Stampa comanda automatica fallita",
        metadata: { orderCode: order.code, autoAccepted, channel: "web" },
      });
    });
  }

  void notifyOperationalNewOrder({
    tenantId,
    orderCode: order.code,
    status: initialStatus,
    customerName: rest.customerName ?? null,
    locationId: locationId ?? null,
  }).catch(() => null);

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
    orderSource: "web",
    orderType: type,
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
      pendingTimeoutSeconds,
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
  if (error) {
    await logOrderApiError(req, error, {
      tenantId,
      operation: "list_orders",
      title: "Ordini: lettura elenco fallita",
      metadata: { status, sessionId },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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
