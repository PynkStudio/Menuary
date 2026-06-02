/**
 * Seed del menu da src/lib/menu-data.ts → Supabase.
 *
 * Uso:
 *   1) aggiungi in .env.local:  SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
 *      (Dashboard → Project Settings → API → service_role)
 *   2) npm run seed:menu
 *
 * Idempotente: cancella e reinserisce categorie/items per il tenant.
 */
import { createClient } from "@supabase/supabase-js";
import { getSeedMenuForTenant } from "../src/lib/tenant-menu-data";
import type { Database } from "../src/lib/supabase/types";

const TENANT_ID = process.env.SEED_TENANT_ID ?? "bepork";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient<Database>(url, key, {
  auth: { persistSession: false },
});

function priceKind(p: { kind: string }): "single" | "sized" | "persone" | "volume" {
  return p.kind as "single" | "sized" | "persone" | "volume";
}

async function main() {
  console.log(`Seeding tenant=${TENANT_ID}…`);
  const menu = getSeedMenuForTenant(TENANT_ID);

  // Pulizia (cascade da categorie/extra_lists)
  await supabase.from("menu_categories").delete().eq("tenant_id", TENANT_ID);

  // Risolvi le extra_lists pre-seedate per code → uuid
  const { data: lists } = await supabase
    .from("extra_lists")
    .select("id,code")
    .eq("tenant_id", TENANT_ID);
  const listIdByCode = new Map((lists ?? []).map((l) => [l.code, l.id]));

  let categoryPosition = 0;
  for (const cat of menu) {
    const { data: catRow, error: catErr } = await supabase
      .from("menu_categories")
      .insert({
        tenant_id: TENANT_ID,
        code: cat.id,
        title: cat.title,
        subtitle: cat.subtitle ?? null,
        description: cat.description ?? null,
        position: categoryPosition++,
      })
      .select("id")
      .single();
    if (catErr || !catRow) throw catErr ?? new Error("category insert failed");

    let itemPosition = 0;
    for (const item of cat.items) {
      const { data: itemRow, error: itemErr } = await supabase
        .from("menu_items")
        .insert({
          tenant_id: TENANT_ID,
          category_id: catRow.id,
          code: item.id,
          name: item.name,
          description: item.description ?? null,
          price_kind: priceKind(item.price),
          price: item.price as never,
          tags: item.tags ?? [],
          piccante_level: item.piccanteLevel ?? null,
          allergens: item.allergens ?? [],
          abv: item.abv ?? null,
          image: item.image ?? null,
          service_notes: item.serviceNotes ?? [],
          bundle_slots: (item.bundleSlots ?? null) as never,
          extra_list_id: item.extraListId
            ? listIdByCode.get(item.extraListId) ?? null
            : null,
          available: true,
          position: itemPosition++,
        })
        .select("id")
        .single();
      if (itemErr || !itemRow) throw itemErr ?? new Error("item insert failed");

      if (item.ingredients?.length) {
        const { error } = await supabase.from("menu_item_ingredients").insert(
          item.ingredients.map((ing, i) => ({
            item_id: itemRow.id,
            code: ing.id,
            name: ing.name,
            position: i,
          })),
        );
        if (error) throw error;
      }

      if (!item.extraListId && item.extras?.length) {
        const { error } = await supabase.from("menu_item_extras").insert(
          item.extras.map((e, i) => ({
            item_id: itemRow.id,
            code: e.id,
            name: e.name,
            price: e.price,
            position: i,
          })),
        );
        if (error) throw error;
      }
    }
    console.log(`  ✓ ${cat.title} (${cat.items.length} items)`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
