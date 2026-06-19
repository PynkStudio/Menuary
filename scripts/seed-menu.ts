/**
 * Seed idempotente dei menu statici verso Supabase.
 *
 * Uso:
 *   npm run seed:menu                  # tutti i tenant con onlineMenu
 *   SEED_TENANT_ID=kimos npm run seed:menu
 */
import { createClient } from "@supabase/supabase-js";
import { getTenantDefaultExtraLists } from "../src/lib/extra-lists";
import { libritechCatalog } from "../src/lib/libritech-catalog";
import type { Database } from "../src/lib/database.types";
import { getSeedMenuForTenant } from "../src/lib/tenant-menu-data";
import { TENANTS } from "../src/lib/tenant-registry";
import type { AdminMenuCategory, AdminMenuItem, AdminMenuList, PriceFormat } from "../src/lib/types";

type SupabaseAdmin = ReturnType<typeof createClient<Database>>;

type SeedBundle = {
  categories: AdminMenuCategory[];
  items: AdminMenuItem[];
  menuLists: AdminMenuList[];
  extraLists: Array<{
    id: string;
    name: string;
    extras: Array<{ id: string; name: string; price: number }>;
  }>;
};

const requestedTenantId = process.env.SEED_TENANT_ID?.trim();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient<Database>(url, key, {
  auth: { persistSession: false },
});

function priceKind(p: PriceFormat): Database["public"]["Enums"]["price_kind"] {
  if (p.kind === "sized") return "sized";
  if (p.kind === "persone") return "persone";
  if (p.kind === "volume") return "volume";
  return "single";
}

function seedBundle(tenantId: string): SeedBundle {
  const libritechSeed = [{
    id: "libri",
    title: "Catalogo libri",
    subtitle: "Tech, startup e impresa",
    description: "Libri e guide selezionati per founder, team tech e crescita.",
    items: libritechCatalog.map((book) => ({
      id: book.id,
      name: book.name,
      description: book.description,
      price: { kind: "single", value: book.price } as PriceFormat,
      image: book.imageUrl,
    })),
  }];
  const seedCategories = tenantId === "libritech" ? libritechSeed : getSeedMenuForTenant(tenantId);
  const categories = seedCategories.map<AdminMenuCategory>((cat, order) => ({
    id: cat.id,
    title: cat.title,
    subtitle: cat.subtitle,
    description: cat.description,
    availability: "availability" in cat ? cat.availability : undefined,
    order,
  }));
  const items = seedCategories.flatMap<AdminMenuItem>((cat) =>
    cat.items.map((item, order) => ({
      ...item,
      categoryId: cat.id,
      order,
      available: true,
    })),
  );
  return {
    categories,
    items,
    menuLists: [{
      id: "menu-completo",
      name: tenantId === "libritech" ? "Catalogo completo" : "Menu completo",
      description: "Tutte le voci pubblicate.",
      order: 0,
      enabled: true,
      itemIds: items.map((item) => item.id),
      visibility: {},
    }],
    extraLists: getTenantDefaultExtraLists(tenantId).map((list) => ({
      ...list,
      extras: [...list.extras],
    })),
  };
}

async function resolveDefaultLocationId(tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("locations")
    .select("id")
    .eq("tenant_id", tenantId)
    .order("is_default", { ascending: false })
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

function scopeLocation<T extends {
  eq: (column: string, value: string) => T;
  is: (column: string, value: null) => T;
}>(query: T, locationId: string | null): T {
  return locationId ? query.eq("location_id", locationId) : query.is("location_id", null);
}

async function ensureTenantExists(tenantId: string) {
  const tenant = TENANTS.find((entry) => entry.id === tenantId);
  const { data, error } = await supabase.from("tenants").select("id").eq("id", tenantId).maybeSingle();
  if (error) throw error;
  if (data) return;
  const { error: insertError } = await supabase.from("tenants").insert({
    id: tenantId,
    name: tenant?.name ?? tenantId,
    label: tenant?.label ?? tenant?.name ?? tenantId,
  } as never);
  if (insertError) throw insertError;
}

async function seedTenant(tenantId: string) {
  await ensureTenantExists(tenantId);
  const locationId = await resolveDefaultLocationId(tenantId);
  const bundle = seedBundle(tenantId);
  const now = new Date().toISOString();

  if (locationId) await deleteExistingMenu(tenantId, null);
  await deleteExistingMenu(tenantId, locationId);

  const categoryRows = bundle.categories.map((cat) => ({
    tenant_id: tenantId,
    location_id: locationId,
    code: cat.id,
    title: cat.title,
    subtitle: cat.subtitle ?? null,
    description: cat.description ?? null,
    availability: (cat.availability ?? null) as never,
    position: cat.order,
    updated_at: now,
  }));
  if (categoryRows.length > 0) {
    const { error } = await supabase.from("menu_categories").insert(categoryRows);
    if (error) throw error;
  }

  const { data: dbCategories, error: categoriesError } = await scopeLocation(
    supabase.from("menu_categories").select("id,code").eq("tenant_id", tenantId),
    locationId,
  );
  if (categoriesError) throw categoriesError;
  const categoryIdByCode = new Map((dbCategories ?? []).map((cat) => [cat.code, cat.id]));

  const extraRows = bundle.extraLists.map((list) => ({
    tenant_id: tenantId,
    location_id: locationId,
    code: list.id,
    name: list.name,
    updated_at: now,
  }));
  if (extraRows.length > 0) {
    const { error } = await supabase.from("extra_lists").insert(extraRows);
    if (error) throw error;
  }

  const { data: dbExtraLists, error: extraListsError } = await scopeLocation(
    supabase.from("extra_lists").select("id,code").eq("tenant_id", tenantId),
    locationId,
  );
  if (extraListsError) throw extraListsError;
  const extraListIdByCode = new Map((dbExtraLists ?? []).map((list) => [list.code, list.id]));

  const itemRows = bundle.items.flatMap((item) => {
    const categoryId = categoryIdByCode.get(item.categoryId);
    if (!categoryId) return [];
    return [{
      tenant_id: tenantId,
      location_id: locationId,
      code: item.id,
      category_id: categoryId,
      name: item.name,
      description: item.description ?? null,
      price: item.price as Database["public"]["Tables"]["menu_items"]["Insert"]["price"],
      price_kind: priceKind(item.price),
      tags: item.tags ?? [],
      tag_meta: (item.tagMeta ?? {}) as Database["public"]["Tables"]["menu_items"]["Insert"]["tag_meta"],
      piccante_level: item.piccanteLevel ?? null,
      allergens: item.allergens ?? [],
      abv: item.abv ?? null,
      image: item.image ?? null,
      service_notes: item.serviceNotes ?? [],
      bundle_slots: (item.bundleSlots ?? null) as Database["public"]["Tables"]["menu_items"]["Insert"]["bundle_slots"],
      variant_groups: (item.variantGroups ?? []) as Database["public"]["Tables"]["menu_items"]["Insert"]["variant_groups"],
      extra_list_id: item.extraListId ? extraListIdByCode.get(item.extraListId) ?? null : null,
      available: item.available,
      position: item.order,
      updated_at: now,
    }];
  });
  if (itemRows.length > 0) {
    const { error } = await supabase.from("menu_items").insert(itemRows);
    if (error) throw error;
  }

  const { data: dbItems, error: itemsError } = await scopeLocation(
    supabase.from("menu_items").select("id,code").eq("tenant_id", tenantId),
    locationId,
  );
  if (itemsError) throw itemsError;
  const itemIdByCode = new Map((dbItems ?? []).map((item) => [item.code, item.id]));

  const itemIds = (dbItems ?? []).map((item) => item.id);
  if (itemIds.length > 0) {
    const [{ error: ingDeleteError }, { error: extraDeleteError }] = await Promise.all([
      supabase.from("menu_item_ingredients").delete().in("item_id", itemIds),
      supabase.from("menu_item_extras").delete().in("item_id", itemIds),
    ]);
    if (ingDeleteError) throw ingDeleteError;
    if (extraDeleteError) throw extraDeleteError;
  }

  const ingredients = bundle.items.flatMap((item) => {
    const itemId = itemIdByCode.get(item.id);
    return (item.ingredients ?? []).flatMap((ingredient, position) =>
      itemId ? [{ item_id: itemId, code: ingredient.id, name: ingredient.name, position }] : [],
    );
  });
  if (ingredients.length > 0) {
    const { error } = await supabase.from("menu_item_ingredients").insert(ingredients);
    if (error) throw error;
  }

  const itemExtras = bundle.items.flatMap((item) => {
    const itemId = itemIdByCode.get(item.id);
    if (!itemId || item.extraListId) return [];
    return (item.extras ?? []).map((extra, position) => ({
      item_id: itemId,
      code: extra.id,
      name: extra.name,
      price: extra.price,
      position,
    }));
  });
  if (itemExtras.length > 0) {
    const { error } = await supabase.from("menu_item_extras").insert(itemExtras);
    if (error) throw error;
  }

  const extraListIds = [...extraListIdByCode.values()];
  if (extraListIds.length > 0) {
    const { error } = await supabase.from("extra_list_items").delete().in("list_id", extraListIds);
    if (error) throw error;
  }
  const extraItems = bundle.extraLists.flatMap((list) => {
    const listId = extraListIdByCode.get(list.id);
    return list.extras.flatMap((extra, position) =>
      listId ? [{ list_id: listId, code: extra.id, name: extra.name, price: extra.price, position }] : [],
    );
  });
  if (extraItems.length > 0) {
    const { error } = await supabase.from("extra_list_items").insert(extraItems);
    if (error) throw error;
  }

  const menuListRows = bundle.menuLists.map((list) => ({
    tenant_id: tenantId,
    location_id: locationId,
    code: list.id,
    name: list.name,
    description: list.description ?? null,
    position: list.order,
    enabled: list.enabled,
    visibility: list.visibility as Database["public"]["Tables"]["menu_lists"]["Insert"]["visibility"],
    updated_at: now,
  }));
  if (menuListRows.length > 0) {
    const { error } = await supabase.from("menu_lists").insert(menuListRows);
    if (error) throw error;
  }
  const { data: dbMenuLists, error: menuListsError } = await scopeLocation(
    supabase.from("menu_lists").select("id,code").eq("tenant_id", tenantId),
    locationId,
  );
  if (menuListsError) throw menuListsError;
  const menuListIdByCode = new Map((dbMenuLists ?? []).map((list) => [list.code, list.id]));
  const menuListIds = [...menuListIdByCode.values()];
  if (menuListIds.length > 0) {
    const { error } = await supabase.from("menu_list_items").delete().in("list_id", menuListIds);
    if (error) throw error;
  }
  const menuListItems = bundle.menuLists.flatMap((list) => {
    const listId = menuListIdByCode.get(list.id);
    if (!listId) return [];
    return list.itemIds.flatMap((itemCode, position) => {
      const itemId = itemIdByCode.get(itemCode);
      return itemId ? [{ list_id: listId, item_id: itemId, position }] : [];
    });
  });
  if (menuListItems.length > 0) {
    const { error } = await supabase.from("menu_list_items").insert(menuListItems);
    if (error) throw error;
  }

  return {
    categories: bundle.categories.length,
    items: bundle.items.length,
    extraLists: bundle.extraLists.length,
    locationId,
  };
}

async function deleteExistingMenu(tenantId: string, locationId: string | null) {
  const { error: listDeleteError } = await scopeLocation(
    supabase.from("menu_lists").delete().eq("tenant_id", tenantId),
    locationId,
  );
  if (listDeleteError) throw listDeleteError;
  const { error: categoryDeleteError } = await scopeLocation(
    supabase.from("menu_categories").delete().eq("tenant_id", tenantId),
    locationId,
  );
  if (categoryDeleteError) throw categoryDeleteError;
  const { error: extraListDeleteError } = await scopeLocation(
    supabase.from("extra_lists").delete().eq("tenant_id", tenantId),
    locationId,
  );
  if (extraListDeleteError) throw extraListDeleteError;
}

function tenantIdsToSeed(): string[] {
  if (requestedTenantId && requestedTenantId !== "all") return [requestedTenantId];
  return TENANTS
    .filter((tenant) => tenant.enabled && tenant.features.onlineMenu)
    .map((tenant) => tenant.id);
}

async function main() {
  const tenantIds = tenantIdsToSeed();
  console.log(`Seeding ${tenantIds.length} tenant menu(s): ${tenantIds.join(", ")}`);
  for (const tenantId of tenantIds) {
    const result = await seedTenant(tenantId);
    console.log(
      `  ✓ ${tenantId}: ${result.categories} categorie, ${result.items} item, ${result.extraLists} liste extra` +
      (result.locationId ? ` (location ${result.locationId})` : " (senza location)"),
    );
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
