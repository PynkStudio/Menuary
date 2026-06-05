import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { MenuOrderChannel } from "@/lib/types";
import { MENU_ORDER_CHANNEL_VALUES, isMenuOrderChannel, menuChannelIgnoresTimeRules } from "@/lib/menu-channels";

type Db = SupabaseClient<Database>;

type MenuListRow = {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
  visibility: unknown;
};

type MenuListItemRow = {
  list_id: string;
  item_id: string;
};

type MenuItemRow = {
  id: string;
  code: string;
  category_id: string;
  name: string;
  description: string | null;
  tags: string[];
  allergens: string[];
  abv: string | null;
  available: boolean;
};

type CategoryRow = {
  id: string;
  code: string;
  title: string;
};

type IndexedSuggestion = {
  itemId: string;
  score: number;
  reason: string;
};

type UpsellIndexRow = {
  tenant_id: string;
  menu_scope: string;
  menu_list_id: string | null;
  channel: string;
  source_item_id: string;
  menu_hash: string;
  suggestions: IndexedSuggestion[];
  generated_by: string;
  updated_at: string;
};

type UserUpsellContext = {
  userId: string;
  isVegetarian: boolean;
  dietNotes: string | null;
  preferredLanguage: string | null;
  crmTags: string[];
  blockedAllergens: string[];
  frequentItems: Array<{ name: string; count: number }>;
  recentOrders: Array<{ createdAt: string; items: string[]; total: number }>;
};

type QueryResult<T> = { data: T[] | null; error: { message: string } | null };
type LooseQuery<T> = {
  select: (columns: string) => LooseQuery<T>;
  eq: (column: string, value: unknown) => LooseQuery<T>;
  in: (column: string, values: unknown[]) => LooseQuery<T>;
  is: (column: string, value: null) => LooseQuery<T>;
  limit: (count: number) => LooseQuery<T>;
  upsert: (rows: unknown[], options: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
};
type LooseDb = { from: <T>(table: string) => LooseQuery<T> };

export type UpsellSuggestion = {
  itemId: string;
  name: string;
  text: string;
  score: number;
  source: "index" | "ai_fallback" | "heuristic";
};

const CHANNELS = MENU_ORDER_CHANNEL_VALUES;
const OPENAI_API = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_UPSELL_MODEL ?? "gpt-5-mini";
const MAX_SOURCES_PER_INDEX = 80;
const MAX_MENU_ITEMS_FOR_AI = 180;

export async function suggestUpsellsForOrder(
  db: Db,
  input: {
    tenantId: string;
    itemCodes: string[];
    channel: MenuOrderChannel;
    tableId?: string | null;
    userId?: string | null;
  },
): Promise<UpsellSuggestion[]> {
  const context = await loadMenuContext(db, input.tenantId, input.channel, input.tableId ?? null);
  const ordered = context.items.filter((item) => input.itemCodes.includes(item.code));
  if (ordered.length === 0 || context.items.length === 0) return [];

  const userContext = input.userId ? await loadUserUpsellContext(db, input.tenantId, input.userId) : null;
  const menuHash = hashMenu(context.items);
  const itemById = new Map(context.items.map((item) => [item.id, item]));
  const orderedIds = new Set(ordered.map((item) => item.id));

  if (userContext) {
    const personalized = await suggestForSpecificOrderWithAI(context.items, ordered, userContext);
    const mapped = mapAiSuggestions(personalized, itemById, orderedIds, userContext).slice(0, 3);
    if (mapped.length > 0) return mapped;
  }

  const indexedRows = await readIndexes(db, {
    tenantId: input.tenantId,
    channel: input.channel,
    menuListIds: context.menuListIds,
    sourceItemIds: [...orderedIds],
    menuHash,
  });
  const indexed = aggregateIndexedSuggestions(indexedRows, itemById, orderedIds, userContext);

  if (indexed.length >= 2 && !isConflicted(indexed)) {
    return indexed.slice(0, 3);
  }

  if (indexedRows.length === 0) {
    await ensureTenantUpsellIndexes(db, input.tenantId, { channels: [input.channel], tableId: input.tableId ?? null });
    const freshRows = await readIndexes(db, {
      tenantId: input.tenantId,
      channel: input.channel,
      menuListIds: context.menuListIds,
      sourceItemIds: [...orderedIds],
      menuHash,
    });
    const fresh = aggregateIndexedSuggestions(freshRows, itemById, orderedIds, userContext);
    if (fresh.length >= 2 && !isConflicted(fresh)) return fresh.slice(0, 3);
  }

  const aiFallback = await suggestForSpecificOrderWithAI(context.items, ordered, userContext);
  if (aiFallback.length > 0) {
    return mapAiSuggestions(aiFallback, itemById, orderedIds, userContext).slice(0, 3);
  }

  return heuristicSuggestions(context.items, ordered, userContext).slice(0, 3);
}

export async function ensureTenantUpsellIndexes(
  db: Db,
  tenantId: string,
  options?: { channels?: MenuOrderChannel[]; tableId?: string | null },
) {
  const channels = options?.channels ?? CHANNELS;
  for (const channel of channels) {
    const context = await loadMenuContext(db, tenantId, channel, options?.tableId ?? null);
    if (context.items.length < 2) continue;

    const menuHash = hashMenu(context.items);
    const existing = await readIndexHashes(db, tenantId, channel, context.menuListIds);
    const missing = context.menuListIds.filter((menuListId) => existing.get(scopeKey(menuListId)) !== menuHash);
    if (missing.length === 0) continue;

    const indexes = await buildIndexesForContext(context.items, context.menuListIds, channel, menuHash, tenantId);
    if (indexes.length === 0) continue;
    await upsertIndexes(db, indexes);
  }
}

async function buildIndexesForContext(
  items: MenuItemRow[],
  menuListIds: Array<string | null>,
  channel: MenuOrderChannel,
  menuHash: string,
  tenantId: string,
): Promise<UpsellIndexRow[]> {
  const aiAssociations = await buildAssociationsWithAI(items);
  const associations = aiAssociations.size > 0 ? aiAssociations : buildHeuristicAssociationMap(items);
  const now = new Date().toISOString();
  const sourceItems = items.slice(0, MAX_SOURCES_PER_INDEX);

  return menuListIds.flatMap((menuListId) =>
    sourceItems.flatMap((source) => {
      const suggestions = (associations.get(source.id) ?? [])
        .filter((suggestion) => suggestion.itemId !== source.id)
        .slice(0, 5);
      if (suggestions.length === 0) return [];
      return [{
        tenant_id: tenantId,
        menu_scope: scopeKey(menuListId),
        menu_list_id: menuListId,
        channel,
        source_item_id: source.id,
        menu_hash: menuHash,
        suggestions,
        generated_by: aiAssociations.size > 0 ? MODEL : "heuristic",
        updated_at: now,
      }];
    }),
  );
}

async function loadMenuContext(db: Db, tenantId: string, channel: MenuOrderChannel, tableId: string | null) {
  const [{ data: categories, error: catErr }, { data: items, error: itemErr }] = await Promise.all([
    db.from("menu_categories").select("id,code,title").eq("tenant_id", tenantId),
    db
      .from("menu_items")
      .select("id,code,category_id,name,description,tags,allergens,abv,available")
      .eq("tenant_id", tenantId)
      .eq("available", true),
  ]);
  if (catErr) throw catErr;
  if (itemErr) throw itemErr;

  const menuLists = await loadVisibleMenuLists(db, tenantId, channel, tableId);
  const allowedIds = menuLists.allowedItemIds;
  const categoryById = new Map(((categories ?? []) as CategoryRow[]).map((category) => [category.id, category]));
  const visibleItems = ((items ?? []) as MenuItemRow[])
    .filter((item) => !allowedIds || allowedIds.has(item.id))
    .map((item) => ({
      ...item,
      tags: normalizeTags([...(item.tags ?? []), categoryById.get(item.category_id)?.title ?? ""]),
    }));

  return {
    items: visibleItems,
    menuListIds: menuLists.menuListIds.length > 0 ? menuLists.menuListIds : [null],
  };
}

async function loadVisibleMenuLists(db: Db, tenantId: string, channel: MenuOrderChannel, tableId: string | null) {
  const result = await (db as unknown as {
    from: (table: "menu_lists") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => Promise<{ data: MenuListRow[] | null; error: { message: string } | null }>;
      };
    };
  }).from("menu_lists").select("id,code,name,enabled,visibility").eq("tenant_id", tenantId);
  if (result.error) throw new Error(result.error.message);

  const lists = result.data ?? [];
  const active = lists.filter((list) => isMenuListVisible(list, channel, tableId, new Date()));
  const restricted = active.filter(hasMenuListRestriction);
  const scoped = restricted.length > 0 ? restricted : active.filter((list) => !hasMenuListRestriction(list));
  if (lists.length === 0 || scoped.length === 0) {
    return { menuListIds: [] as string[], allowedItemIds: null as Set<string> | null };
  }

  const itemsResult = await (db as unknown as {
    from: (table: "menu_list_items") => {
      select: (columns: string) => {
        in: (column: string, values: string[]) => Promise<{ data: MenuListItemRow[] | null; error: { message: string } | null }>;
      };
    };
  }).from("menu_list_items").select("list_id,item_id").in("list_id", scoped.map((list) => list.id));
  if (itemsResult.error) throw new Error(itemsResult.error.message);

  return {
    menuListIds: scoped.map((list) => list.id),
    allowedItemIds: new Set((itemsResult.data ?? []).map((item) => item.item_id)),
  };
}

async function readIndexes(
  db: Db,
  input: {
    tenantId: string;
    channel: MenuOrderChannel;
    menuListIds: Array<string | null>;
    sourceItemIds: string[];
    menuHash: string;
  },
): Promise<UpsellIndexRow[]> {
  if (input.sourceItemIds.length === 0) return [];
  try {
    const rows: UpsellIndexRow[] = [];
    for (const menuListId of input.menuListIds) {
      const query = (db as unknown as LooseDb)
        .from<UpsellIndexRow>("menu_upsell_indexes")
        .select("tenant_id,menu_scope,menu_list_id,channel,source_item_id,menu_hash,suggestions,generated_by,updated_at")
        .eq("tenant_id", input.tenantId)
        .eq("channel", input.channel)
        .eq("menu_hash", input.menuHash)
        .eq("menu_scope", scopeKey(menuListId))
        .in("source_item_id", input.sourceItemIds);
      const result = await executeQuery<UpsellIndexRow>(menuListId ? query.eq("menu_list_id", menuListId) : query.is("menu_list_id", null));
      if (result.error) return [];
      rows.push(...(result.data ?? []));
    }
    return rows;
  } catch {
    return [];
  }
}

async function readIndexHashes(db: Db, tenantId: string, channel: MenuOrderChannel, menuListIds: Array<string | null>) {
  const hashes = new Map<string, string>();
  try {
    for (const menuListId of menuListIds) {
      const query = (db as unknown as LooseDb)
        .from<{ menu_hash: string }>("menu_upsell_indexes")
        .select("menu_hash")
        .eq("tenant_id", tenantId)
        .eq("channel", channel)
        .eq("menu_scope", scopeKey(menuListId))
        .limit(1);
      const result = await executeQuery<{ menu_hash: string }>(menuListId ? query.eq("menu_list_id", menuListId) : query.is("menu_list_id", null));
      if (!result.error && result.data?.[0]) hashes.set(scopeKey(menuListId), result.data[0].menu_hash);
    }
  } catch {
    return hashes;
  }
  return hashes;
}

async function upsertIndexes(db: Db, indexes: UpsellIndexRow[]) {
  try {
    const { error } = await (db as unknown as LooseDb)
      .from<UpsellIndexRow>("menu_upsell_indexes")
      .upsert(indexes, { onConflict: "tenant_id,channel,menu_scope,source_item_id" });
    if (error) console.error("[upselling-engine] index upsert failed", error.message);
  } catch (error) {
    console.error("[upselling-engine] index upsert failed", error instanceof Error ? error.message : String(error));
  }
}

async function executeQuery<T>(query: LooseQuery<T>): Promise<QueryResult<T>> {
  return query as unknown as Promise<QueryResult<T>>;
}

async function loadUserUpsellContext(db: Db, tenantId: string, userId: string): Promise<UserUpsellContext> {
  const [{ data: profile }, { data: fallbackProfile }, { data: customer }, { data: orders }] = await Promise.all([
    db
      .from("user_profiles")
      .select("is_vegetarian,diet_notes,preferred_language")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("users")
      .select("is_vegetarian,diet_notes,preferred_language")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("customers")
      .select("tags")
      .eq("tenant_id", tenantId)
      .eq("menuary_user_id", userId)
      .maybeSingle(),
    db
      .from("orders")
      .select("created_at,total,order_lines(name,qty)")
      .eq("tenant_id", tenantId)
      .eq("menuary_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const source = profile ?? fallbackProfile;
  const recentOrders = ((orders ?? []) as unknown as Array<{ created_at: string; total: number; order_lines?: Array<{ name: string; qty: number }> }>).map((order) => ({
    createdAt: order.created_at,
    total: Number(order.total) || 0,
    items: (order.order_lines ?? []).map((line) => `${line.qty}x ${line.name}`),
  }));
  const counts = new Map<string, number>();
  for (const order of recentOrders) {
    for (const item of order.items) {
      const name = item.replace(/^\d+x\s+/, "");
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  const dietNotes = typeof source?.diet_notes === "string" ? source.diet_notes : null;
  return {
    userId,
    isVegetarian: source?.is_vegetarian === true,
    dietNotes,
    preferredLanguage: typeof source?.preferred_language === "string" ? source.preferred_language : null,
    crmTags: Array.isArray(customer?.tags) ? customer.tags : [],
    blockedAllergens: detectBlockedAllergens(dietNotes),
    frequentItems: [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    recentOrders,
  };
}

async function buildAssociationsWithAI(items: MenuItemRow[]): Promise<Map<string, IndexedSuggestion[]>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Map();

  const compactMenu = items.slice(0, MAX_MENU_ITEMS_FOR_AI).map((item) => ({
    id: item.id,
    name: item.name,
    category: item.tags.at(-1) ?? "",
    description: item.description ?? "",
    tags: item.tags.slice(0, 8),
    allergens: item.allergens ?? [],
    abv: item.abv ?? "",
  }));
  const system = [
    "Sei un sommelier/restaurant revenue manager per upselling menu.",
    "Genera abbinamenti sensati tra prodotti disponibili, evitando suggerimenti incompatibili.",
    "Esempio: pizza o burger preferiscono birra/bibita/contorno, non vino rosso se ci sono opzioni piu naturali.",
    "Rispondi solo JSON valido.",
  ].join(" ");
  const user = JSON.stringify({
    task: "Per ogni prodotto source_id indica fino a 5 prodotti consigliati da aggiungere.",
    rules: [
      "Non suggerire il prodotto stesso.",
      "Preferisci pairing complementari, margine da upsell e pertinenza gastronomica.",
      "Dai score 0-100 e reason breve in italiano, pronta per essere mostrata al cliente.",
      "Usa solo id presenti nel menu.",
    ],
    output_shape: { associations: [{ source_id: "uuid", suggestions: [{ item_id: "uuid", score: 88, reason: "..." }] }] },
    menu: compactMenu,
  });

  try {
    const res = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { role: "system", content: [{ type: "input_text", text: system }] },
          { role: "user", content: [{ type: "input_text", text: user }] },
        ],
        text: { format: { type: "json_object" } },
      }),
    });
    if (!res.ok) {
      console.error("[upselling-engine] openai index failed", res.status, (await res.text()).slice(0, 240));
      return new Map();
    }
    return normalizeAssociationPayload(parseOpenAIText(await res.json()), new Set(items.map((item) => item.id)));
  } catch (error) {
    console.error("[upselling-engine] openai index failed", error instanceof Error ? error.message : String(error));
    return new Map();
  }
}

async function suggestForSpecificOrderWithAI(
  menuItems: MenuItemRow[],
  orderedItems: MenuItemRow[],
  userContext?: UserUpsellContext | null,
): Promise<IndexedSuggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const safeMenuItems = userContext ? menuItems.filter((item) => isAllowedForUser(item, userContext)) : menuItems;
  const menu = safeMenuItems.slice(0, MAX_MENU_ITEMS_FOR_AI).map((item) => ({
    id: item.id,
    name: item.name,
    category: item.tags.at(-1) ?? "",
    description: item.description ?? "",
    tags: item.tags.slice(0, 8),
    allergens: item.allergens ?? [],
    abv: item.abv ?? "",
  }));
  const ordered = orderedItems.map((item) => ({ id: item.id, name: item.name, tags: item.tags }));
  const user = JSON.stringify({
    task: userContext
      ? "Cliente loggato: usa profilo, abitudini e storico ordini per suggerire fino a 3 aggiunte personalizzate dal menu disponibile."
      : "Cliente ha ordinato questi prodotti. Suggerisci fino a 3 aggiunte dal menu disponibile.",
    ordered,
    customer_context: userContext
      ? {
          vegetarian: userContext.isVegetarian,
          diet_notes: userContext.dietNotes,
          blocked_allergens: userContext.blockedAllergens,
          crm_tags: userContext.crmTags,
          frequent_items: userContext.frequentItems,
          recent_orders: userContext.recentOrders,
        }
      : null,
    menu,
    output_shape: { suggestions: [{ item_id: "uuid", score: 90, reason: "..." }] },
  });

  try {
    const res = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          {
            role: "system",
            content: [{
              type: "input_text",
              text: [
                "Sei un esperto di upselling food.",
                "Rispondi solo JSON valido e usa solo id presenti nel menu.",
                "Se sono presenti allergie, intolleranze o note dieta, non suggerire prodotti incompatibili.",
                "Per utenti abituali valorizza preferenze e storico, evitando doppioni ovvi rispetto all'ordine corrente.",
              ].join(" "),
            }],
          },
          { role: "user", content: [{ type: "input_text", text: user }] },
        ],
        text: { format: { type: "json_object" } },
      }),
    });
    if (!res.ok) return [];
    const parsed = parseJsonObject(parseOpenAIText(await res.json()));
    return normalizeSuggestionList((parsed.suggestions ?? []) as unknown[], new Set(safeMenuItems.map((item) => item.id)));
  } catch {
    return [];
  }
}

function aggregateIndexedSuggestions(
  rows: UpsellIndexRow[],
  itemById: Map<string, MenuItemRow>,
  orderedIds: Set<string>,
  userContext?: UserUpsellContext | null,
): UpsellSuggestion[] {
  const byItem = new Map<string, UpsellSuggestion>();
  for (const row of rows) {
    for (const suggestion of row.suggestions ?? []) {
      const item = itemById.get(suggestion.itemId);
      if (!item || orderedIds.has(item.id)) continue;
      if (userContext && !isAllowedForUser(item, userContext)) continue;
      const current = byItem.get(item.id);
      const score = Math.max(0, Math.min(100, Number(suggestion.score) || 0));
      if (!current || score > current.score) {
        byItem.set(item.id, {
          itemId: item.code,
          name: item.name,
          text: `${item.name}: ${suggestion.reason}`,
          score,
          source: "index",
        });
      }
    }
  }
  return [...byItem.values()].sort((a, b) => b.score - a.score);
}

function mapAiSuggestions(
  suggestions: IndexedSuggestion[],
  itemById: Map<string, MenuItemRow>,
  orderedIds: Set<string>,
  userContext?: UserUpsellContext | null,
): UpsellSuggestion[] {
  return suggestions
    .filter((suggestion) => !orderedIds.has(suggestion.itemId))
    .map((suggestion) => {
      const item = itemById.get(suggestion.itemId);
      if (!item || (userContext && !isAllowedForUser(item, userContext))) return null;
      return {
        itemId: item.code,
        name: item.name,
        text: `${item.name}: ${suggestion.reason}`,
        score: suggestion.score,
        source: "ai_fallback" as const,
      };
    })
    .filter((suggestion): suggestion is NonNullable<typeof suggestion> => Boolean(suggestion));
}

function heuristicSuggestions(items: MenuItemRow[], ordered: MenuItemRow[], userContext?: UserUpsellContext | null): UpsellSuggestion[] {
  const orderedIds = new Set(ordered.map((item) => item.id));
  const associations = buildHeuristicAssociationMap(items);
  const itemById = new Map(items.map((item) => [item.id, item]));
  return aggregateIndexedSuggestions(
    ordered.map((item) => ({
      tenant_id: "",
      menu_list_id: null,
      menu_scope: "__all__",
      channel: "site",
      source_item_id: item.id,
      menu_hash: "",
      suggestions: associations.get(item.id) ?? [],
      generated_by: "heuristic",
      updated_at: "",
    })),
    itemById,
    orderedIds,
    userContext,
  ).map((suggestion) => ({ ...suggestion, source: "heuristic" as const }));
}

function buildHeuristicAssociationMap(items: MenuItemRow[]): Map<string, IndexedSuggestion[]> {
  const byId = new Map<string, IndexedSuggestion[]>();
  for (const source of items) {
    const sourceKind = classifyItem(source);
    const suggestions = items
      .filter((candidate) => candidate.id !== source.id)
      .map((candidate) => ({
        itemId: candidate.id,
        score: pairingScore(sourceKind, classifyItem(candidate)),
        reason: pairingReason(sourceKind, classifyItem(candidate)),
      }))
      .filter((suggestion) => suggestion.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    byId.set(source.id, suggestions);
  }
  return byId;
}

function classifyItem(item: MenuItemRow) {
  const haystack = normalizeTags([item.name, item.description ?? "", ...(item.tags ?? []), item.abv ?? ""]).join(" ");
  if (/\b(pizza|pizze|margherita|diavola|bufala)\b/.test(haystack)) return "pizza";
  if (/\b(burger|panino|sandwich|club)\b/.test(haystack)) return "burger";
  if (/\b(birra|ipa|lager|pils|ale)\b/.test(haystack) || item.abv) return "beer";
  if (/\b(vino|rosso|bianco|bollicine|prosecco)\b/.test(haystack)) return "wine";
  if (/\b(coca|cola|acqua|bibita|soft|soda|drink)\b/.test(haystack)) return "soft_drink";
  if (/\b(patat|fritt|contorno|chips|fries)\b/.test(haystack)) return "side";
  if (/\b(dolce|dessert|tirami|cheesecake|gelato)\b/.test(haystack)) return "dessert";
  if (/\b(antipast|tagliere|starter)\b/.test(haystack)) return "starter";
  return "other";
}

function pairingScore(source: string, candidate: string) {
  const matrix: Record<string, Record<string, number>> = {
    pizza: { beer: 95, soft_drink: 78, side: 70, dessert: 45, wine: 35 },
    burger: { beer: 94, side: 88, soft_drink: 76, dessert: 45, wine: 25 },
    starter: { wine: 75, beer: 68, soft_drink: 45 },
    beer: { pizza: 65, burger: 65, side: 55 },
    wine: { starter: 65, dessert: 40 },
    soft_drink: { pizza: 55, burger: 55, side: 45 },
    side: { beer: 70, soft_drink: 55, dessert: 35 },
    dessert: { soft_drink: 30 },
    other: { beer: 45, soft_drink: 42, side: 40, dessert: 38 },
  };
  return matrix[source]?.[candidate] ?? 0;
}

function pairingReason(source: string, candidate: string) {
  if ((source === "pizza" || source === "burger") && candidate === "beer") return "abbinamento naturale e facile da aggiungere all'ordine.";
  if ((source === "pizza" || source === "burger") && candidate === "side") return "completa il piatto principale senza appesantire la scelta.";
  if (candidate === "soft_drink") return "opzione semplice e trasversale per accompagnare il pasto.";
  if (candidate === "dessert") return "chiude bene l'ordine con una proposta dolce.";
  if (candidate === "wine") return "funziona come abbinamento da condividere.";
  return "si abbina bene al resto dell'ordine.";
}

function normalizeAssociationPayload(text: string, validIds: Set<string>) {
  const parsed = parseJsonObject(text);
  const associations = Array.isArray(parsed.associations) ? parsed.associations : [];
  const out = new Map<string, IndexedSuggestion[]>();
  for (const association of associations) {
    if (!association || typeof association !== "object") continue;
    const raw = association as { source_id?: unknown; suggestions?: unknown };
    if (typeof raw.source_id !== "string" || !validIds.has(raw.source_id)) continue;
    const suggestions = normalizeSuggestionList(Array.isArray(raw.suggestions) ? raw.suggestions : [], validIds);
    if (suggestions.length > 0) out.set(raw.source_id, suggestions);
  }
  return out;
}

function normalizeSuggestionList(values: unknown[], validIds: Set<string>): IndexedSuggestion[] {
  return values
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const raw = value as { item_id?: unknown; itemId?: unknown; score?: unknown; reason?: unknown };
      const itemId = typeof raw.item_id === "string" ? raw.item_id : typeof raw.itemId === "string" ? raw.itemId : "";
      if (!validIds.has(itemId)) return null;
      return {
        itemId,
        score: Math.max(0, Math.min(100, Number(raw.score) || 60)),
        reason: typeof raw.reason === "string" && raw.reason.trim() ? raw.reason.trim().slice(0, 180) : "si abbina bene all'ordine.",
      };
    })
    .filter((item): item is IndexedSuggestion => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function isAllowedForUser(item: MenuItemRow, userContext: UserUpsellContext) {
  const tags = normalizeTags([item.name, item.description ?? "", ...(item.tags ?? [])]);
  if (userContext.isVegetarian) {
    const looksMeatOrFish = tags.some((tag) =>
      /\b(carne|pollo|maiale|manzo|salsiccia|bacon|prosciutto|salame|pesce|tonno|salmone|gamber|crostace|burger)\b/.test(tag),
    );
    const explicitlyVeg = tags.some((tag) => /\b(veg|vegetar|verdure|plant)\b/.test(tag));
    if (looksMeatOrFish && !explicitlyVeg) return false;
  }
  if (userContext.blockedAllergens.length === 0) return true;
  const allergens = new Set(normalizeTags(item.allergens ?? []));
  return userContext.blockedAllergens.every((allergen) => !allergens.has(allergen));
}

function detectBlockedAllergens(dietNotes: string | null): string[] {
  if (!dietNotes) return [];
  const note = normalizeTags([dietNotes]).join(" ");
  const aliases: Record<string, string[]> = {
    glutine: ["glutine", "celiac", "senza glutine", "gluten"],
    crostacei: ["crostace", "gamber", "scampi", "aragost"],
    uova: ["uova", "uovo"],
    pesce: ["pesce", "tonno", "salmone", "branzino"],
    arachidi: ["arachid"],
    soia: ["soia", "soy"],
    latte: ["latte", "lattos", "formaggi", "mozzarella", "casein"],
    frutta_guscio: ["frutta a guscio", "frutta_guscio", "noci", "nocciole", "mandorle", "pistacchi", "anacardi"],
    sedano: ["sedano"],
    senape: ["senape"],
    sesamo: ["sesamo"],
    solfiti: ["solfiti", "solfito"],
    lupini: ["lupini"],
    molluschi: ["mollusch", "cozze", "vongole", "calamar", "polpo"],
  };
  return Object.entries(aliases)
    .filter(([, values]) => values.some((value) => note.includes(value)))
    .map(([key]) => key);
}

function parseOpenAIText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const outputText = (payload as { output_text?: unknown }).output_text;
  if (typeof outputText === "string") return outputText;
  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";
  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) return [];
      return content.flatMap((part) => {
        if (!part || typeof part !== "object") return [];
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? [text] : [];
      });
    })
    .join("\n")
    .trim();
}

function parseJsonObject(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      const parsed = JSON.parse(match[0]);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}

function hashMenu(items: MenuItemRow[]) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        items
          .map((item) => [item.id, item.code, item.name, item.description, item.tags, item.abv])
          .sort((a, b) => String(a[1]).localeCompare(String(b[1]))),
      ),
    )
    .digest("hex");
}

function isConflicted(suggestions: UpsellSuggestion[]) {
  if (suggestions.length < 3) return false;
  const top = suggestions[0]?.score ?? 0;
  const third = suggestions[2]?.score ?? 0;
  return top - third < 8;
}

function scopeKey(menuListId: string | null) {
  return menuListId ?? "__all__";
}

function normalizeTags(values: string[]) {
  return values
    .filter(Boolean)
    .map((value) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    );
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeVisibility(value: unknown) {
  const raw = asObject(value);
  return {
    days: Array.isArray(raw.days) ? raw.days.filter((day): day is number => typeof day === "number") : undefined,
    startTime: typeof raw.startTime === "string" ? raw.startTime : undefined,
    endTime: typeof raw.endTime === "string" ? raw.endTime : undefined,
    tableIds: Array.isArray(raw.tableIds) ? raw.tableIds.filter((id): id is string => typeof id === "string") : undefined,
    channels: Array.isArray(raw.channels)
      ? raw.channels.filter(isMenuOrderChannel)
      : undefined,
  };
}

function isMenuListVisible(list: MenuListRow, channel: MenuOrderChannel, tableId: string | null, now: Date) {
  if (!list.enabled) return false;
  const visibility = normalizeVisibility(list.visibility);
  if (visibility.channels && !visibility.channels.includes(channel)) return false;
  if (menuChannelIgnoresTimeRules(channel)) return true;
  const local = localMenuTime(now);
  if (visibility.days?.length && !visibility.days.includes(local.day)) return false;
  if (!isTimeInWindow(local.minutes, visibility.startTime, visibility.endTime)) return false;
  return !visibility.tableIds?.length || Boolean(tableId && visibility.tableIds.includes(tableId));
}

function hasMenuListRestriction(list: MenuListRow) {
  const visibility = normalizeVisibility(list.visibility);
  return Boolean(visibility.days?.length || visibility.startTime || visibility.endTime || visibility.tableIds?.length || visibility.channels);
}

function localMenuTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  const days: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: days[byType.get("weekday") ?? ""] ?? now.getDay(),
    minutes: Number(byType.get("hour") ?? "0") * 60 + Number(byType.get("minute") ?? "0"),
  };
}

function timeToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
}

function isTimeInWindow(current: number, start: unknown, end: unknown): boolean {
  const from = timeToMinutes(start);
  const to = timeToMinutes(end);
  if (from == null && to == null) return true;
  if (from != null && to == null) return current >= from;
  if (from == null && to != null) return current <= to;
  if (from == null || to == null) return true;
  return from <= to ? current >= from && current <= to : current >= from || current <= to;
}
