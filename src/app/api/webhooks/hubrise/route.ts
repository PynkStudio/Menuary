import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { findLinkByHubriseLocation, type HubriseLink } from "@/lib/hubrise/links";
import { getCustomer, getOrder } from "@/lib/hubrise/client";
import {
  detectPlatform,
  formatCustomerName,
  mapHubriseStatus,
} from "@/lib/hubrise/mappers";
import {
  resolveHubriseCustomer,
  recordCustomerEvent,
  updateExistingHubriseCustomer,
} from "@/lib/crm/customer-identity";
import { recordPlatformErrorFromRequest } from "@/lib/platform-errors";
import type {
  HubriseCustomerPayload,
  HubriseOrderPayload,
  HubriseWebhookEvent,
} from "@/lib/hubrise/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.HUBRISE_WEBHOOK_SECRET;

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) return true; // dev/staging senza secret configurato — log-only
  if (!signature) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature") ?? req.headers.get("x-hubrise-signature");

  if (!verifySignature(raw, signature)) {
    await logInbound({
      status: "signature_invalid",
      reason: "HMAC mismatch o header mancante",
      signature,
      rawBody: raw,
    });
    await recordPlatformErrorFromRequest(req, {
      error: new Error("invalid_hubrise_signature"),
      source: "webhook",
      severity: "warning",
      flow: "hubrise_webhook",
      operation: "verify_signature",
      title: "HubRise webhook: firma non valida",
      httpStatus: 401,
      metadata: { signaturePresent: Boolean(signature), rawPreview: raw.slice(0, 1000) },
    }).catch(() => undefined);
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: HubriseWebhookEvent;
  try {
    event = JSON.parse(raw) as HubriseWebhookEvent;
  } catch {
    await logInbound({ status: "processing_error", reason: "invalid_json", rawBody: raw });
    await recordPlatformErrorFromRequest(req, {
      error: new Error("invalid_json"),
      source: "webhook",
      severity: "warning",
      flow: "hubrise_webhook",
      operation: "parse_body",
      title: "HubRise webhook: payload JSON non valido",
      httpStatus: 400,
      metadata: { rawPreview: raw.slice(0, 2000) },
    }).catch(() => undefined);
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const link = await findLinkByHubriseLocation(event.location_id);
  if (!link) {
    await logInbound({
      status: "unmatched_location",
      reason: `Nessun hubrise_links per ${event.location_id}`,
      event,
    });
    await recordPlatformErrorFromRequest(req, {
      error: new Error("hubrise_location_unmatched"),
      source: "webhook",
      severity: "warning",
      flow: "hubrise_webhook",
      operation: "resolve_link",
      title: "HubRise webhook: location non collegata",
      httpStatus: 200,
      externalRef: event.resource_id,
      metadata: { event, hubriseLocationId: event.location_id },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, skipped: "no_active_link" });
  }
  if (link.status !== "active" || !link.ordersInboundEnabled) {
    await logInbound({
      status: "inactive_link",
      reason: `Link ${link.id} status=${link.status} inbound=${link.ordersInboundEnabled}`,
      event,
    });
    return NextResponse.json({ ok: true, skipped: "no_active_link" });
  }

  try {
    if (event.event === "order/create" || event.event === "order/update") {
      const payload =
        (event.data as HubriseOrderPayload | undefined) ??
        (await getOrder({ locationToken: link.locationToken, orderId: event.resource_id }));
      if (!payload) {
        await logInbound({ status: "processing_error", reason: "no_payload", event });
        return NextResponse.json({ error: "no_payload" }, { status: 422 });
      }

      if (event.event === "order/create") {
        await ingestNewOrder(link, payload);
      } else {
        await updateOrderStatusFromWebhook(link, payload);
      }
    } else if (event.event === "customer/update") {
      await syncCustomerUpdate(link, event);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logInbound({ status: "processing_error", reason: message.slice(0, 500), event });
    await recordPlatformErrorFromRequest(req, {
      error: err,
      source: "webhook",
      tenantId: link.tenantId,
      locationId: link.locationId,
      flow: "hubrise_webhook",
      operation: event.event,
      title: "HubRise webhook: elaborazione evento fallita",
      httpStatus: 500,
      externalRef: event.resource_id,
      metadata: {
        event,
        linkId: link.id,
        hubriseLocationId: event.location_id,
      },
    }).catch(() => undefined);
    throw err;
  }

  return NextResponse.json({ ok: true });
}

async function logInbound(input: {
  status: "signature_invalid" | "unmatched_location" | "inactive_link" | "processing_error";
  reason: string;
  event?: HubriseWebhookEvent;
  rawBody?: string;
  signature?: string | null;
}) {
  try {
    const supabase = createSupabaseServiceClient();
    if (!supabase) return;
    let payload: unknown = input.event ?? null;
    if (!payload && input.rawBody) {
      try {
        payload = JSON.parse(input.rawBody);
      } catch {
        payload = { raw: input.rawBody.slice(0, 4000) };
      }
    }
    await supabase.from("hubrise_inbound_log").insert({
      status: input.status,
      reason: input.reason,
      event: input.event?.event ?? null,
      hubrise_location_id: input.event?.location_id ?? null,
      resource_id: input.event?.resource_id ?? null,
      payload: (payload ?? null) as never,
      signature: input.signature ?? null,
    });
  } catch {
    // mai bloccare la response per un fallimento di logging
  }
}

async function syncCustomerUpdate(link: HubriseLink, event: HubriseWebhookEvent) {
  let payload = event.data as HubriseCustomerPayload | undefined;
  if (!payload && link.customerListId) {
    try {
      payload = await getCustomer({
        locationToken: link.locationToken,
        customerListId: link.customerListId,
        customerId: event.resource_id,
      });
    } catch {
      return; // best-effort: niente customer_list_id o fetch fallito → skip silenzioso
    }
  }
  if (!payload) return;

  await updateExistingHubriseCustomer({
    tenantId: link.tenantId,
    hubriseCustomerId: payload.id ?? event.resource_id,
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    displayName: formatCustomerName(payload),
  });
}

async function ingestNewOrder(link: HubriseLink, payload: HubriseOrderPayload) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) throw new Error("supabase_unavailable");

  // Idempotenza: se esiste già un ordine con questo external_order_id, no-op.
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("tenant_id", link.tenantId)
    .eq("external_order_id", payload.id)
    .maybeSingle();
  if (existing) return;

  const platform = detectPlatform(payload);

  const identity = await resolveHubriseCustomer({
    tenantId: link.tenantId,
    hubriseCustomerId: payload.customer?.id ?? null,
    phone: payload.customer?.phone ?? null,
    email: payload.customer?.email ?? null,
    displayName: formatCustomerName(payload.customer),
    platform,
  });

  const { data: codeRow, error: codeErr } = await supabase.rpc("next_order_code", {
    p_tenant_id: link.tenantId,
    p_prefix: "H",
  });
  if (codeErr) throw codeErr;

  const status = mapHubriseStatus(payload.status);
  const orderType: "asporto" | "tavolo" = payload.service_type === "eat_in" ? "tavolo" : "asporto";
  const dineOption =
    payload.service_type === "delivery"
      ? "delivery"
      : payload.service_type === "eat_in"
        ? "dine_in"
        : "takeaway";

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      tenant_id: link.tenantId,
      code: codeRow as string,
      type: orderType,
      total: Number(payload.total),
      status,
      customer_name: formatCustomerName(payload.customer),
      customer_email: payload.customer?.email ?? null,
      customer_phone: identity?.phone ?? payload.customer?.phone ?? null,
      customer_id: identity?.customerId ?? null,
      menuary_user_id: identity?.menuaryUserId ?? null,
      notes: payload.notes ?? null,
      location_id: link.locationId,
      dine_option: dineOption,
      pickup_time: payload.expected_time ?? null,
      auto_accepted: true,
      confirmed_at: new Date().toISOString(),
      source: "hubrise",
      external_order_id: payload.id,
      external_platform: platform,
      external_payload: payload as unknown as Record<string, unknown>,
    } as never)
    .select("id")
    .single();

  if (orderErr || !order) throw new Error(orderErr?.message ?? "order_insert_failed");

  const lineRows = payload.items.map((item, position) => ({
    order_id: order.id,
    item_id: item.product_ref ?? item.sku_ref ?? `external:${position}`,
    category_id: "external",
    name: item.product_name,
    qty: item.quantity,
    unit_price: Number(item.price),
    line_total: Number(item.price) * item.quantity,
    removed_ingredients: [] as string[],
    added_extras:
      item.options?.map((opt) => ({
        id: opt.ref ?? opt.name,
        name: opt.name,
        price: opt.price ? Number(opt.price) : 0,
      })) ?? [],
    bundle_picks: [] as unknown[],
    note: item.customer_notes ?? null,
    position,
  }));

  if (lineRows.length > 0) {
    await supabase.from("order_lines").insert(lineRows as never);
  }

  if (identity) {
    await recordCustomerEvent({
      tenantId: link.tenantId,
      customerId: identity.customerId,
      eventKind: "hubrise_order_created",
      refId: order.id,
      meta: {
        platform: platform ?? "unknown",
        total: Number(payload.total),
        hubriseOrderId: payload.id,
      },
    });
  }
}

async function updateOrderStatusFromWebhook(link: HubriseLink, payload: HubriseOrderPayload) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) throw new Error("supabase_unavailable");

  await supabase
    .from("orders")
    .update({
      status: mapHubriseStatus(payload.status),
      external_payload: payload as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("tenant_id", link.tenantId)
    .eq("external_order_id", payload.id);
}
