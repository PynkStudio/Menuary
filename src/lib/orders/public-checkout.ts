import "server-only";

import { timingSafeEqual } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// Lettura pubblica di un ordine via codice + token. Usata dalla pagina
// /checkout/[code] linkata in SMS/WhatsApp/Retell.

export type PublicCheckoutOrder = {
  id: string;
  tenantId: string;
  code: string;
  status: string;
  paymentStatus: string;
  paymentProvider: string | null;
  total: number;
  currency: string;
  dineOption: string | null;
  customerName: string | null;
  customerPhone: string | null;
  pickupTime: string | null;
  notes: string | null;
  createdAt: string;
  source: string | null;
  lines: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
    notes: string | null;
  }>;
};

function safeEqualString(a: string, b: string): boolean {
  const aa = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export async function getPublicCheckoutOrder(input: {
  tenantId: string;
  code: string;
  token: string;
}): Promise<PublicCheckoutOrder | null> {
  if (!input.token || input.token.length < 16) return null;
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");

  const { data, error } = await db
    .from("orders")
    .select(
      "id, tenant_id, code, status, total, dine_option, customer_name, customer_phone, pickup_time, notes, created_at, source, public_token, payment_status, payment_provider, order_lines(name, qty, unit_price, line_total, notes)",
    )
    .eq("tenant_id", input.tenantId)
    .eq("code", input.code)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    tenant_id: string;
    code: string;
    status: string;
    total: number | string;
    dine_option: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    pickup_time: string | null;
    notes: string | null;
    created_at: string;
    source: string | null;
    public_token: string;
    payment_status: string;
    payment_provider: string | null;
    order_lines: Array<{
      name: string;
      qty: number;
      unit_price: number | string;
      line_total: number | string;
      notes: string | null;
    }>;
  };

  if (!safeEqualString(row.public_token, input.token)) return null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentProvider: row.payment_provider,
    total: Number(row.total),
    currency: "EUR",
    dineOption: row.dine_option,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    pickupTime: row.pickup_time,
    notes: row.notes,
    createdAt: row.created_at,
    source: row.source,
    lines: (row.order_lines ?? []).map((l) => ({
      name: l.name,
      qty: Number(l.qty),
      unitPrice: Number(l.unit_price),
      total: Number(l.line_total),
      notes: l.notes,
    })),
  };
}

export async function getOrderPublicTokenById(orderId: string): Promise<{
  tenantId: string;
  code: string;
  token: string;
} | null> {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");
  const { data, error } = await db
    .from("orders")
    .select("tenant_id, code, public_token")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as unknown as {
    tenant_id: string;
    code: string;
    public_token: string;
  };
  return { tenantId: row.tenant_id, code: row.code, token: row.public_token };
}
