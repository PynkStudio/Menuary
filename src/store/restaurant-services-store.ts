"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserLocalJSONStorage } from "@/lib/zustand-json-storage";

const LEGACY_STORAGE_KEY = "bepork-restaurant-services-v1";
const STORAGE_KEY_PREFIX = "menuary-restaurant-services-v1";
const FALLBACK_STORAGE_KEY = `${STORAGE_KEY_PREFIX}:unscoped`;
const DEFAULT_TENANT_ID = "junior-food";

let activeRestaurantServicesTenantId: string | null = null;

export function restaurantServicesStorageKey(tenantId: string): string {
  return `${STORAGE_KEY_PREFIX}:${tenantId}`;
}

function migrateLegacyRestaurantServicesStorage(tenantId: string, nextKey: string) {
  if (typeof window === "undefined" || tenantId !== "bepork") return;
  try {
    if (window.localStorage.getItem(nextKey)) return;
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) window.localStorage.setItem(nextKey, legacy);
  } catch {}
}

export type ReservationStatus =
  | "nuova"
  | "confermata"
  | "seduta"
  | "no_show"
  | "pending_manual"
  | "auto_proposed"
  | "rejected"
  | "draft";
export type RoomTableStatus = "libero" | "prenotato" | "occupato" | "pagamento" | "pulizia";
export type DeliveryChannelStatus = "attivo" | "pausa" | "chiuso";
export type InventoryStatus = "ok" | "basso" | "critico";
export type OrderKioskStatus = "online" | "pausa" | "offline";

export type Reservation = {
  id: string;
  customer: string;
  phone: string;
  covers: number;
  date: string;
  time: string;
  tableLabel?: string;
  notes?: string;
  status: ReservationStatus;
};

export type RoomTable = {
  id: string;
  label: string;
  area: string;
  seats: number;
  status: RoomTableStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  mergeGroupId?: string;
};

export type ProductAvailabilityRule = {
  id: string;
  itemName: string;
  remaining?: number;
  visible: boolean;
  reason: string;
};

export type UpsellRule = {
  id: string;
  trigger: string;
  suggestion: string;
  lift: string;
  active: boolean;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  visits: number;
  lastOrder: string;
  tags: string[];
  coupon?: string;
};

export type TakeawaySlot = {
  id: string;
  time: string;
  capacity: number;
  booked: number;
  paused: boolean;
};

export type OrderKiosk = {
  id: string;
  name: string;
  area: string;
  status: OrderKioskStatus;
  ordersToday: number;
  lastSeen: string;
};

export type DeliveryChannel = {
  id: string;
  name: string;
  status: DeliveryChannelStatus;
  ordersToday: number;
  commissionNote: string;
};

export type InventoryIngredient = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  threshold: number;
  foodCost: string;
  status: InventoryStatus;
  linkedItems: string[];
};

export type PrintStation = {
  id: string;
  name: string;
  area: string;
  categories: string[];
  online: boolean;
};

export type StaffRole = {
  id: string;
  name: string;
  role: "Admin" | "Manager" | "Sala" | "Cucina" | "Bar";
  permissions: string[];
  active: boolean;
};

export type LocationProfile = {
  id: string;
  name: string;
  address: string;
  activeMenus: string[];
  revenueToday: number;
  openOrders: number;
};

export type ServiceAnalytics = {
  label: string;
  value: string;
  delta: string;
};

type RestaurantServicesSnapshot = {
  reservations: Reservation[];
  roomTables: RoomTable[];
  availabilityRules: ProductAvailabilityRule[];
  upsellRules: UpsellRule[];
  customers: CustomerProfile[];
  takeawaySlots: TakeawaySlot[];
  orderKiosks: OrderKiosk[];
  deliveryChannels: DeliveryChannel[];
  inventory: InventoryIngredient[];
  printStations: PrintStation[];
  staffRoles: StaffRole[];
  locations: LocationProfile[];
  analytics: ServiceAnalytics[];
};

type RestaurantServicesState = RestaurantServicesSnapshot & {
  currentTenantId: string;
  setTenantSeed: (tenantId: string) => void;
  addReservation: (reservation: Omit<Reservation, "id" | "status"> & { id?: string; status?: ReservationStatus }) => void;
  updateReservation: (id: string, patch: Partial<Reservation>) => void;
  updateReservationStatus: (id: string, status: ReservationStatus) => void;
  removeReservation: (id: string) => void;
  replaceReservations: (list: Reservation[]) => void;
  addRoomTable: (table: Omit<RoomTable, "id">) => void;
  updateRoomTable: (id: string, patch: Partial<RoomTable>) => void;
  updateRoomTableStatus: (id: string, status: RoomTableStatus) => void;
  removeRoomTable: (id: string) => void;
  mergeRoomTables: (ids: string[]) => void;
  unmergeRoomTable: (id: string) => void;
  toggleAvailabilityRule: (id: string) => void;
  toggleUpsellRule: (id: string) => void;
  toggleTakeawaySlot: (id: string) => void;
  addOrderKiosk: (name: string, area: string) => void;
  updateOrderKioskStatus: (id: string, status: OrderKioskStatus) => void;
  removeOrderKiosk: (id: string) => void;
  updateDeliveryChannelStatus: (id: string, status: DeliveryChannelStatus) => void;
  togglePrintStation: (id: string) => void;
  toggleStaffRole: (id: string) => void;
  resetToSeed: () => void;
};

function beporkSeed(): RestaurantServicesSnapshot {
  return {
    reservations: [
      {
        id: "res-1",
        customer: "Marco Lorusso",
        phone: "+39 333 782 4410",
        covers: 4,
        date: "oggi",
        time: "20:30",
        tableLabel: "Tavolo 4",
        notes: "Compleanno, preferisce interno",
        status: "confermata",
      },
      {
        id: "res-2",
        customer: "Giulia R.",
        phone: "+39 349 118 0922",
        covers: 2,
        date: "oggi",
        time: "21:15",
        tableLabel: "Piano bar 2",
        notes: "Senza glutine",
        status: "nuova",
      },
      {
        id: "res-3",
        customer: "Azienda Edil Sud",
        phone: "+39 080 554 2211",
        covers: 8,
        date: "sabato",
        time: "22:00",
        notes: "Menu fisso e taglieri",
        status: "confermata",
      },
    ],
    roomTables: [
      { id: "rt-1", label: "T1", area: "Sala ristorante", seats: 2, status: "occupato", x: 12, y: 18, width: 13, height: 16 },
      { id: "rt-2", label: "T2", area: "Sala ristorante", seats: 4, status: "prenotato", x: 34, y: 18, width: 17, height: 18 },
      { id: "rt-3", label: "T3", area: "Sala ristorante", seats: 4, status: "pagamento", x: 62, y: 20, width: 17, height: 18 },
      { id: "rt-4", label: "T4", area: "Sala ristorante", seats: 2, status: "libero", x: 18, y: 56, width: 13, height: 16 },
      { id: "rt-5", label: "T5", area: "Sala ristorante", seats: 4, status: "pulizia", x: 48, y: 56, width: 17, height: 18 },
      { id: "rt-6", label: "T6", area: "Sala ristorante", seats: 6, status: "occupato", x: 72, y: 56, width: 20, height: 18 },
      { id: "rt-7", label: "S2-1", area: "Sala due", seats: 4, status: "libero", x: 18, y: 18, width: 17, height: 18 },
      { id: "rt-8", label: "S2-2", area: "Sala due", seats: 2, status: "libero", x: 48, y: 18, width: 13, height: 16 },
      { id: "rt-9", label: "S2-3", area: "Sala due", seats: 4, status: "prenotato", x: 70, y: 52, width: 17, height: 18 },
      { id: "rt-10", label: "D1", area: "Dehor", seats: 4, status: "occupato", x: 15, y: 20, width: 17, height: 18 },
      { id: "rt-11", label: "D2", area: "Dehor", seats: 2, status: "libero", x: 42, y: 24, width: 13, height: 16 },
      { id: "rt-12", label: "D3", area: "Dehor", seats: 6, status: "prenotato", x: 67, y: 50, width: 20, height: 18 },
    ],
    availabilityRules: [
      { id: "av-1", itemName: "Antipasto della casa", remaining: 5, visible: true, reason: "Porzioni limitate" },
      { id: "av-2", itemName: "Multigusto Pistacchio", remaining: 2, visible: true, reason: "Impasto speciale quasi finito" },
      { id: "av-3", itemName: "Burrata fuori menu", remaining: 0, visible: false, reason: "Ingrediente esaurito" },
    ],
    upsellRules: [
      { id: "up-1", trigger: "Burger nel carrello", suggestion: "Aggiungi patatine e salsa bacon", lift: "+3,50 EUR medio", active: true },
      { id: "up-2", trigger: "Pizza singola", suggestion: "Proponi birra artigianale", lift: "+5,00 EUR medio", active: true },
      { id: "up-3", trigger: "Ordine oltre 35 EUR", suggestion: "Dolce della casa", lift: "+6,00 EUR medio", active: false },
    ],
    customers: [
      { id: "cu-1", name: "Marco Lorusso", phone: "+39 333 782 4410", visits: 9, lastOrder: "Ribs, birra, cheesecake", tags: ["VIP", "sala"], coupon: "RITORNO10" },
      { id: "cu-2", name: "Giulia R.", phone: "+39 349 118 0922", visits: 3, lastOrder: "Pizza senza glutine", tags: ["allergeni", "take away"] },
      { id: "cu-3", name: "Andrea P.", phone: "+39 347 902 1128", visits: 5, lastOrder: "Menu combo burger", tags: ["piano bar"], coupon: "BIRRAOMAGGIO" },
    ],
    takeawaySlots: [
      { id: "ts-1", time: "19:30", capacity: 6, booked: 4, paused: false },
      { id: "ts-2", time: "19:45", capacity: 6, booked: 6, paused: true },
      { id: "ts-3", time: "20:00", capacity: 8, booked: 5, paused: false },
      { id: "ts-4", time: "20:15", capacity: 8, booked: 2, paused: false },
    ],
    orderKiosks: [
      { id: "ko-1", name: "Kiosk ingresso", area: "Ingresso", status: "online", ordersToday: 18, lastSeen: "2 min fa" },
      { id: "ko-2", name: "Kiosk piano bar", area: "Piano bar", status: "pausa", ordersToday: 6, lastSeen: "18 min fa" },
      { id: "ko-3", name: "Kiosk dehors", area: "Dehors", status: "offline", ordersToday: 0, lastSeen: "ieri" },
    ],
    deliveryChannels: [
      { id: "dc-1", name: "Ordini diretti sito", status: "attivo", ordersToday: 12, commissionNote: "0% commissioni marketplace" },
      { id: "dc-2", name: "Glovo", status: "pausa", ordersToday: 4, commissionNote: "Canale da centralizzare" },
      { id: "dc-3", name: "Telefono staff", status: "attivo", ordersToday: 7, commissionNote: "Inserimento manuale" },
    ],
    inventory: [
      { id: "in-1", name: "Pulled pork", unit: "kg", stock: 4.5, threshold: 3, foodCost: "28%", status: "ok", linkedItems: ["Nachos", "Burger pulled"] },
      { id: "in-2", name: "Pistacchio", unit: "kg", stock: 0.8, threshold: 1, foodCost: "34%", status: "basso", linkedItems: ["Multigusto Pistacchio"] },
      { id: "in-3", name: "Burrata", unit: "pz", stock: 0, threshold: 6, foodCost: "31%", status: "critico", linkedItems: ["Fuori menu burrata"] },
    ],
    printStations: [
      { id: "ps-1", name: "Cucina calda", area: "Cucina", categories: ["Antipasti", "Burger", "Carne"], online: true },
      { id: "ps-2", name: "Pizzeria", area: "Forno", categories: ["Pizze", "Focacce"], online: true },
      { id: "ps-3", name: "Bar", area: "Piano bar", categories: ["Bevande", "Dolci"], online: false },
    ],
    staffRoles: [
      { id: "sr-1", name: "Michele", role: "Admin", permissions: ["menu", "ordini", "staff", "report"], active: true },
      { id: "sr-2", name: "Anna", role: "Sala", permissions: ["tavoli", "prenotazioni", "ordini"], active: true },
      { id: "sr-3", name: "Brigata cucina", role: "Cucina", permissions: ["kitchen display", "ristampe"], active: true },
      { id: "sr-4", name: "Bar piano", role: "Bar", permissions: ["ordini bar", "piano bar"], active: false },
    ],
    locations: [
      { id: "lo-1", name: "ThePork Demo", address: "Via Demo, 1", activeMenus: ["Menu sera", "Menu weekend", "Piano bar"], revenueToday: 1840, openOrders: 9 },
      { id: "lo-2", name: "ThePork Pop-up", address: "Evento demo", activeMenus: ["Menu ridotto", "Delivery diretto"], revenueToday: 420, openOrders: 3 },
    ],
    analytics: [
      { label: "Scontrino medio", value: "28,40 EUR", delta: "+8% vs settimana scorsa" },
      { label: "Piatto top", value: "Ribs", delta: "34 vendite oggi" },
      { label: "Tempo cucina", value: "13 min", delta: "-2 min dopo KDS" },
      { label: "Slot saturo", value: "19:45", delta: "6/6 ordini asporto" },
    ],
  };
}

function faakSeed(): RestaurantServicesSnapshot {
  const seed = beporkSeed();
  return {
    ...seed,
    reservations: [
      { id: "fr-1", customer: "Viviana guest list", phone: "+39 333 000 1122", covers: 6, date: "oggi", time: "21:00", tableLabel: "Tavolo vino", notes: "Degustazione naturale", status: "confermata" },
      { id: "fr-2", customer: "Colazione studio", phone: "+39 349 777 0001", covers: 3, date: "domani", time: "09:30", notes: "Menu mattina", status: "nuova" },
    ],
    orderKiosks: [
      { id: "fk-1", name: "Kiosk banco", area: "Banco", status: "online", ordersToday: 9, lastSeen: "1 min fa" },
      { id: "fk-2", name: "Kiosk aperitivo", area: "Sala aperitivo", status: "online", ordersToday: 14, lastSeen: "4 min fa" },
    ],
    locations: [
      { id: "fl-1", name: "FAAK", address: "Demo Menuary", activeMenus: ["Mattina", "Giorno", "Aperitivo", "Sera"], revenueToday: 980, openOrders: 4 },
    ],
    analytics: [
      { label: "Fascia migliore", value: "18:00-20:00", delta: "Aperitivo +22%" },
      { label: "Piatto top", value: "Calice naturale", delta: "41 vendite oggi" },
      { label: "Scontrino medio", value: "24,10 EUR", delta: "+5% vs ieri" },
      { label: "Prenotazioni", value: "11", delta: "7 confermate" },
    ],
  };
}

function buildInitial(tenantId = DEFAULT_TENANT_ID): RestaurantServicesSnapshot & {
  currentTenantId: string;
} {
  return {
    currentTenantId: tenantId,
    ...(tenantId === "bepork" ? beporkSeed() : faakSeed()),
  };
}

function normalizeRoomTables(tables: RoomTable[] | undefined, fallback: RoomTable[]): RoomTable[] {
  const source = tables && tables.length > 0 ? tables : fallback;
  return source.map((table, index) => ({
    ...table,
    x: Number.isFinite(table.x) ? table.x : 10 + (index % 4) * 20,
    y: Number.isFinite(table.y) ? table.y : 15 + Math.floor(index / 4) * 24,
    width: Number.isFinite(table.width) ? table.width : table.seats > 4 ? 20 : table.seats > 2 ? 17 : 13,
    height: Number.isFinite(table.height) ? table.height : 16,
  }));
}

export const useRestaurantServicesStore = create<RestaurantServicesState>()(
  persist(
    (set) => ({
      ...buildInitial(),
      setTenantSeed: (tenantId) =>
        set((state) =>
          state.currentTenantId === tenantId ? state : buildInitial(tenantId),
        ),
      addReservation: (reservation) =>
        set((state) => ({
          reservations: [
            {
              ...reservation,
              id:
                reservation.id ??
                `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              status: reservation.status ?? "nuova",
            },
            ...state.reservations,
          ],
        })),
      updateReservation: (id, patch) =>
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === id ? { ...reservation, ...patch } : reservation,
          ),
        })),
      updateReservationStatus: (id, status) =>
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === id ? { ...reservation, status } : reservation,
          ),
        })),
      removeReservation: (id) =>
        set((state) => ({
          reservations: state.reservations.filter((reservation) => reservation.id !== id),
        })),
      replaceReservations: (list) => set({ reservations: list }),
      addRoomTable: (table) =>
        set((state) => ({
          roomTables: [
            ...state.roomTables,
            {
              ...table,
              id: `rt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            },
          ],
        })),
      updateRoomTable: (id, patch) =>
        set((state) => ({
          roomTables: state.roomTables.map((table) =>
            table.id === id
              ? { ...table, ...patch }
              : patch.status && table.mergeGroupId && table.mergeGroupId === state.roomTables.find((item) => item.id === id)?.mergeGroupId
                ? { ...table, status: patch.status }
                : table,
          ),
        })),
      updateRoomTableStatus: (id, status) =>
        set((state) => {
          const source = state.roomTables.find((table) => table.id === id);
          return {
            roomTables: state.roomTables.map((table) =>
              table.id === id ||
              (source?.mergeGroupId && table.mergeGroupId === source.mergeGroupId)
                ? { ...table, status }
                : table,
            ),
          };
        }),
      removeRoomTable: (id) =>
        set((state) => ({
          roomTables: state.roomTables.filter((table) => table.id !== id),
        })),
      mergeRoomTables: (ids) =>
        set((state) => {
          const cleanIds = ids.filter(Boolean);
          if (cleanIds.length < 2) return {};
          const first = state.roomTables.find((table) => table.id === cleanIds[0]);
          const mergeGroupId = `grp-${Date.now().toString(36)}`;
          return {
            roomTables: state.roomTables.map((table) =>
              cleanIds.includes(table.id)
                ? { ...table, mergeGroupId, status: first?.status ?? table.status }
                : table,
            ),
          };
        }),
      unmergeRoomTable: (id) =>
        set((state) => {
          const table = state.roomTables.find((item) => item.id === id);
          if (!table?.mergeGroupId) return {};
          return {
            roomTables: state.roomTables.map((item) =>
              item.mergeGroupId === table.mergeGroupId
                ? { ...item, mergeGroupId: undefined }
                : item,
            ),
          };
        }),
      toggleAvailabilityRule: (id) =>
        set((state) => ({
          availabilityRules: state.availabilityRules.map((rule) =>
            rule.id === id ? { ...rule, visible: !rule.visible } : rule,
          ),
        })),
      toggleUpsellRule: (id) =>
        set((state) => ({
          upsellRules: state.upsellRules.map((rule) =>
            rule.id === id ? { ...rule, active: !rule.active } : rule,
          ),
        })),
      toggleTakeawaySlot: (id) =>
        set((state) => ({
          takeawaySlots: state.takeawaySlots.map((slot) =>
            slot.id === id ? { ...slot, paused: !slot.paused } : slot,
          ),
        })),
      addOrderKiosk: (name, area) =>
        set((state) => {
          const id = `ko-${Date.now().toString(36)}`;
          return {
            orderKiosks: [
              ...state.orderKiosks,
              {
                id,
                name,
                area,
                status: "online",
                ordersToday: 0,
                lastSeen: "appena creato",
              },
            ],
          };
        }),
      updateOrderKioskStatus: (id, status) =>
        set((state) => ({
          orderKiosks: state.orderKiosks.map((kiosk) =>
            kiosk.id === id
              ? {
                  ...kiosk,
                  status,
                  lastSeen: status === "online" ? "adesso" : kiosk.lastSeen,
                }
              : kiosk,
          ),
        })),
      removeOrderKiosk: (id) =>
        set((state) => ({
          orderKiosks: state.orderKiosks.filter((kiosk) => kiosk.id !== id),
        })),
      updateDeliveryChannelStatus: (id, status) =>
        set((state) => ({
          deliveryChannels: state.deliveryChannels.map((channel) =>
            channel.id === id ? { ...channel, status } : channel,
          ),
        })),
      togglePrintStation: (id) =>
        set((state) => ({
          printStations: state.printStations.map((station) =>
            station.id === id ? { ...station, online: !station.online } : station,
          ),
        })),
      toggleStaffRole: (id) =>
        set((state) => ({
          staffRoles: state.staffRoles.map((role) =>
            role.id === id ? { ...role, active: !role.active } : role,
          ),
        })),
      resetToSeed: () =>
        set((state) => buildInitial(state.currentTenantId || DEFAULT_TENANT_ID)),
    }),
    {
      name: FALLBACK_STORAGE_KEY,
      skipHydration: true,
      storage: createBrowserLocalJSONStorage(),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<RestaurantServicesState>;
        const seed = buildInitial(p.currentTenantId ?? current.currentTenantId);
        return {
          ...current,
          ...seed,
          ...p,
          roomTables: normalizeRoomTables(p.roomTables, seed.roomTables),
          orderKiosks: p.orderKiosks ?? seed.orderKiosks,
        } as RestaurantServicesState;
      },
    },
  ),
);

export function getActiveRestaurantServicesTenantId(): string | null {
  return activeRestaurantServicesTenantId;
}

export async function activateRestaurantServicesTenantStorage(tenantId: string) {
  const nextKey = restaurantServicesStorageKey(tenantId);
  if (
    activeRestaurantServicesTenantId === tenantId &&
    useRestaurantServicesStore.persist.getOptions().name === nextKey
  ) {
    return;
  }
  migrateLegacyRestaurantServicesStorage(tenantId, nextKey);
  activeRestaurantServicesTenantId = tenantId;
  useRestaurantServicesStore.persist.setOptions({ name: nextKey });
  useRestaurantServicesStore.setState(buildInitial(tenantId));
  await useRestaurantServicesStore.persist.rehydrate();
}
