import { findTenantById } from "@/lib/tenant-registry";
import { PLATFORM_BRANDS, sendEmail } from "@/lib/email/sender";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { dbLinesToOrderLines, dbRowToOrder, type DbOrder, type DbOrderLine } from "@/lib/api/orders";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Carica l'ordine completo e invia l'email di conferma se è presente
 * customer_email. Non blocca il chiamante in caso di errore: ritorna
 * un risultato strutturato.
 */
export async function sendOrderConfirmationEmail(
  supabase: SupabaseClient,
  orderId: string,
): Promise<{ ok: true; messageId?: string } | { ok: false; reason: string }> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_lines(*)")
    .eq("id", orderId)
    .single();
  if (error || !data) return { ok: false, reason: error?.message ?? "order not found" };

  const { order_lines: dbLines, ...orderRow } = data as DbOrder & {
    order_lines: DbOrderLine[];
  };
  const order = dbRowToOrder(
    orderRow,
    dbLinesToOrderLines((dbLines ?? []).sort((a, b) => a.position - b.position)),
  );

  const email = order.customerEmail;
  if (!email) return { ok: false, reason: "no customer email" };

  const tenantId = (orderRow as { tenant_id: string }).tenant_id;
  const tenant = findTenantById(tenantId);
  const brand = PLATFORM_BRANDS[tenant?.vertical ?? "food"];

  const html = buildOrderConfirmationEmail({
    brand,
    tenantName: tenant?.name ?? brand.name,
    orderCode: order.code,
    customerName: order.customerName,
    type: order.type,
    dineOption: order.dineOption,
    tableLabel: order.tableLabel,
    pickupTime: order.pickupTime,
    notes: order.notes,
    lines: order.lines.map((l) => ({
      qty: l.qty,
      name: l.name,
      variantLabel: l.variantLabel,
      lineTotal: l.lineTotal,
      note: l.note,
    })),
    total: order.total,
  });

  const result = await sendEmail({
    to: email,
    subject: `Ordine ${order.code} confermato · ${tenant?.name ?? brand.name}`,
    html,
    tenantId,
  });

  return result.ok
    ? { ok: true, messageId: result.messageId }
    : { ok: false, reason: result.error };
}
