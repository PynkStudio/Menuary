import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { suggestUpsellsForOrder } from "@/lib/upselling-engine";
import { priceVariants } from "@/lib/price-utils";
import type { PriceFormat } from "@/lib/menu-data";
import type { MenuOrderChannel } from "@/lib/types";
import type { PublicCheckoutOrder } from "@/lib/orders/public-checkout";

type Db = SupabaseClient<Database>;

export type CheckoutUpsellSuggestion = {
  itemId: string;
  name: string;
  text: string;
  // Valorizzato solo per le voci a prezzo unico, aggiungibili all'ordine con un
  // tap: per gli articoli con varianti/taglie l'utente deve passare dal menu.
  unitPrice: number | null;
};

export async function loadCheckoutUpsellSuggestions(
  tenantId: string,
  order: PublicCheckoutOrder,
): Promise<CheckoutUpsellSuggestion[]> {
  const itemCodes = order.lines.map((line) => line.itemId).filter(Boolean);
  if (itemCodes.length === 0) return [];
  const db = createSupabaseServiceClient();
  if (!db) return [];

  const auth = await createSupabaseServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  try {
    const suggestions = await suggestUpsellsForOrder(db, {
      tenantId,
      itemCodes: [...new Set(itemCodes)],
      channel: checkoutOrderChannel(order),
      tableId: order.tableId,
      userId: user?.id ?? order.menuaryUserId,
    });
    const top = suggestions.slice(0, 3);
    if (top.length === 0) return [];

    const priceByCode = await loadAddablePrices(
      db,
      tenantId,
      top.map((s) => s.itemId),
    );
    return top.map((s) => ({
      itemId: s.itemId,
      name: s.name,
      text: s.text,
      unitPrice: priceByCode.get(s.itemId) ?? null,
    }));
  } catch {
    return [];
  }
}

// Prezzo unitario autorevole solo per le voci a prezzo unico ancora disponibili:
// è il valore che il client rispedisce alla append, così l'importo resta lato server.
async function loadAddablePrices(
  db: Db,
  tenantId: string,
  codes: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (codes.length === 0) return map;
  const { data } = await db
    .from("menu_items")
    .select("code,price,available")
    .eq("tenant_id", tenantId)
    .in("code", codes);
  for (const row of data ?? []) {
    if (!row.available) continue;
    const variants = priceVariants(row.price as PriceFormat);
    if (variants.length === 1 && Number.isFinite(variants[0].price) && variants[0].price > 0) {
      map.set(row.code, variants[0].price);
    }
  }
  return map;
}

function checkoutOrderChannel(order: PublicCheckoutOrder): MenuOrderChannel {
  if (order.source === "retell") return "phone";
  if (order.source === "whatsapp") return "whatsapp";
  if (order.type === "tavolo") return "table";
  return "online";
}
