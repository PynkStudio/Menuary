import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";

export const dynamic = "force-dynamic";

// GET /api/checkout/[code]/item-options?tenantId=...&t=...&itemId=...
// Returns available ingredients and extras for a menu item, used by the
// checkout line-edit overlay.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const sp = req.nextUrl.searchParams;
  const tenantId = sp.get("tenantId");
  const token = sp.get("t");
  const itemId = sp.get("itemId");

  if (!tenantId || !token || !itemId) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const order = await getPublicCheckoutOrder({ tenantId, code, token });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  // Fetch the menu item to get its extra_list_id
  const { data: item } = await db
    .from("menu_items")
    .select("id, extra_list_id")
    .eq("tenant_id", tenantId)
    .eq("id", itemId)
    .maybeSingle();

  if (!item) {
    return NextResponse.json({ ingredients: [], extras: [] });
  }

  // Fetch ingredients
  const { data: ingredients } = await db
    .from("menu_item_ingredients")
    .select("code, name, position")
    .eq("item_id", item.id)
    .order("position", { ascending: true });

  // Fetch extras from extra_list
  let extras: Array<{ id: string; code: string; name: string; price: number }> = [];
  if (item.extra_list_id) {
    const { data: extraItems } = await db
      .from("extra_list_items")
      .select("id, code, name, price, position")
      .eq("list_id", item.extra_list_id)
      .order("position", { ascending: true });
    extras = (extraItems ?? []).map((e) => ({
      id: e.id,
      code: e.code,
      name: e.name,
      price: Number(e.price),
    }));
  }

  return NextResponse.json({
    ingredients: (ingredients ?? []).map((i) => ({ code: i.code, name: i.name })),
    extras,
  });
}
