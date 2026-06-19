"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";
import { pushOrderStatusToHubrise } from "@/lib/hubrise/push-status";
import { sendOrderConfirmationEmail } from "@/lib/orders/send-confirmation-email";
import { notifyCustomerOrderStatus, type OrderNotificationKind } from "@/lib/orders/order-notifications";
import type { Database } from "@/lib/database.types";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";

type Status = Database["public"]["Enums"]["order_status"];

function notificationKindForStatus(status: Status): OrderNotificationKind {
  switch (status) {
    case "nuovo": return "confirmed";
    case "annullato": return "cancelled";
    case "in_consegna": return "out_for_delivery";
    default: return "updated";
  }
}

async function update(tenantSlug: string, orderId: string, status: Status) {
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;

  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const location = await requireActiveGestioneLocation(tenantSlug);

  const { data: order } = await svc
    .from("orders")
    .select("id, code, public_token, customer_phone, source, type")
    .eq("id", orderId)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id)
    .maybeSingle();

  const { error } = await svc
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id);

  if (error) throw new Error(error.message);

  after(async () => {
    await pushOrderStatusToHubrise({ orderId, newStatus: status });
    if (order) {
      await notifyCustomerOrderStatus({
        tenantId: tenantSlug,
        orderId: order.id,
        code: order.code,
        publicToken: order.public_token,
        customerPhone: order.customer_phone,
        kind: notificationKindForStatus(status),
        orderSource: order.source,
        orderType: order.type,
      }).catch(() => {});
    }
  });

  revalidatePath(`/gestione/${tenantSlug}/ordini`);
}

function makeAction(status: Status) {
  return async (formData: FormData) => {
    const tenantSlug = String(formData.get("tenantSlug") ?? "");
    const id = String(formData.get("id") ?? "");
    if (!tenantSlug || !id) return;
    await update(tenantSlug, id, status);
  };
}

export const startOrder = makeAction("in_preparazione");
export const markReady = makeAction("pronto");
export const markDelivered = makeAction("consegnato");
export const cancelOrder = makeAction("annullato");

export async function toggleOrderLinePrepared(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  const lineId = String(formData.get("lineId") ?? "");
  const prepared = String(formData.get("prepared") ?? "") === "true";
  if (!tenantSlug || !orderId || !lineId) return;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;

  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const location = await requireActiveGestioneLocation(tenantSlug);

  const { data: order } = await svc
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id)
    .maybeSingle();
  if (!order) return;

  const { error } = await svc
    .from("order_lines")
    .update({
      prepared,
      prepared_at: prepared ? new Date().toISOString() : null,
    })
    .eq("id", lineId)
    .eq("order_id", orderId);

  if (error) throw new Error(error.message);

  revalidatePath(`/gestione/${tenantSlug}/cucina`);
  revalidatePath(`/operativo/${tenantSlug}/cucina`);
}

/**
 * Conferma manuale di un ordine pending_confirmation: passa a "nuovo",
 * registra confirmed_at e invia email di conferma se disponibile.
 * Idempotente sugli ordini già "nuovo".
 */
export async function confirmPendingOrder(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;

  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const location = await requireActiveGestioneLocation(tenantSlug);

  const { data: existing } = await svc
    .from("orders")
    .select("status, confirmation_expires_at")
    .eq("id", id)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id)
    .maybeSingle();

  if (!existing) return;
  if (existing.status !== "pending_confirmation") {
    revalidatePath(`/gestione/${tenantSlug}/ordini`);
    return;
  }

  const expired =
    existing.confirmation_expires_at &&
    new Date(existing.confirmation_expires_at).getTime() < Date.now();

  if (expired) {
    await svc
      .from("orders")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantSlug)
      .eq("location_id", location.id);
    revalidatePath(`/gestione/${tenantSlug}/ordini`);
    return;
  }

  const { error } = await svc
    .from("orders")
    .update({
      status: "nuovo",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id)
    .eq("status", "pending_confirmation");

  if (error) throw new Error(error.message);

  // Email best-effort, non blocca l'action.
  await sendOrderConfirmationEmail(svc, id).catch(() => null);

  after(async () => {
    if (existing) {
      const { data: order } = await svc
        .from("orders")
        .select("id, code, public_token, customer_phone, source, type")
        .eq("id", id)
        .eq("tenant_id", tenantSlug)
        .eq("location_id", location.id)
        .maybeSingle();
      if (order) {
        await notifyCustomerOrderStatus({
          tenantId: tenantSlug,
          orderId: order.id,
          code: order.code,
          publicToken: order.public_token,
          customerPhone: order.customer_phone,
          kind: "confirmed",
          orderSource: order.source,
          orderType: order.type,
        }).catch(() => {});
      }
    }
  });

  revalidatePath(`/gestione/${tenantSlug}/ordini`);
}

/** Rifiuta un ordine pending_confirmation portandolo a "annullato". */
export async function rejectPendingOrder(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;

  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const location = await requireActiveGestioneLocation(tenantSlug);

  const { error } = await svc
    .from("orders")
    .update({ status: "annullato", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id)
    .eq("status", "pending_confirmation");

  if (error) throw new Error(error.message);

  after(async () => {
    await pushOrderStatusToHubrise({ orderId: id, newStatus: "annullato" });
    const { data: order } = await svc
      .from("orders")
      .select("id, code, public_token, customer_phone, source, type")
      .eq("id", id)
      .eq("tenant_id", tenantSlug)
      .eq("location_id", location.id)
      .maybeSingle();
    if (order) {
      await notifyCustomerOrderStatus({
        tenantId: tenantSlug,
        orderId: order.id,
        code: order.code,
        publicToken: order.public_token,
        customerPhone: order.customer_phone,
        kind: "cancelled",
        orderSource: order.source,
        orderType: order.type,
      }).catch(() => {});
    }
  });

  revalidatePath(`/gestione/${tenantSlug}/ordini`);
}
