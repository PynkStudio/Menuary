"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserLocalJSONStorage } from "@/lib/zustand-json-storage";
import { getSeedMenuForTenant } from "@/lib/tenant-menu-data";
import type { MenuCategory } from "@/lib/menu-data";
import {
  type ExtraList,
  DEFAULT_EXTRA_LISTS,
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
  Order,
  OrderStatus,
  PriceFormat,
  MenuTag,
  Table,
  TableSession,
} from "@/lib/types";
import type { MenuIngredient } from "@/lib/ingredients";

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
        description: "Pane, dolci e caffè disponibili in bottega.",
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
  menuLists: AdminMenuList[];
  /** Liste aggiunte condivise: modificate una volta, tutti i piatti collegati le vedono. */
  extraLists: ExtraList[];
  orders: Order[];
  lastOrderSeq: number;

  tables: Table[];
  sessions: TableSession[];

  updateItem: (id: string, patch: Partial<AdminMenuItem>) => void;
  setAvailable: (id: string, available: boolean) => void;
  updatePrice: (id: string, price: PriceFormat) => void;
  updateIngredients: (id: string, ingredients: MenuIngredient[]) => void;
  updateExtras: (id: string, extras: Extra[]) => void;
  updateImage: (id: string, image: string | undefined) => void;
  updateTags: (id: string, tags: MenuTag[]) => void;
  addExtraList: (name: string) => string;
  updateExtraList: (id: string, list: ExtraList) => void;
  removeExtraList: (id: string) => void;
  applyExtraListToItemIds: (listId: string, itemIds: string[]) => void;
  addItem: (categoryId: string, draft: Partial<AdminMenuItem>) => string;
  removeItem: (id: string) => void;
  addMenuList: (draft?: Partial<AdminMenuList>) => string;
  updateMenuList: (id: string, patch: Partial<AdminMenuList>) => void;
  removeMenuList: (id: string) => void;
  toggleMenuListItem: (menuListId: string, itemId: string) => void;

  addOrder: (o: Omit<Order, "id" | "createdAt" | "status" | "code">) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
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
    menuLists: seedMenuLists(tenantId, categories, items),
    extraLists: mergeExtraListsWithDefaults(undefined, DEFAULT_EXTRA_LISTS),
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

      removeItem: (id) =>
        set((s) => ({
          items: s.items.filter((it) => it.id !== id),
          menuLists: s.menuLists.map((list) => ({
            ...list,
            itemIds: list.itemIds.filter((itemId) => itemId !== id),
          })),
        })),

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
        categories: s.categories,
        currentTenantId: s.currentTenantId,
        items: s.items,
        menuLists: s.menuLists,
        extraLists: s.extraLists,
        orders: s.orders,
        lastOrderSeq: s.lastOrderSeq,
        tables: s.tables,
        sessions: s.sessions,
      }),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== "object") return current;
        const p = persisted as Partial<MenuState>;
        const currentTenantId = p.currentTenantId ?? current.currentTenantId;
        const items = p.items?.map(migrateItemIngredients) ?? current.items;
        const categories = p.categories ?? current.categories;
        const menuLists =
          p.menuLists && p.menuLists.length > 0
            ? p.menuLists.map((list) => ({
                ...list,
                enabled: list.enabled ?? true,
                itemIds: list.itemIds ?? [],
                visibility: list.visibility ?? {},
              }))
            : seedMenuLists(currentTenantId, categories, items);
        const extraLists = mergeExtraListsWithDefaults(
          p.extraLists as ExtraList[] | undefined,
          DEFAULT_EXTRA_LISTS,
        );
        return { ...current, ...p, currentTenantId, items, menuLists, extraLists };
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
  options?: { now?: Date; tableId?: string | null },
): boolean {
  if (!menuList.enabled) return false;
  const now = options?.now ?? new Date();
  const visibility = menuList.visibility ?? {};
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
  options?: { now?: Date; tableId?: string | null },
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
