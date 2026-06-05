import type { CartLine, Order, OrderDineOption, OrderLine, OrderStatus } from "@/lib/types";
import type { Database, Json } from "@/lib/database.types";

type OrderLineInsert = Database["public"]["Tables"]["order_lines"]["Insert"];

/** Righe DB → OrderLine TypeScript */
export function dbLinesToOrderLines(rows: DbOrderLine[]): OrderLine[] {
  return rows.map((r) => ({
    itemId: r.item_id,
    categoryId: r.category_id ?? undefined,
    name: r.name,
    qty: r.qty,
    variantLabel: r.variant_label ?? undefined,
    unitPrice: Number(r.unit_price),
    lineTotal: Number(r.line_total),
    removedIngredients: (r.removed_ingredients as string[]) ?? undefined,
    addedExtras: (r.added_extras as Array<{ id: string; name: string; price: number }>) ?? undefined,
    note: r.note ?? undefined,
    bundlePicks: (r.bundle_picks as Order["lines"][number]["bundlePicks"]) ?? undefined,
  }));
}

/** Riga DB orders → Order TypeScript */
export function dbRowToOrder(row: DbOrder, lines: OrderLine[]): Order {
  return {
    id: row.id,
    code: row.code,
    createdAt: row.created_at,
    type: row.type as Order["type"],
    tableLabel: row.table_label ?? undefined,
    sessionId: row.session_id ?? undefined,
    sessionCode: row.session_code ?? undefined,
    dinerClientId: row.diner_client_id ?? undefined,
    dinerNickname: row.diner_nickname ?? undefined,
    customerName: row.customer_name ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    pickupTime: row.pickup_time ?? undefined,
    notes: row.notes ?? undefined,
    lines,
    total: Number(row.total),
    status: row.status as OrderStatus,
    dineOption: (row.dine_option as OrderDineOption | null) ?? undefined,
    confirmationExpiresAt: row.confirmation_expires_at ?? undefined,
    confirmedAt: row.confirmed_at ?? undefined,
    autoAccepted: row.auto_accepted ?? false,
  };
}

/** CartLine[] → array di righe da inserire in order_lines */
export function cartLinesToDbRows(
  orderId: string,
  cartLines: CartLine[],
): OrderLineInsert[] {
  return cartLines.map((l, i) => ({
    order_id: orderId,
    position: i,
    item_id: l.itemId,
    item_uuid: null,
    category_id: l.categoryId ?? null,
    name: l.name + (l.variantLabel ? ` (${l.variantLabel})` : ""),
    qty: l.qty,
    variant_key: l.variantKey ?? null,
    variant_label: l.variantLabel ?? null,
    unit_price: l.unitPrice,
    line_total: l.unitPrice * l.qty,
    removed_ingredients: l.removedIngredients ?? [],
    added_extras: l.addedExtras ?? [],
    bundle_picks: l.bundlePicks ?? [],
    note: l.note ?? null,
  }));
}

// ─── Tipi DB minimali (non richiedono supabase-generated types completi) ──────

export type DbOrder = {
  id: string;
  tenant_id: string;
  code: string;
  type: string;
  table_id: string | null;
  table_label: string | null;
  session_id: string | null;
  session_code: string | null;
  diner_client_id: string | null;
  diner_nickname: string | null;
  customer_name: string | null;
  customer_email: string | null;
  pickup_time: string | null;
  notes: string | null;
  total: number | string;
  status: string;
  created_at: string;
  updated_at: string;
  menuary_user_id: string | null;
  dine_option: string | null;
  confirmation_expires_at: string | null;
  confirmed_at: string | null;
  auto_accepted: boolean | null;
};

export type DbOrderLine = {
  id: string;
  order_id: string;
  position: number;
  item_id: string;
  item_uuid: string | null;
  category_id: string | null;
  name: string;
  qty: number;
  variant_key: string | null;
  variant_label: string | null;
  unit_price: number | string;
  line_total: number | string;
  removed_ingredients: Json;
  added_extras: Json;
  bundle_picks: Json;
  note: string | null;
};

export type DbTableSession = {
  id: string;
  tenant_id: string;
  table_id: string;
  code: string;
  status: "aperta" | "chiusa";
  opened_at: string;
  closed_at: string | null;
  declared_covers: number | null;
};

export type DbSessionDiner = {
  session_id: string;
  client_id: string;
  nickname: string;
  joined_at: string;
};
