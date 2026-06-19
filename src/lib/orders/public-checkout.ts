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
  updatedAt: string;
  paymentStatus: string;
  paymentProvider: string | null;
  total: number;
  currency: string;
  dineOption: string | null;
  confirmationExpiresAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  pickupTime: string | null;
  deliveryAddress: string | null;
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
    addedExtras: Array<{ name: string; price: number }>;
    removedIngredients: string[];
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
      "id, tenant_id, code, status, updated_at, type, table_id, total, dine_option, fulfillment_type, confirmation_expires_at, customer_name, customer_phone, pickup_time, delivery_address, notes, created_at, source, menuary_user_id, public_token, payment_status, payment_provider, order_lines(item_id, name, qty, unit_price, line_total, note, added_extras, removed_ingredients)",
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
    updated_at: string;
    type: string;
    table_id: string | null;
    total: number | string;
    dine_option: string | null;
    fulfillment_type: string | null;
    confirmation_expires_at: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    pickup_time: string | null;
    delivery_address: string | null;
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
      note: string | null;
      added_extras: unknown;
      removed_ingredients: unknown;
    }>;
  };

  if (!safeEqualString(row.public_token, input.token)) return null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    status: row.status,
    updatedAt: row.updated_at,
    type: row.type,
    tableId: row.table_id,
    paymentStatus: row.payment_status,
    paymentProvider: row.payment_provider,
    total: Number(row.total),
    currency: "EUR",
    dineOption: row.dine_option ?? row.fulfillment_type,
    confirmationExpiresAt: row.confirmation_expires_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    pickupTime: row.pickup_time,
    deliveryAddress: row.delivery_address,
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
      notes: l.note,
      addedExtras: parseAddedExtras(l.added_extras),
      removedIngredients: parseRemovedIngredients(l.removed_ingredients),
    })),
  };
}

function parseAddedExtras(value: unknown): Array<{ name: string; price: number }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as Record<string, unknown>;
      const name = typeof e.name === "string" ? e.name : null;
      if (!name) return null;
      return { name, price: Number(e.price) || 0 };
    })
    .filter((x): x is { name: string; price: number } => x !== null);
}

function parseRemovedIngredients(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
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
