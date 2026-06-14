import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { bunqRequest, accountPath } from "./client";
import { activateSubscription } from "@/lib/platform/subscription-service";

/** Pagamento riconciliato → se collegato a un abbonamento, attiva tenant + dominio. */
async function activateIfSubscription(subscriptionId: string | null | undefined) {
  if (!subscriptionId) return;
  try {
    await activateSubscription(subscriptionId);
  } catch (err) {
    console.error("[bunq-reconciliation] activateSubscription failed", err);
  }
}

type BunqPayment = {
  Payment: {
    id: number;
    amount: { value: string; currency: string };
    description: string;
    created: string;
    type: string;
    counterparty_alias: {
      iban: string | null;
      display_name: string;
    };
  };
};

type BunqNotificationPayload = {
  NotificationUrl: {
    event_type: string;
    object: {
      Payment?: { id: number };
      RequestResponse?: { id: number };
    };
  };
};

export async function handleBunqCallback(
  payload: BunqNotificationPayload,
): Promise<{ matched: boolean; paymentId?: string }> {
  const event = payload.NotificationUrl;

  if (event.event_type === "REQUEST_RESPONSE_CREATED" || event.event_type === "REQUEST_RESPONSE_ACCEPTED") {
    const requestId = event.object.RequestResponse?.id;
    if (!requestId) return { matched: false };
    return reconcileByRequestId(requestId);
  }

  if (event.event_type === "PAYMENT_CREATED" || event.event_type === "PAYMENT_RECEIVED") {
    const paymentBunqId = event.object.Payment?.id;
    if (!paymentBunqId) return { matched: false };
    return reconcileByPaymentId(paymentBunqId);
  }

  return { matched: false };
}

function getDb() {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");
  return db;
}

async function reconcileByRequestId(
  requestId: number,
): Promise<{ matched: boolean; paymentId?: string }> {
  const db = getDb();

  // bunq_request_id column added by migration 20260622
  const { data: payment } = await db
    .from("platform_payments")
    .select("id, status, subscription_id")
    .eq("bunq_request_id", requestId)
    .eq("status", "pending")
    .maybeSingle();

  if (!payment) return { matched: false };

  await db
    .from("platform_payments")
    .update({
      status: "paid",
      payment_date: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", payment.id);

  await activateIfSubscription((payment as { subscription_id?: string }).subscription_id);

  return { matched: true, paymentId: payment.id };
}

async function reconcileByPaymentId(
  bunqPaymentId: number,
): Promise<{ matched: boolean; paymentId?: string }> {
  const payments = await bunqRequest<BunqPayment[]>(
    `${accountPath()}/payment/${bunqPaymentId}`,
  );

  const p = payments[0]?.Payment;
  if (!p) return { matched: false };

  const reference = extractReference(p.description);
  if (!reference) return { matched: false };

  const db = getDb();

  const { data: platformPayment } = await db
    .from("platform_payments")
    .select("id, status, subscription_id")
    .eq("invoice_number", reference)
    .eq("status", "pending")
    .maybeSingle();

  if (!platformPayment) return { matched: false };

  await db
    .from("platform_payments")
    .update({
      status: "paid",
      payment_date: p.created,
      paid_at: new Date().toISOString(),
      notes: `Riconciliato automaticamente da bonifico Bunq #${bunqPaymentId} — ${p.counterparty_alias.display_name}`,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", platformPayment.id);

  await activateIfSubscription((platformPayment as { subscription_id?: string }).subscription_id);

  return { matched: true, paymentId: platformPayment.id };
}

const REFERENCE_PATTERN = /\b(MEN|BIZ|ORP)-\d{4}-\d{3,6}\b/i;

function extractReference(description: string): string | null {
  const match = description.match(REFERENCE_PATTERN);
  return match ? match[0].toUpperCase() : null;
}
