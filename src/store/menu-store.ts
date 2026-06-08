"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserLocalJSONStorage } from "@/lib/zustand-json-storage";
import { getSeedMenuForTenant } from "@/lib/tenant-menu-data";
import type { MenuCategory } from "@/lib/menu-data";
import {
  type ExtraList,
  getTenantDefaultExtraLists,
  mergeExtraListsWithDefaults,
} from "@/lib/extra-lists";
import {
  isMenuIngredient,
  normalizeMenuIngredients,
} from "@/lib/ingredients";
import type {
  AdminMenuCategory,
  AdminMenuItem,
  AdminMenuList,
  Extra,
  MenuDay,
  MenuOrderChannel,
  Order,
  OrderStatus,
  PriceFormat,
  MenuTag,
  Table,
  TableSession,
  TenantMenuTagDefinition,
} from "@/lib/types";
import type { MenuIngredient } from "@/lib/ingredients";
import type { MenuSyncBundle } from "@/lib/menu-sync-types";
import { menuChannelIgnoresTimeRules } from "@/lib/menu-channels";

const STORAGE_KEY = "bepork-menu-v3";
const DEFAULT_MENU_TENANT_ID = "bepork";

function migrateItemIngredients(it: AdminMenuItem): AdminMenuItem {
  const ing = it.ingredients;
  if (!ing?.length) return it;
  if (isMenuIngredient(ing[0])) return it;
  return {
    ...it,
    ingredients: normalizeMenuIngredients(
      it.id,
      ing as unknown as string[],
    ),
  };
}

export type ArchivedMenuItem = AdminMenuItem & {
  archivedAt: string;
  originalCategoryId: string;
  originalCategoryTitle?: string;
};

function seedCategories(seedMenu: MenuCategory[]): AdminMenuCategory[] {
  return seedMenu.map((c, order) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    order,
  }));
}

function seedItems(seedMenu: MenuCategory[]): AdminMenuItem[] {
  const out: AdminMenuItem[] = [];
  seedMenu.forEach((cat) => {
    cat.items.forEach((it, i) => {
      out.push({
        ...it,
        categoryId: cat.id,
        order: i,
        available: true,
      });
    });
  });
  return out;
}

function allItemIds(items: AdminMenuItem[]): string[] {
  return items.map((item) => item.id);
}

function itemIdsByCategory(
  items: AdminMenuItem[],
  categoryIds: string[],
): string[] {
  const categorySet = new Set(categoryIds);
  return items
    .filter((item) => categorySet.has(item.categoryId))
    .map((item) => item.id);
}

function seedMenuLists(
  tenantId: string,
  categories: AdminMenuCategory[],
  items: AdminMenuItem[],
): AdminMenuList[] {
  const fullMenu: AdminMenuList = {
    id: "menu-completo",
    name: "Menu completo",
    description: "Tutti i piatti pubblicati dal locale.",
    order: 0,
    enabled: true,
    itemIds: allItemIds(items),
    visibility: {},
  };

  if (tenantId === "faak") {
    return [
      {
        id: "faak-menu-mattina",
        name: "Menu mattina",
        description: "Colazione e forno, visibile fino a tarda mattina.",
        order: 0,
        enabled: true,
        itemIds: itemIdsByCategory(items, ["faak-mattina"]),
        visibility: { startTime: "07:00", endTime: "11:30" },
      },
      {
        id: "faak-menu-pranzo",
        name: "Menu giorno",
        description: "Pranzo e piatti di cucina.",
        order: 1,
        enabled: true,
        itemIds: itemIdsByCategory(items, ["faak-giorno"]),
        visibility: { startTime: "11:30", endTime: "17:30" },
      },
      {
        id: "faak-menu-aperitivo",
        name: "Menu aperitivo",
        description: "Bere, stuzzichi e tavoli informali.",
        order: 2,
        enabled: true,
        itemIds: itemIdsByCategory(items, ["faak-aperitivo"]),
        visibility: { startTime: "17:30", endTime: "21:00" },
      },
      {
        id: "faak-menu-sera",
        name: "Menu sera",
        description: "Cena e percorsi serali.",
        order: 3,
        enabled: true,
        itemIds: itemIdsByCategory(items, ["faak-sera", "faak-aperitivo"]),
        visibility: { startTime: "19:00", endTime: "01:00" },
      },
      fullMenu,
    ];
  }

  if (tenantId === "doca") {
    return [
      {
        ...fullMenu,
        name: "Banco Doca",
        description: "Salati, dolci e bevande disponibili in bottega.",
      },
    ];
  }

  if (tenantId === "junior-food") {
    return [
      {
        ...fullMenu,
        name: "Menu Junior Food",
        description: "Tutti i piatti della carta boliviana e sudamericana.",
      },
      {
        id: "jf-pranzo",
        name: "Pranzo",
        description: "Piatti completi disponibili nel servizio diurno.",
        order: 1,
        enabled: true,
        itemIds: allItemIds(items),
        visibility: { startTime: "12:00", endTime: "15:00" },
      },
      {
        id: "jf-cena",
        name: "Cena",
        description: "Carta completa per la cena e il dopo cena.",
        order: 2,
        enabled: true,
        itemIds: allItemIds(items),
        visibility: { startTime: "18:30", endTime: "02:00" },
      },
    ];
  }

  return [
    fullMenu,
    {
      id: "menu-pranzo",
      name: "Menu pranzo",
      description: "Piatti rapidi, antipasti e proposte leggere per il servizio diurno.",
      order: 1,
      enabled: true,
      itemIds: itemIdsByCategory(items, ["antipasti", "insalate", "primi"]),
      visibility: { startTime: "11:30", endTime: "16:00" },
    },
    {
      id: "menu-sera",
      name: "Menu sera",
      description: "La carta completa per sala ristorante e servizio serale.",
      order: 2,
      enabled: true,
      itemIds: allItemIds(items),
      visibility: { startTime: "18:30", endTime: "01:00" },
    },
    {
      id: "menu-weekend",
      name: "Menu weekend",
      description: "Combo, burger, pizze e portate da condividere per venerdi, sabato e domenica.",
      order: 3,
      enabled: true,
      itemIds: items
        .filter((item) => {
          const text = `${item.categoryId} ${item.name}`.toLowerCase();
          return (
            text.includes("menu") ||
            text.includes("combo") ||
            text.includes("burger") ||
            text.includes("pizza") ||
            text.includes("taglier")
          );
        })
        .map((item) => item.id),
      visibility: { days: [0, 5, 6] },
    },
    {
      id: "menu-piano-bar",
      name: "Menu piano bar",
      description: "Selezione ridotta per tavoli area bar, drink e piatti condivisibili.",
      order: 4,
      enabled: true,
      itemIds: items
        .filter((item) => {
          const text = `${item.categoryId} ${item.name}`.toLowerCase();
          return (
            text.includes("bev") ||
            text.includes("birr") ||
            text.includes("taglier") ||
            text.includes("nachos") ||
            text.includes("patat") ||
            text.includes("fritt")
          );
        })
        .map((item) => item.id),
      visibility: { tableIds: ["tbl-5", "tbl-6"], startTime: "18:00", endTime: "01:00" },
    },
  ];
}

export interface MenuState {
  currentTenantId: string;
  categories: AdminMenuCategory[];
  items: AdminMenuItem[];
  archivedItems: ArchivedMenuItem[];
  menuLists: AdminMenuList[];
  customTags: TenantMenuTagDefinition[];
  volumeLabels: string[];
  /** Liste aggiunte condivise: modificate una volta, tutti i piatti collegati le vedono. */
  extraLists: ExtraList[];
  orders: Order[];
  lastOrderSeq: number;

  tables: Table[];
  sessions: TableSession[];

  updateCategory: (id: string, patch: Partial<AdminMenuCategory>) => void;
  addCategory: (title: string) => string;
  removeCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;
  updateItem: (id: string, patch: Partial<AdminMenuItem>) => void;
  setAvailable: (id: string, available: boolean) => void;
  updatePrice: (id: string, price: PriceFormat) => void;
  updateIngredients: (id: string, ingredients: MenuIngredient[]) => void;
  updateExtras: (id: string, extras: Extra[]) => void;
  updateImage: (id: string, image: string | undefined) => void;
  updateTags: (id: string, tags: MenuTag[]) => void;
  addCustomTag: (label: string) => string;
  addVolumeLabel: (label: string) => void;
  reorderCategoryItems: (categoryId: string, orderedIds: string[]) => void;
  addExtraList: (name: string) => string;
  updateExtraList: (id: string, list: ExtraList) => void;
  removeExtraList: (id: string) => void;
  applyExtraListToItemIds: (listId: string, itemIds: string[]) => void;
  addItem: (categoryId: string, draft: Partial<AdminMenuItem>) => string;
  addItems: (drafts: Array<Partial<AdminMenuItem> & { categoryId: string }>) => string[];
  removeItem: (id: string) => void;
  restoreArchivedItem: (id: string, categoryId?: string) => void;
  addMenuList: (draft?: Partial<AdminMenuList>) => string;
  updateMenuList: (id: string, patch: Partial<AdminMenuList>) => void;
  removeMenuList: (id: string) => void;
  toggleMenuListItem: (menuListId: string, itemId: string) => void;
  replaceMenuData: (bundle: MenuSyncBundle) => void;

  addOrder: (o: Omit<Order, "id" | "createdAt" | "status" | "code">) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  toggleOrderLinePrepared: (orderId: string, lineIndex: number) => void;
  removeOrder: (id: string) => void;
  clearCompletedOrders: () => void;

  addTable: (label: string, seats?: number) => Table;
  updateTable: (id: string, patch: Partial<Table>) => void;
  removeTable: (id: string) => void;

  openSession: (tableId: string, declaredCovers?: number) => TableSession;
  addDiner: (sessionId: string, clientId: string, nickname: string) => void;
  updateDinerNickname: (
    sessionId: string,
    clientId: string,
    nickname: string,
  ) => void;
  closeSession: (sessionId: string) => void;

  resetToSeed: () => void;
  setTenantSeed: (tenantId: string) => void;
}

function slugifyTag(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function mergeCustomTags(
  explicit: TenantMenuTagDefinition[] | undefined,
  items: AdminMenuItem[],
): TenantMenuTagDefinition[] {
  const builtIn = new Set(["firma", "piccante", "veg", "novita"]);
  const byId = new Map<string, TenantMenuTagDefinition>();
  for (const tag of explicit ?? []) {
    if (tag.id && tag.label && !builtIn.has(tag.id)) byId.set(tag.id, tag);
  }
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      if (builtIn.has(tag)) continue;
      byId.set(tag, byId.get(tag) ?? { id: tag, label: tag });
    }
  }
  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label, "it"));
}

function mergeVolumeLabels(
  explicit: string[] | undefined,
  items: AdminMenuItem[],
): string[] {
  const labels = new Set((explicit ?? []).map((label) => label.trim()).filter(Boolean));
  for (const item of items) {
    if (item.price.kind !== "volume") continue;
    const variants = item.price.variants?.length
      ? item.price.variants
      : [item.price.small, item.price.large];
    for (const variant of variants) {
      if (variant.label.trim()) labels.add(variant.label.trim());
    }
  }
  return [...labels].sort((a, b) => a.localeCompare(b, "it"));
}

function seedTables(): Table[] {
  const now = Date.now();
  return [1, 2, 3, 4, 5, 6].map((n, i) => ({
    id: `tbl-${n}`,
    label: `Tavolo ${n}`,
    seats: n <= 2 ? 2 : 4,
    createdAt: now + i,
  }));
}

function buildInitial(tenantId = DEFAULT_MENU_TENANT_ID) {
  const seedMenu = getSeedMenuForTenant(tenantId);
  const categories = seedCategories(seedMenu);
  const items = seedItems(seedMenu);
  return {
    currentTenantId: tenantId,
    categories,
    items,
    archivedItems: [] as ArchivedMenuItem[],
    menuLists: seedMenuLists(tenantId, categories, items),
    customTags: mergeCustomTags(undefined, items),
    volumeLabels: mergeVolumeLabels(undefined, items),
    extraLists: mergeExtraListsWithDefaults(undefined, getTenantDefaultExtraLists(tenantId)),
    orders: [] as Order[],
    lastOrderSeq: 0,
    tables: seedTables(),
    sessions: [] as TableSession[],
  };
}

function genCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      ...buildInitial(),

      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((cat) =>
            cat.id === id ? { ...cat, ...patch } : cat,
          ),
        })),

      addCategory: (title) => {
        const id = genId("cat");
        const cleanTitle = title.trim() || "Nuova categoria";
        set((s) => {
          const maxOrder = s.categories.reduce((m, c) => Math.max(m, c.order ?? 0), 0);
          const next: AdminMenuCategory = {
            id,
            title: cleanTitle,
            order: maxOrder + 1,
          };
          return { categories: [...s.categories, next] };
        });
        return id;
      },

      removeCategory: (id) =>
        set((s) => {
          const category = s.categories.find((cat) => cat.id === id);
          const now = new Date().toISOString();
          const archived = s.items
            .filter((it) => it.categoryId === id)
            .map((it) => ({
              ...it,
              archivedAt: now,
              originalCategoryId: id,
              originalCategoryTitle: category?.title,
            }));
          return {
            categories: s.categories.filter((cat) => cat.id !== id),
            items: s.items.filter((it) => it.categoryId !== id),
            archivedItems: [...archived, ...s.archivedItems],
            menuLists: s.menuLists.map((list) => ({
              ...list,
              itemIds: list.itemIds.filter((itemId) => !archived.some((it) => it.id === itemId)),
            })),
          };
        }),

      reorderCategories: (orderedIds) =>
        set((s) => {
          const orderById = new Map(orderedIds.map((id, index) => [id, index]));
          return {
            categories: s.categories.map((cat) =>
              orderById.has(cat.id) ? { ...cat, order: orderById.get(cat.id)! } : cat,
            ),
          };
        }),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),

      setAvailable: (id, available) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, available } : it,
          ),
        })),

      updatePrice: (id, price) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, price } : it)),
        })),

      updateIngredients: (id, ingredients) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, ingredients } : it,
          ),
        })),

      updateExtras: (id, extras) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id
              ? { ...it, extraListId: undefined, extras }
              : it,
          ),
        })),

      addExtraList: (name) => {
        const id = genId("exl");
        const list: ExtraList = {
          id,
          name: name.trim() || "Nuova lista",
          extras: [],
        };
        set((s) => ({ extraLists: [...s.extraLists, list] }));
        return id;
      },

      updateExtraList: (id, list) =>
        set((s) => ({
          extraLists: s.extraLists.map((l) =>
            l.id === id ? { ...list, id } : l,
          ),
        })),

      removeExtraList: (id) =>
        set((s) => ({
          extraLists: s.extraLists.filter((l) => l.id !== id),
          items: s.items.map((it) =>
            it.extraListId === id
              ? { ...it, extraListId: undefined, extras: [] }
              : it,
          ),
        })),

      applyExtraListToItemIds: (listId, itemIds) => {
        const setIds = new Set(itemIds);
        set((s) => ({
          items: s.items.map((it) =>
            setIds.has(it.id)
              ? { ...it, extraListId: listId, extras: undefined }
              : it,
          ),
        }));
      },

      updateImage: (id, image) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, image } : it)),
        })),

      updateTags: (id, tags) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, tags } : it)),
        })),

      addCustomTag: (label) => {
        const cleaned = label.trim();
        const id = slugifyTag(cleaned);
        if (!cleaned || !id) return "";
        set((s) => ({
          customTags: s.customTags.some((tag) => tag.id === id)
            ? s.customTags
            : [...s.customTags, { id, label: cleaned }],
        }));
        return id;
      },

      addVolumeLabel: (label) => {
        const cleaned = label.trim();
        if (!cleaned) return;
        set((s) => ({
          volumeLabels: s.volumeLabels.includes(cleaned)
            ? s.volumeLabels
            : [...s.volumeLabels, cleaned].sort((a, b) => a.localeCompare(b, "it")),
        }));
      },

      reorderCategoryItems: (categoryId, orderedIds) =>
        set((s) => {
          const orderById = new Map(orderedIds.map((id, index) => [id, index]));
          return {
            items: s.items.map((item) =>
              item.categoryId === categoryId && orderById.has(item.id)
                ? { ...item, order: orderById.get(item.id)! }
                : item,
            ),
          };
        }),

      addItem: (categoryId, draft) => {
        const id =
          draft.id ??
          `new-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const newItem: AdminMenuItem = {
          id,
          categoryId,
          order: 9999,
          available: true,
          name: draft.name ?? "Nuovo piatto",
          description: draft.description,
          price: draft.price ?? { kind: "single", value: 0 },
          tags: draft.tags,
          tagMeta: draft.tagMeta,
          piccanteLevel: draft.piccanteLevel,
          allergens: draft.allergens,
          abv: draft.abv,
          image: draft.image,
          ingredients: draft.ingredients,
          extraListId: draft.extraListId,
          extras: draft.extras,
          bundleSlots: draft.bundleSlots,
        };
        set((s) => ({
          items: [...s.items, newItem],
          menuLists: s.menuLists.map((list) =>
            list.id === "menu-completo"
              ? { ...list, itemIds: [...list.itemIds, newItem.id] }
              : list,
          ),
        }));
        return id;
      },

      addItems: (drafts) => {
        const newItems = drafts.map((draft, index) => {
          const id =
            draft.id ??
            `new-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 7)}`;
          return {
            id,
            categoryId: draft.categoryId,
            order: draft.order ?? 9999,
            available: draft.available ?? true,
            name: draft.name ?? "Nuovo piatto",
            description: draft.description,
            price: draft.price ?? { kind: "single", value: 0 },
            tags: draft.tags,
            tagMeta: draft.tagMeta,
            piccanteLevel: draft.piccanteLevel,
            allergens: draft.allergens,
            abv: draft.abv,
            image: draft.image,
            ingredients: draft.ingredients,
            extraListId: draft.extraListId,
            extras: draft.extras,
            bundleSlots: draft.bundleSlots,
          } satisfies AdminMenuItem;
        });
        const ids = newItems.map((item) => item.id);
        set((s) => ({
          items: [...s.items, ...newItems],
          menuLists: s.menuLists.map((list) =>
            list.id === "menu-completo"
              ? { ...list, itemIds: [...list.itemIds, ...ids] }
              : list,
          ),
        }));
        return ids;
      },

      removeItem: (id) =>
        set((s) => {
          const item = s.items.find((it) => it.id === id);
          if (!item) return {};
          const category = s.categories.find((cat) => cat.id === item.categoryId);
          const archived: ArchivedMenuItem = {
            ...item,
            archivedAt: new Date().toISOString(),
            originalCategoryId: item.categoryId,
            originalCategoryTitle: category?.title,
          };
          return {
            items: s.items.filter((it) => it.id !== id),
            archivedItems: [archived, ...s.archivedItems.filter((it) => it.id !== id)],
            menuLists: s.menuLists.map((list) => ({
              ...list,
              itemIds: list.itemIds.filter((itemId) => itemId !== id),
            })),
          };
        }),

      restoreArchivedItem: (id, categoryId) =>
        set((s) => {
          const archived = s.archivedItems.find((it) => it.id === id);
          if (!archived) return {};
          const targetCategoryId =
            categoryId && s.categories.some((cat) => cat.id === categoryId)
              ? categoryId
              : s.categories.some((cat) => cat.id === archived.originalCategoryId)
                ? archived.originalCategoryId
                : s.categories[0]?.id;
          if (!targetCategoryId) return {};
          const { archivedAt, originalCategoryId, originalCategoryTitle, ...item } = archived;
          void archivedAt;
          void originalCategoryId;
          void originalCategoryTitle;
          const maxOrder = s.items
            .filter((it) => it.categoryId === targetCategoryId)
            .reduce((max, it) => Math.max(max, it.order), -1);
          return {
            items: [
              ...s.items,
              {
                ...item,
                categoryId: targetCategoryId,
                order: maxOrder + 1,
              },
            ],
            archivedItems: s.archivedItems.filter((it) => it.id !== id),
            menuLists: s.menuLists.map((list) =>
              list.id === "menu-completo"
                ? { ...list, itemIds: [...list.itemIds, id] }
                : list,
            ),
          };
        }),

      addMenuList: (draft) => {
        const id = draft?.id ?? genId("ml");
        set((s) => ({
          menuLists: [
            ...s.menuLists,
            {
              id,
              name: draft?.name?.trim() || "Nuovo menu",
              description: draft?.description,
              order: draft?.order ?? s.menuLists.length,
              enabled: draft?.enabled ?? true,
              itemIds: draft?.itemIds ?? [],
              visibility: draft?.visibility ?? {},
            },
          ],
        }));
        return id;
      },

      updateMenuList: (id, patch) =>
        set((s) => ({
          menuLists: s.menuLists.map((list) =>
            list.id === id
              ? {
                  ...list,
                  ...patch,
                  visibility: patch.visibility
                    ? { ...list.visibility, ...patch.visibility }
                    : list.visibility,
                }
              : list,
          ),
        })),

      removeMenuList: (id) =>
        set((s) => ({
          menuLists: s.menuLists.filter((list) => list.id !== id),
        })),

      toggleMenuListItem: (menuListId, itemId) =>
        set((s) => ({
          menuLists: s.menuLists.map((list) => {
            if (list.id !== menuListId) return list;
            const exists = list.itemIds.includes(itemId);
            return {
              ...list,
              itemIds: exists
                ? list.itemIds.filter((id) => id !== itemId)
                : [...list.itemIds, itemId],
            };
          }),
        })),

      replaceMenuData: (bundle) =>
        set((s) => ({
          ...s,
          categories: bundle.categories,
          items: bundle.items.map(migrateItemIngredients),
          archivedItems: s.archivedItems,
          menuLists:
            bundle.menuLists.length > 0
              ? bundle.menuLists.map((list) => ({
                  ...list,
                  enabled: list.enabled ?? true,
                  itemIds: list.itemIds ?? [],
                  visibility: list.visibility ?? {},
                }))
              : seedMenuLists(s.currentTenantId, bundle.categories, bundle.items),
          extraLists: mergeExtraListsWithDefaults(bundle.extraLists, getTenantDefaultExtraLists(s.currentTenantId)),
          customTags: mergeCustomTags(bundle.customTags, bundle.items),
          volumeLabels: mergeVolumeLabels(bundle.volumeLabels, bundle.items),
        })),

      addOrder: (o) => {
        let created!: Order;
        set((s) => {
          const seq = s.lastOrderSeq + 1;
          const code = `B${seq.toString().padStart(3, "0")}`;
          created = {
            ...o,
            id: `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            createdAt: new Date().toISOString(),
            status: "nuovo",
            code,
          };
          return { orders: [created, ...s.orders], lastOrderSeq: seq };
        });
        return created;
      },

      toggleOrderLinePrepared: (orderId, lineIndex) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const lines = o.lines.map((l, i) =>
              i === lineIndex ? { ...l, prepared: !l.prepared } : l,
            );
            return { ...o, lines };
          }),
        })),

      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),

      removeOrder: (id) =>
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),

      clearCompletedOrders: () =>
        set((s) => ({
          orders: s.orders.filter(
            (o) => o.status !== "consegnato" && o.status !== "annullato",
          ),
        })),

      addTable: (label, seats) => {
        const t: Table = {
          id: genId("tbl"),
          label: label.trim() || "Tavolo",
          seats,
          createdAt: Date.now(),
        };
        set((s) => ({ tables: [...s.tables, t] }));
        return t;
      },

      updateTable: (id, patch) =>
        set((s) => ({
          tables: s.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTable: (id) =>
        set((s) => ({
          tables: s.tables.filter((t) => t.id !== id),
          sessions: s.sessions.filter((ss) => ss.tableId !== id),
        })),

      openSession: (tableId, declaredCovers) => {
        let session!: TableSession;
        set((s) => {
          const existing = s.sessions.find(
            (ss) => ss.tableId === tableId && ss.status === "aperta",
          );
          if (existing) {
            session = existing;
            return {};
          }
          session = {
            id: genId("ts"),
            tableId,
            code: genCode(),
            status: "aperta",
            openedAt: Date.now(),
            declaredCovers,
            diners: [],
          };
          return { sessions: [session, ...s.sessions] };
        });
        return session;
      },

      addDiner: (sessionId, clientId, nickname) =>
        set((s) => ({
          sessions: s.sessions.map((ss) => {
            if (ss.id !== sessionId) return ss;
            if (ss.diners.some((d) => d.clientId === clientId)) return ss;
            return {
              ...ss,
              diners: [
                ...ss.diners,
                { clientId, nickname, joinedAt: Date.now() },
              ],
            };
          }),
        })),

      updateDinerNickname: (sessionId, clientId, nickname) =>
        set((s) => ({
          sessions: s.sessions.map((ss) =>
            ss.id !== sessionId
              ? ss
              : {
                  ...ss,
                  diners: ss.diners.map((d) =>
                    d.clientId === clientId ? { ...d, nickname } : d,
                  ),
                },
          ),
        })),

      closeSession: (sessionId) =>
        set((s) => ({
          sessions: s.sessions.map((ss) =>
            ss.id === sessionId
              ? { ...ss, status: "chiusa", closedAt: Date.now() }
              : ss,
          ),
        })),

      resetToSeed: () =>
        set((s) => buildInitial(s.currentTenantId || DEFAULT_MENU_TENANT_ID)),

      setTenantSeed: (tenantId) =>
        set((s) => {
          if (s.currentTenantId === tenantId) return s;
          return buildInitial(tenantId);
        }),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      storage: createBrowserLocalJSONStorage(),
      partialize: (s) => ({
        currentTenantId: s.currentTenantId,
        archivedItems: s.archivedItems,
        orders: s.orders,
        lastOrderSeq: s.lastOrderSeq,
        tables: s.tables,
        sessions: s.sessions,
      }),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== "object") return current;
        const p = persisted as Partial<MenuState>;
        const currentTenantId = p.currentTenantId ?? current.currentTenantId;
        const seeded = buildInitial(currentTenantId);
        return {
          ...current,
          ...seeded,
          currentTenantId,
          archivedItems: p.archivedItems ?? current.archivedItems,
          orders: p.orders ?? current.orders,
          lastOrderSeq: p.lastOrderSeq ?? current.lastOrderSeq,
          tables: p.tables ?? current.tables,
          sessions: p.sessions ?? current.sessions,
        };
      },
    },
  ),
);

export function selectCategoriesOrdered(s: MenuState): AdminMenuCategory[] {
  return [...s.categories].sort((a, b) => a.order - b.order);
}

export function selectMenuListsOrdered(s: Pick<MenuState, "menuLists">): AdminMenuList[] {
  return [...s.menuLists].sort((a, b) => a.order - b.order);
}

export function selectItemsByCategory(
  items: AdminMenuItem[],
  categoryId: string,
  onlyAvailable = false,
): AdminMenuItem[] {
  return items
    .filter((i) => i.categoryId === categoryId)
    .filter((i) => (onlyAvailable ? i.available : true))
    .sort((a, b) => a.order - b.order);
}

function timeToMinutes(value?: string): number | null {
  if (!value) return null;
  const [hh, mm] = value.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

function isTimeInWindow(now: Date, start?: string, end?: string): boolean {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes == null && endMinutes == null) return true;
  const current = now.getHours() * 60 + now.getMinutes();
  if (startMinutes != null && endMinutes == null) return current >= startMinutes;
  if (startMinutes == null && endMinutes != null) return current <= endMinutes;
  if (startMinutes == null || endMinutes == null) return true;
  if (startMinutes <= endMinutes) {
    return current >= startMinutes && current <= endMinutes;
  }
  return current >= startMinutes || current <= endMinutes;
}

export function isMenuListVisible(
  menuList: AdminMenuList,
  options?: { now?: Date; tableId?: string | null; channel?: MenuOrderChannel },
): boolean {
  if (!menuList.enabled) return false;
  const now = options?.now ?? new Date();
  const visibility = menuList.visibility ?? {};
  const channels = visibility.channels;
  if (options?.channel && channels && channels.length > 0 && !channels.includes(options.channel)) return false;
  if (options?.channel && menuChannelIgnoresTimeRules(options.channel)) return true;
  const days = visibility.days ?? [];
  if (days.length > 0 && !days.includes(now.getDay() as MenuDay)) return false;
  if (!isTimeInWindow(now, visibility.startTime, visibility.endTime)) return false;
  const tableIds = visibility.tableIds ?? [];
  if (tableIds.length > 0 && (!options?.tableId || !tableIds.includes(options.tableId))) {
    return false;
  }
  return true;
}

export function selectVisibleMenuLists(
  menuLists: AdminMenuList[],
  options?: { now?: Date; tableId?: string | null; channel?: MenuOrderChannel },
): AdminMenuList[] {
  return selectMenuListsOrdered({ menuLists } as Pick<MenuState, "menuLists">).filter((list) =>
    isMenuListVisible(list, options),
  );
}

export function selectItemById(
  items: AdminMenuItem[],
  id: string,
): AdminMenuItem | undefined {
  return items.find((i) => i.id === id);
}

export function selectActiveSession(
  sessions: TableSession[],
  tableId: string,
): TableSession | undefined {
  return sessions.find((s) => s.tableId === tableId && s.status === "aperta");
}

export function selectSessionByCode(
  sessions: TableSession[],
  code: string,
): TableSession | undefined {
  return sessions.find((s) => s.code === code && s.status === "aperta");
}

export function selectOrdersBySession(
  orders: Order[],
  sessionId: string,
): Order[] {
  return orders.filter((o) => o.sessionId === sessionId);
}
