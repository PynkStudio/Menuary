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
  type: string;
  tableId: string | null;
  menuaryUserId: string | null;
  lines: Array<{
    itemId: string;
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
      "id, tenant_id, code, status, type, table_id, total, dine_option, customer_name, customer_phone, pickup_time, notes, created_at, source, menuary_user_id, public_token, payment_status, payment_provider, order_lines(item_id, name, qty, unit_price, line_total, notes)",
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
    type: string;
    table_id: string | null;
    total: number | string;
    dine_option: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    pickup_time: string | null;
    notes: string | null;
    created_at: string;
    source: string | null;
    menuary_user_id: string | null;
    public_token: string;
    payment_status: string;
    payment_provider: string | null;
    order_lines: Array<{
      item_id: string;
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
    type: row.type,
    tableId: row.table_id,
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
    menuaryUserId: row.menuary_user_id,
    lines: (row.order_lines ?? []).map((l) => ({
      itemId: l.item_id,
      name: l.name,
      qty: Number(l.qty),
      unitPrice: Number(l.unit_price),
      total: Number(l.line_total),
      notes: l.notes,
    })),
  };
}

/** Risolve un ordine dal solo public_token (usato dallo short-link /c/[token]). */
export async function getOrderByPublicToken(token: string): Promise<{
  tenantId: string;
  code: string;
  token: string;
} | null> {
  if (!token || token.length < 16) return null;
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");
  const { data, error } = await db
    .from("orders")
    .select("tenant_id, code, public_token")
    .eq("public_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as unknown as { tenant_id: string; code: string; public_token: string };
  return { tenantId: row.tenant_id, code: row.code, token: row.public_token };
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
