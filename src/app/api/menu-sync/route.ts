import { after, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSeedMenuForTenant } from "@/lib/tenant-menu-data";
import { libritechCatalog } from "@/lib/libritech-catalog";
import { getTenantDefaultExtraLists } from "@/lib/extra-lists";
import { pushMenuToHubrise } from "@/lib/hubrise/push-menu";
import { ensureTenantUpsellIndexes } from "@/lib/upselling-engine";
import { getTenantLocaleConfig, matchTenantLocale } from "@/lib/tenant-locales";
import type { MenuSyncBundle } from "@/lib/menu-sync-types";
import type { AdminMenuCategory, AdminMenuItem, AdminMenuList, MenuDay, MenuOrderChannel, PriceFormat } from "@/lib/types";
import type { Database } from "@/lib/database.types";
import { authorizeGestione } from "@/lib/gestione-auth";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;
type MenuListRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  position: number;
  enabled: boolean;
  visibility: unknown;
};
type MenuListItemRow = { list_id: string; item_id: string; position: number };

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId")?.trim();
  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const locationId = await resolveMenuLocationId(supabase, tenantId, url.searchParams.get("locationId"));
  const locale = resolveMenuLocale(tenantId, url.searchParams.get("locale") ?? url.searchParams.get("language"));

  await ensureSeeded(supabase, tenantId, locationId);
  const bundle = await readBundle(supabase, tenantId, locationId, locale);
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId")?.trim();
  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseAdminClient();
  const locationId = auth.isDemo
    ? await resolveMenuLocationId(supabase, tenantId, url.searchParams.get("locationId"))
    : (await requireActiveGestioneLocation(tenantId)).id;
  if (!auth.isDemo && url.searchParams.get("locationId") && url.searchParams.get("locationId") !== locationId) {
    return NextResponse.json({ error: "location_mismatch" }, { status: 403 });
  }

  const bundle = (await req.json()) as MenuSyncBundle;
  await writeBundle(supabase, tenantId, locationId, bundle);

  // Push asincrono verso HubRise (no-op se feature off o nessuna location collegata).
  after(async () => {
    try {
      await pushMenuToHubrise({ tenantId, bundle });
    } catch {
      // gli errori per-location sono già loggati in hubrise_menu_sync_log
    }
    try {
      await ensureTenantUpsellIndexes(supabase, tenantId);
    } catch (error) {
      console.error("[menu-sync] upsell index generation failed", error instanceof Error ? error.message : String(error));
    }
  });

  return NextResponse.json({ ok: true });
}

async function readBundle(supabase: SupabaseAdmin, tenantId: string, locationId: string | null, locale?: string | null): Promise<MenuSyncBundle> {
  const [
    { data: categories, error: catErr },
    { data: items, error: itemErr },
    { data: ingredients, error: ingErr },
    { data: itemExtras, error: itemExtraErr },
    { data: extraLists, error: extraErr },
    { data: extraListItems, error: extraItemErr },
    menuListsResult,
    menuListItemsResult,
  ] = await Promise.all([
    scopeLocation(supabase
      .from("menu_categories")
      .select("id,code,title,subtitle,description,position,availability")
      .eq("tenant_id", tenantId), locationId)
      .order("position"),
    scopeLocation(supabase
      .from("menu_items")
      .select(
        "id,code,category_id,name,description,price,tags,tag_meta,piccante_level,allergens,abv,image,service_notes,bundle_slots,extra_list_id,available,position",
      )
      .eq("tenant_id", tenantId), locationId)
      .order("position"),
    supabase.from("menu_item_ingredients").select("item_id,code,name,position").order("position"),
    supabase.from("menu_item_extras").select("item_id,code,name,price,position").order("position"),
    scopeLocation(supabase.from("extra_lists").select("id,code,name").eq("tenant_id", tenantId), locationId).order("name"),
    supabase.from("extra_list_items").select("list_id,code,name,price,position").order("position"),
    scopeLocation(supabase
      .from("menu_lists")
      .select("id,code,name,description,position,enabled,visibility")
      .eq("tenant_id", tenantId), locationId)
      .order("position"),
    supabase
      .from("menu_list_items" as never)
      .select("list_id,item_id,position")
      .order("position"),
  ]);

  const menuListsMissing =
    isMissingMenuListsError(menuListsResult.error) ||
    isMissingMenuListsError(menuListItemsResult.error);
  const firstError =
    catErr ??
    itemErr ??
    ingErr ??
    itemExtraErr ??
    extraErr ??
    extraItemErr ??
    (menuListsMissing ? null : menuListsResult.error) ??
    (menuListsMissing ? null : menuListItemsResult.error);
  if (firstError) throw firstError;

  const categoriesByDbId = new Map((categories ?? []).map((c) => [c.id, c.code]));
  const itemsByDbId = new Map((items ?? []).map((item) => [item.id, item.code]));
  const extraListsByDbId = new Map((extraLists ?? []).map((list) => [list.id, list.code]));
  const { categoryTranslations, itemTranslations } = await readMenuTranslations(supabase, tenantId, locale);
  const ingByItem = groupBy(ingredients ?? [], (row) => row.item_id);
  const extrasByItem = groupBy(itemExtras ?? [], (row) => row.item_id);
  const extraItemsByList = groupBy(extraListItems ?? [], (row) => row.list_id);
  const listItemsByList = groupBy(
    (menuListsMissing ? [] : (menuListItemsResult.data ?? [])) as unknown as MenuListItemRow[],
    (row) => row.list_id,
  );
  const menuListRows = (menuListsMissing ? [] : (menuListsResult.data ?? [])) as unknown as MenuListRow[];
  const fallbackMenuList = localizedMenuListFallback(tenantId, locale);

  return {
    categories: (categories ?? []).map<AdminMenuCategory>((cat) => ({
      id: cat.code,
      title: categoryTranslations.get(cat.id)?.title || cat.title,
      subtitle: categoryTranslations.get(cat.id)?.subtitle || (cat.subtitle ?? undefined),
      description: categoryTranslations.get(cat.id)?.description || (cat.description ?? undefined),
      availability: (cat.availability ?? undefined) as AdminMenuCategory["availability"],
      order: cat.position,
    })),
    items: (items ?? []).map<AdminMenuItem>((item) => {
      const translatedItem = itemTranslations.get(item.id);
      const translatedIngredients = normalizeTranslatedIngredients(item.code, translatedItem?.ingredients);
      return {
        id: item.code,
        categoryId: categoriesByDbId.get(item.category_id) ?? item.category_id,
        name: translatedItem?.name || item.name,
        description: translatedItem?.description || (item.description ?? undefined),
        price: item.price as PriceFormat,
        tags: item.tags as AdminMenuItem["tags"],
        tagMeta: item.tag_meta as AdminMenuItem["tagMeta"],
        piccanteLevel: item.piccante_level as AdminMenuItem["piccanteLevel"],
        allergens: item.allergens as AdminMenuItem["allergens"],
        abv: item.abv ?? undefined,
        image: item.image ?? undefined,
        serviceNotes: item.service_notes as AdminMenuItem["serviceNotes"],
        bundleSlots: item.bundle_slots as AdminMenuItem["bundleSlots"],
        extraListId: item.extra_list_id ? extraListsByDbId.get(item.extra_list_id) : undefined,
        ingredients: translatedIngredients ?? (ingByItem.get(item.id) ?? []).map((row) => ({ id: row.code, name: row.name })),
        extras: (extrasByItem.get(item.id) ?? []).map((row) => ({ id: row.code, name: row.name, price: Number(row.price) })),
        order: item.position,
        available: item.available,
      };
    }),
    menuLists:
      menuListRows.length > 0
        ? menuListRows.map<AdminMenuList>((list) => ({
            id: list.code,
            name: list.name,
            description: list.description ?? undefined,
            order: list.position,
            enabled: list.enabled,
            visibility: normalizeMenuListVisibility(list.visibility),
            itemIds: (listItemsByList.get(list.id) ?? [])
              .map((row) => itemsByDbId.get(row.item_id))
              .filter((id): id is string => Boolean(id)),
          }))
        : [{
            id: "menu-completo",
            name: fallbackMenuList.name,
            description: fallbackMenuList.description,
            order: 0,
            enabled: true,
            visibility: {},
            itemIds: (items ?? []).map((item) => item.code),
          }],
    extraLists: (extraLists ?? []).map((list) => ({
      id: list.code,
      name: list.name,
      extras: (extraItemsByList.get(list.id) ?? []).map((item) => ({
        id: item.code,
        name: item.name,
        price: Number(item.price),
      })),
    })),
  };
}

function resolveMenuLocale(tenantId: string, requestedLocale: string | null) {
  const config = getTenantLocaleConfig(tenantId);
  if (!config) return null;
  const locale = matchTenantLocale(requestedLocale, config.locales);
  if (!locale || locale === config.defaultLocale) return null;
  return locale;
}

async function resolveMenuLocationId(
  supabase: SupabaseAdmin,
  tenantId: string,
  requestedLocationId: string | null,
): Promise<string | null> {
  let query = supabase
    .from("locations")
    .select("id")
    .eq("tenant_id", tenantId);
  if (requestedLocationId) query = query.eq("id", requestedLocationId);
  else query = query.order("is_default", { ascending: false }).order("created_at").limit(1);
  const { data } = await query.maybeSingle();
  if (requestedLocationId && !data) throw new Error("menu_location_not_found");
  return data?.id ?? null;
}

function scopeLocation<T extends {
  eq: (column: string, value: string) => T;
  is: (column: string, value: null) => T;
}>(query: T, locationId: string | null): T {
  return locationId
    ? query.eq("location_id", locationId)
    : query.is("location_id", null);
}

function localizedMenuListFallback(tenantId: string, locale?: string | null) {
  const isCatalog = tenantId === "libritech";
  switch (locale) {
    case "pt":
      return {
        name: isCatalog ? "Catálogo completo" : "Menu completo",
        description: "Todos os itens publicados.",
      };
    case "en":
      return {
        name: isCatalog ? "Full catalog" : "Full menu",
        description: "All published items.",
      };
    case "fr":
      return {
        name: isCatalog ? "Catalogue complet" : "Menu complet",
        description: "Tous les éléments publiés.",
      };
    case "es":
      return {
        name: isCatalog ? "Catálogo completo" : "Menú completo",
        description: "Todas las entradas publicadas.",
      };
    case "de":
      return {
        name: isCatalog ? "Vollständiger Katalog" : "Vollständiges Menü",
        description: "Alle veröffentlichten Einträge.",
      };
    default:
      return {
        name: isCatalog ? "Catalogo completo" : "Menu completo",
        description: "Tutte le voci pubblicate.",
      };
  }
}

async function readMenuTranslations(
  supabase: SupabaseAdmin,
  tenantId: string,
  locale?: string | null,
) {
  const categoryTranslations = new Map<string, { title?: string; subtitle?: string; description?: string }>();
  const itemTranslations = new Map<string, { name?: string; description?: string; ingredients?: unknown }>();
  if (!locale) return { categoryTranslations, itemTranslations };

  const [categoryResult, itemResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("menu_category_translations")
      .select("menu_category_id,title,subtitle,description")
      .eq("tenant_id", tenantId)
      .eq("locale", locale),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("menu_item_translations")
      .select("menu_item_id,name,description,ingredients")
      .eq("tenant_id", tenantId)
      .eq("locale", locale),
  ]);

  if (!categoryResult.error) {
    for (const row of categoryResult.data ?? []) {
      categoryTranslations.set(row.menu_category_id, {
        title: row.title ?? undefined,
        subtitle: row.subtitle ?? undefined,
        description: row.description ?? undefined,
      });
    }
  }

  if (!itemResult.error) {
    for (const row of itemResult.data ?? []) {
      itemTranslations.set(row.menu_item_id, {
        name: row.name ?? undefined,
        description: row.description ?? undefined,
        ingredients: row.ingredients,
      });
    }
  }

  return { categoryTranslations, itemTranslations };
}

function normalizeTranslatedIngredients(itemCode: string, value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value
    .map((ingredient, index) => {
      if (typeof ingredient === "string") {
        const name = ingredient.trim();
        return name ? { id: `${itemCode}-tr-${index}`, name } : null;
      }
      if (ingredient && typeof ingredient === "object" && "name" in ingredient) {
        const name = String((ingredient as { name?: unknown }).name ?? "").trim();
        return name ? { id: `${itemCode}-tr-${index}`, name } : null;
      }
      return null;
    })
    .filter((ingredient): ingredient is { id: string; name: string } => Boolean(ingredient));
}

async function writeBundle(supabase: SupabaseAdmin, tenantId: string, locationId: string | null, bundle: MenuSyncBundle) {
  await ensureTenantExists(supabase, tenantId);

  const categoryRows = bundle.categories.map((cat) => ({
    tenant_id: tenantId,
    location_id: locationId,
    code: cat.id,
    title: cat.title,
    subtitle: cat.subtitle ?? null,
    description: cat.description ?? null,
    availability: (cat.availability ?? null) as never,
    position: cat.order,
    updated_at: new Date().toISOString(),
  }));
  if (categoryRows.length > 0) {
    const { error } = await supabase.from("menu_categories").upsert(categoryRows, { onConflict: "tenant_id,location_id,code" });
    if (error) throw error;
  }

  const { data: dbCategories } = await scopeLocation(
    supabase.from("menu_categories").select("id,code").eq("tenant_id", tenantId),
    locationId,
  );
  const catIdByCode = new Map((dbCategories ?? []).map((cat) => [cat.code, cat.id]));

  const extraRows = bundle.extraLists.map((list) => ({
    tenant_id: tenantId,
    location_id: locationId,
    code: list.id,
    name: list.name,
    updated_at: new Date().toISOString(),
  }));
  if (extraRows.length > 0) {
    const { error } = await supabase.from("extra_lists").upsert(extraRows, { onConflict: "tenant_id,location_id,code" });
    if (error) throw error;
  }
  const { data: dbExtraLists } = await scopeLocation(
    supabase.from("extra_lists").select("id,code").eq("tenant_id", tenantId),
    locationId,
  );
  const extraIdByCode = new Map((dbExtraLists ?? []).map((list) => [list.code, list.id]));

  const itemRows = bundle.items.flatMap((item) => {
    const categoryId = catIdByCode.get(item.categoryId);
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
      extra_list_id: item.extraListId ? extraIdByCode.get(item.extraListId) ?? null : null,
      available: item.available,
      position: item.order,
      updated_at: new Date().toISOString(),
    }];
  });
  if (itemRows.length > 0) {
    const { error } = await supabase.from("menu_items").upsert(itemRows, { onConflict: "tenant_id,location_id,code" });
    if (error) throw error;
  }

  const { data: dbItems } = await scopeLocation(
    supabase.from("menu_items").select("id,code").eq("tenant_id", tenantId),
    locationId,
  );
  const itemIdByCode = new Map((dbItems ?? []).map((item) => [item.code, item.id]));

  await replaceChildRows(supabase, tenantId, locationId, bundle, itemIdByCode, extraIdByCode);
  await replaceMenuLists(supabase, tenantId, locationId, bundle, itemIdByCode);
  await deleteMissing(supabase, tenantId, locationId, bundle);
}

async function replaceChildRows(
  supabase: SupabaseAdmin,
  tenantId: string,
  locationId: string | null,
  bundle: MenuSyncBundle,
  itemIdByCode: Map<string, string>,
  extraIdByCode: Map<string, string>,
) {
  const { data: dbItems } = await scopeLocation(
    supabase.from("menu_items").select("id").eq("tenant_id", tenantId),
    locationId,
  );
  const itemDbIds = (dbItems ?? []).map((item) => item.id);
  if (itemDbIds.length > 0) {
    await supabase.from("menu_item_ingredients").delete().in("item_id", itemDbIds);
    await supabase.from("menu_item_extras").delete().in("item_id", itemDbIds);
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

  const extraDbIds = [...extraIdByCode.values()];
  if (extraDbIds.length > 0) {
    await supabase.from("extra_list_items").delete().in("list_id", extraDbIds);
  }
  const extraItems = bundle.extraLists.flatMap((list) => {
    const listId = extraIdByCode.get(list.id);
    return list.extras.flatMap((extra, position) =>
      listId ? [{ list_id: listId, code: extra.id, name: extra.name, price: extra.price, position }] : [],
    );
  });
  if (extraItems.length > 0) {
    const { error } = await supabase.from("extra_list_items").insert(extraItems);
    if (error) throw error;
  }
}

async function replaceMenuLists(
  supabase: SupabaseAdmin,
  tenantId: string,
  locationId: string | null,
  bundle: MenuSyncBundle,
  itemIdByCode: Map<string, string>,
) {
  const listRows = bundle.menuLists.map((list) => ({
    tenant_id: tenantId,
    location_id: locationId,
    code: list.id,
    name: list.name,
    description: list.description ?? null,
    position: list.order,
    enabled: list.enabled,
    visibility: normalizeMenuListVisibility(list.visibility),
    updated_at: new Date().toISOString(),
  }));
  if (listRows.length > 0) {
    const { error } = await supabase.from("menu_lists").upsert(listRows, { onConflict: "tenant_id,location_id,code" });
    if (isMissingMenuListsError(error)) return;
    if (error) throw error;
  }

  const { data: dbLists } = await scopeLocation(
    supabase.from("menu_lists").select("id,code").eq("tenant_id", tenantId),
    locationId,
  );
  const listIdByCode = new Map(((dbLists ?? []) as unknown as Array<{ id: string; code: string }>).map((list) => [list.code, list.id]));
  const dbListIds = [...listIdByCode.values()];
  if (dbListIds.length > 0) {
    await supabase.from("menu_list_items" as never).delete().in("list_id", dbListIds);
  }

  const rows = bundle.menuLists.flatMap((list) => {
    const listId = listIdByCode.get(list.id);
    if (!listId) return [];
    return list.itemIds.flatMap((itemCode, position) => {
      const itemId = itemIdByCode.get(itemCode);
      return itemId ? [{ list_id: listId, item_id: itemId, position }] : [];
    });
  });
  if (rows.length > 0) {
    const { error } = await supabase.from("menu_list_items" as never).insert(rows as never);
    if (isMissingMenuListsError(error)) return;
    if (error) throw error;
  }
}

async function deleteMissing(supabase: SupabaseAdmin, tenantId: string, locationId: string | null, bundle: MenuSyncBundle) {
  const keepItems = bundle.items.map((item) => item.id);
  const keepCategories = bundle.categories.map((cat) => cat.id);
  const keepExtraLists = bundle.extraLists.map((list) => list.id);
  const keepMenuLists = bundle.menuLists.map((list) => list.id);

  if (keepItems.length > 0) await scopeLocation(supabase.from("menu_items").delete().eq("tenant_id", tenantId), locationId).not("code", "in", `(${keepItems.map(sqlQuote).join(",")})`);
  if (keepCategories.length > 0) await scopeLocation(supabase.from("menu_categories").delete().eq("tenant_id", tenantId), locationId).not("code", "in", `(${keepCategories.map(sqlQuote).join(",")})`);
  if (keepExtraLists.length > 0) await scopeLocation(supabase.from("extra_lists").delete().eq("tenant_id", tenantId), locationId).not("code", "in", `(${keepExtraLists.map(sqlQuote).join(",")})`);
  else await scopeLocation(supabase.from("extra_lists").delete().eq("tenant_id", tenantId), locationId);
  if (keepMenuLists.length > 0) await scopeLocation(supabase.from("menu_lists").delete().eq("tenant_id", tenantId), locationId).not("code", "in", `(${keepMenuLists.map(sqlQuote).join(",")})`);
}

async function ensureSeeded(supabase: SupabaseAdmin, tenantId: string, locationId: string | null) {
  const { count } = await scopeLocation(supabase
    .from("menu_categories")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId), locationId);
  if ((count ?? 0) === 0) {
    await writeBundle(supabase, tenantId, locationId, seedBundle(tenantId));
    return;
  }

  if (tenantId === "junior-food") {
    const { data } = await scopeLocation(supabase
      .from("menu_items")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("code", "jf-chicharron-de-cerdo"), locationId)
      .maybeSingle();
    if (!data) await writeBundle(supabase, tenantId, locationId, seedBundle(tenantId));
  }
}

async function ensureTenantExists(supabase: SupabaseAdmin, tenantId: string) {
  const { data } = await supabase.from("tenants").select("id").eq("id", tenantId).maybeSingle();
  if (data) return;
  await supabase.from("tenants").insert({ id: tenantId, name: tenantId, label: tenantId } as never);
}

function seedBundle(tenantId: string): MenuSyncBundle {
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
  }] as const;
  const seedCategories =
    tenantId === "libritech"
      ? (libritechSeed as unknown as ReturnType<typeof getSeedMenuForTenant>)
      : getSeedMenuForTenant(tenantId);
  const categories = seedCategories.map<AdminMenuCategory>((cat, order) => ({
    id: cat.id,
    title: cat.title,
    subtitle: cat.subtitle,
    description: cat.description,
    availability: cat.availability,
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

function normalizeMenuListVisibility(value: unknown): AdminMenuList["visibility"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const validChannels: MenuOrderChannel[] = ["site", "phone", "whatsapp", "online", "table", "product_reservation"];
  const channels = Array.isArray(raw.channels)
    ? raw.channels.filter((channel): channel is MenuOrderChannel =>
        typeof channel === "string" && validChannels.includes(channel as MenuOrderChannel),
      )
    : undefined;
  return {
    ...(Array.isArray(raw.days) ? { days: raw.days.filter((day): day is MenuDay => typeof day === "number" && day >= 0 && day <= 6) } : {}),
    ...(typeof raw.startTime === "string" ? { startTime: raw.startTime } : {}),
    ...(typeof raw.endTime === "string" ? { endTime: raw.endTime } : {}),
    ...(Array.isArray(raw.tableIds) ? { tableIds: raw.tableIds.filter((id): id is string => typeof id === "string") } : {}),
    ...(channels && channels.length > 0 ? { channels } : {}),
  };
}

function priceKind(price: PriceFormat): Database["public"]["Enums"]["price_kind"] {
  if (price.kind === "sized") return "sized";
  if (price.kind === "persone") return "persone";
  if (price.kind === "volume") return "volume";
  return "single";
}

function sqlQuote(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function isMissingMenuListsError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "PGRST205"
  );
}

function groupBy<T, K>(arr: T[], key: (value: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const item of arr) {
    const k = key(item);
    const current = out.get(k);
    if (current) current.push(item);
    else out.set(k, [item]);
  }
  return out;
}
