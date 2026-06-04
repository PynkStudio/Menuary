import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  MenuCategory,
  MenuItem,
  PriceFormat,
  MenuTag,
  MenuAllergen,
  MenuServiceNoteKey,
  MenuBundleSlot,
  PiccanteLevel,
  MenuIngredient,
  MenuExtra,
} from "@/lib/menu-data";

export async function getMenuForTenant(tenantId: string): Promise<MenuCategory[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: categories }, { data: items }, { data: ingredients }, { data: itemExtras }, { data: lists }, { data: listItems }] =
    await Promise.all([
      supabase
        .from("menu_categories")
        .select("id,code,title,subtitle,description,position")
        .eq("tenant_id", tenantId)
        .order("position"),
      supabase
        .from("menu_items")
        .select(
          "id,code,category_id,name,description,price,tags,tag_meta,piccante_level,allergens,abv,image,service_notes,bundle_slots,extra_list_id,available,position",
        )
        .eq("tenant_id", tenantId)
        .eq("available", true)
        .order("position"),
      supabase.from("menu_item_ingredients").select("item_id,code,name,position").order("position"),
      supabase.from("menu_item_extras").select("item_id,code,name,price,position").order("position"),
      supabase.from("extra_lists").select("id,code").eq("tenant_id", tenantId),
      supabase.from("extra_list_items").select("list_id,code,name,price,position").order("position"),
    ]);

  if (!categories || !items) return [];

  const ingByItem = groupBy(ingredients ?? [], (r) => r.item_id);
  const extrasByItem = groupBy(itemExtras ?? [], (r) => r.item_id);
  const listById = new Map((lists ?? []).map((l) => [l.id, l.code]));
  const listItemsById = groupBy(listItems ?? [], (r) => r.list_id);

  return categories.map((c) => ({
    id: c.code,
    title: c.title,
    subtitle: c.subtitle ?? undefined,
    description: c.description ?? undefined,
    items: items
      .filter((it) => it.category_id === c.id)
      .map<MenuItem>((it) => {
        const inlineExtras = (extrasByItem.get(it.id) ?? []).map<MenuExtra>((e) => ({
          id: e.code,
          name: e.name,
          price: Number(e.price),
        }));
        const listCode = it.extra_list_id ? listById.get(it.extra_list_id) : undefined;
        return {
          id: it.code,
          name: it.name,
          description: it.description ?? undefined,
          price: it.price as PriceFormat,
          tags: (it.tags ?? []) as MenuTag[],
          tagMeta: (it.tag_meta ?? undefined) as MenuItem["tagMeta"],
          piccanteLevel: (it.piccante_level ?? undefined) as PiccanteLevel | undefined,
          allergens: (it.allergens ?? []) as MenuAllergen[],
          abv: it.abv ?? undefined,
          image: it.image ?? undefined,
          serviceNotes: (it.service_notes ?? []) as MenuServiceNoteKey[],
          bundleSlots: (it.bundle_slots as MenuBundleSlot[] | null) ?? undefined,
          ingredients: (ingByItem.get(it.id) ?? []).map<MenuIngredient>((r) => ({
            id: r.code,
            name: r.name,
          })),
          extraListId: listCode,
          extras: listCode ? undefined : inlineExtras,
        };
      }),
  }));

  function groupBy<T, K>(arr: T[], key: (t: T) => K): Map<K, T[]> {
    const m = new Map<K, T[]>();
    for (const x of arr) {
      const k = key(x);
      const cur = m.get(k);
      if (cur) cur.push(x);
      else m.set(k, [x]);
    }
    // also expose list_items for code mapping
    // (no-op marker)
    void listItemsById;
    return m;
  }
}
