import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/types";

export type PaymentLinkChannel = "retell" | "whatsapp" | "sms" | "manual";

export type CreateChannelPaymentRequestInput = {
  tenantId: string;
  orderId?: string | null;
  reservationId?: string | null;
  channel: PaymentLinkChannel;
  recipientPhone: string;
  amount: number;
  currency?: string;
  description: string;
  metadata?: Record<string, Json>;
};

export type ChannelPaymentRequest = {
  id: string;
  paymentUrl: string | null;
  providerSessionId: string | null;
  status: string;
  messageStatus: string;
};

function serviceDb() {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");
  return db;
}

async function createStripePaymentUrl(input: CreateChannelPaymentRequestInput) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://menuary.it";
  if (!secret) {
    return {
      providerSessionId: null,
      paymentUrl: `${baseUrl}/pagamenti?pending=1`,
    };
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${baseUrl}/pagamenti?status=success`);
  params.set("cancel_url", `${baseUrl}/pagamenti?status=cancel`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", (input.currency ?? "EUR").toLowerCase());
  params.set("line_items[0][price_data][unit_amount]", String(Math.round(input.amount * 100)));
  params.set("line_items[0][price_data][product_data][name]", input.description);
  params.set("metadata[tenant_id]", input.tenantId);
  if (input.orderId) params.set("metadata[order_id]", input.orderId);
  if (input.reservationId) params.set("metadata[reservation_id]", input.reservationId);
  params.set("customer_creation", "if_required");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const json = await res.json().catch(() => null) as { id?: string; url?: string; error?: { message?: string } } | null;
  if (!res.ok || !json?.url) {
    throw new Error(json?.error?.message ?? "stripe_session_failed");
  }
  return { providerSessionId: json.id ?? null, paymentUrl: json.url };
}

export async function createChannelPaymentRequest(
  input: CreateChannelPaymentRequestInput,
): Promise<ChannelPaymentRequest> {
  if (!input.recipientPhone.trim()) throw new Error("recipient_phone_required");
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("invalid_amount");

  const stripe = await createStripePaymentUrl(input);
  const db = serviceDb();
  const { data, error } = await (db as unknown as {
    from: (table: "channel_payment_requests") => {
      insert: (row: Record<string, unknown>) => {
        select: (columns: string) => {
          single: () => Promise<{
            data: {
              id: string;
              payment_url: string | null;
              provider_session_id: string | null;
              status: string;
              message_status: string;
            } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  })
    .from("channel_payment_requests")
    .insert({
      tenant_id: input.tenantId,
      order_id: input.orderId ?? null,
      reservation_id: input.reservationId ?? null,
      channel: input.channel,
      recipient_phone: input.recipientPhone.trim(),
      amount: input.amount,
      currency: input.currency ?? "EUR",
      provider: "stripe",
      provider_session_id: stripe.providerSessionId,
      payment_url: stripe.paymentUrl,
      status: "pending",
      // Messaging provider not wired yet: queued means SMS/WA sender can pick this up.
      message_status: "queued",
      metadata: {
        description: input.description,
        ...(input.metadata ?? {}),
      },
    })
    .select("id,payment_url,provider_session_id,status,message_status")
    .single();

  if (error || !data) throw new Error(error?.message ?? "payment_request_failed");

  if (input.orderId) {
    await (db as unknown as {
      from: (table: "orders") => {
        update: (row: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    })
      .from("orders")
      .update({ payment_status: "pending", payment_link_url: stripe.paymentUrl })
      .eq("id", input.orderId);
  }

  return {
    id: data.id,
    paymentUrl: data.payment_url,
    providerSessionId: data.provider_session_id,
    status: data.status,
    messageStatus: data.message_status,
  };
}
