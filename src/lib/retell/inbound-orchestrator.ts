import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findTenantById } from "@/lib/tenant-registry";
import { defaultHoursWeekForTenant, type DaySchedule } from "@/lib/venue-hours";
import { formatEuro } from "@/lib/price-utils";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/lib/supabase/types";
import { getAiPhoneSettings, isAiPhoneControlAccepting, type AiPhoneSettings } from "@/lib/retell/settings";
import { createChannelPaymentRequest, type ChannelPaymentRequest, type PaymentLinkChannel } from "@/lib/payments/channel-payment-links";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import { suggestTableForReservation, type ReservationSlot, type TableForPlanner } from "@/lib/reservations/engine";
import { recordCustomerEvent, resolveCustomerIdentity } from "@/lib/crm/customer-identity";
import type { MenuOrderChannel } from "@/lib/types";

type Db = SupabaseClient<Database>;

type LocationContext = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
  weeklyHours: DaySchedule[];
  specialHours: {
    date: string;
    closed: boolean;
    slots: string[];
    label: string | null;
  }[];
};

type RetellMenuItemContext = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  available: boolean;
  bookable: boolean;
  durationMinutes: number | null;
  price: string;
  priceOptions: {
    code: string;
    label: string;
    price: string;
  }[];
  tags: string[];
  allergens: string[];
  modifications: {
    id: string;
    name: string;
    price: string;
    source: "inline" | "list";
  }[];
};

type MenuListVisibility = {
  days?: number[];
  startTime?: string;
  endTime?: string;
  tableIds?: string[];
  channels?: MenuOrderChannel[];
};

type MenuListRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  enabled: boolean;
  visibility: Json;
};

type MenuListItemRow = {
  list_id: string;
  item_id: string;
};

type MenuCategoryAvailability = {
  label: string;
  days?: number[];
  from: string;
  to: string;
};

export type RetellInboundContext = {
  tenant: {
    id: string;
    name: string;
    vertical: string;
    enabled: boolean;
    aiPhoneEnabled: boolean;
    aiWhatsappEnabled: boolean;
    channelEnabled: boolean;
  };
  locale: string;
  generatedAt: string;
  capabilities: {
    canAnswerQuestions: boolean;
    canCreateTakeawayOrders: boolean;
    canCreateDeliveryOrders: boolean;
    canCreateReservations: boolean;
    canCreateAppointments: boolean;
    canRequestPaymentLinks: boolean;
  };
  assistantSettings: Pick<
    AiPhoneSettings,
    | "phoneNumber"
    | "greetingMessage"
    | "systemPrompt"
    | "handoffPhone"
    | "language"
    | "humanTransferEnabled"
    | "confirmBeforeWrite"
    | "afterHoursMode"
    | "quickSettings"
    | "paymentControls"
  >;
  locations: LocationContext[];
  menu: {
    timezone: string;
    activeLists: {
      code: string;
      name: string;
      description: string | null;
    }[];
    categories: {
      id: string;
      code: string;
      title: string;
      description: string | null;
      items: RetellMenuItemContext[];
    }[];
  };
  retellInstructions: string[];
};

export type CreateRetellReservationInput = {
  tenantId: string;
  locationId?: string | null;
  source?: "retell" | "whatsapp";
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  covers?: number;
  serviceCode?: string | null;
  notes?: string | null;
};

export type CreateRetellOrderInput = {
  tenantId: string;
  locationId?: string | null;
  source?: "retell" | "whatsapp";
  customerName?: string | null;
  customerPhone?: string | null;
  pickupTime?: string | null;
  desiredTime?: string | null;
  notes?: string | null;
  fulfillmentType?: "takeaway" | "delivery";
  delivery?: {
    address: string;
    doorbell?: string | null;
    floor?: string | null;
    notes?: string | null;
  } | null;
  requestPayment?: boolean;
  paymentChannel?: PaymentLinkChannel;
  /**
   * Scelta del cliente raccolta dall'agente AI sulla modalità di pagamento.
   * - "online"  → riceve link con riepilogo + pulsante Paga
   * - "on_site" → riceve link col solo riepilogo, pagamento al ritiro/consegna
   * Se omesso, si applica la policy tenant (paymentControls.acceptedMethods) +
   * fallback ai flag requireFor* per retrocompatibilità.
   */
  paymentMethodChoice?: "online" | "on_site";
  lines: {
    itemCode: string;
    quantity: number;
    priceOption?: string | null;
    note?: string | null;
    addedExtraCodes?: string[];
    removedIngredients?: string[];
  }[];
};

export type RetellAvailabilityInput = {
  tenantId: string;
  locationId?: string | null;
  date: string;
  covers?: number;
  serviceCode?: string | null;
};

type LocationRow = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  is_default: boolean;
  hours?: unknown;
};

type CategoryRow = Database["public"]["Tables"]["menu_categories"]["Row"];
type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];
type ExtraListRow = Database["public"]["Tables"]["extra_lists"]["Row"];
type ExtraListItemRow = Database["public"]["Tables"]["extra_list_items"]["Row"];
type ItemExtraRow = ExtraListItemRow & { item_id: string };

const MENU_TIMEZONE = "Europe/Rome";

function svc(): Db {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client;
}

function isDayScheduleArray(value: unknown): value is DaySchedule[] {
  return Array.isArray(value) && value.every((day) => {
    if (!day || typeof day !== "object") return false;
    const row = day as Record<string, unknown>;
    return typeof row.label === "string" && typeof row.closed === "boolean" && Array.isArray(row.slots);
  });
}

function formatPrice(price: Json): string {
  if (typeof price === "number") return formatEuro(price);
  if (typeof price === "string") return price;
  if (!price || Array.isArray(price) || typeof price !== "object") return "Prezzo da confermare";

  const p = price as Record<string, Json | undefined>;
  if (p.kind === "single" && typeof p.value === "number") return formatEuro(p.value);
  if (p.kind === "sized" && typeof p.small === "number" && typeof p.big === "number") {
    return `Small ${formatEuro(p.small)}, Big ${formatEuro(p.big)}`;
  }
  if (p.kind === "persone" && typeof p.per2 === "number" && typeof p.per4 === "number") {
    return `2 persone ${formatEuro(p.per2)}, 4 persone ${formatEuro(p.per4)}`;
  }
  if (p.kind === "volume" && p.small && p.large) {
    const small = p.small as Record<string, Json | undefined>;
    const large = p.large as Record<string, Json | undefined>;
    if (typeof small.label === "string" && typeof small.price === "number" && typeof large.label === "string" && typeof large.price === "number") {
      return `${small.label} ${formatEuro(small.price)}, ${large.label} ${formatEuro(large.price)}`;
    }
  }
  return "Prezzo da confermare";
}

function listPriceOptions(price: Json): { code: string; label: string; value: number }[] {
  if (typeof price === "number") return [{ code: "standard", label: "Standard", value: price }];
  if (!price || Array.isArray(price) || typeof price !== "object") return [];
  const p = price as Record<string, Json | undefined>;
  if (p.kind === "single" && typeof p.value === "number") {
    return [{ code: "standard", label: "Standard", value: p.value }];
  }
  if (p.kind === "sized" && typeof p.small === "number" && typeof p.big === "number") {
    return [
      { code: "small", label: "Small", value: p.small },
      { code: "big", label: "Big", value: p.big },
    ];
  }
  if (p.kind === "persone" && typeof p.per2 === "number" && typeof p.per4 === "number") {
    return [
      { code: "per2", label: "2 persone", value: p.per2 },
      { code: "per4", label: "4 persone", value: p.per4 },
    ];
  }
  if (p.kind === "volume" && p.small && p.large) {
    const small = p.small as Record<string, Json | undefined>;
    const large = p.large as Record<string, Json | undefined>;
    if (typeof small.label === "string" && typeof small.price === "number" && typeof large.label === "string" && typeof large.price === "number") {
      return [
        { code: "small", label: small.label, value: small.price },
        { code: "large", label: large.label, value: large.price },
      ];
    }
  }
  return [];
}

function resolveNumericPrice(itemCode: string, price: Json, selectedOption?: string | null): number {
  const options = listPriceOptions(price);
  if (options.length === 0) throw new Error(`price_to_confirm:${itemCode}`);
  if (options.length === 1) return options[0].value;

  const selected = selectedOption?.trim().toLocaleLowerCase("it-IT");
  const option = options.find((candidate) => candidate.code.toLocaleLowerCase("it-IT") === selected);
  if (!option) {
    throw new Error(`price_option_required:${itemCode}:${options.map((candidate) => candidate.code).join(",")}`);
  }
  return option.value;
}

function money(value: number): string {
  return value === 0 ? "incluso" : formatEuro(value);
}

function buildItemModifications(
  item: MenuItemRow,
  inlineExtras: Map<string, ItemExtraRow[]>,
  extraListsById: Map<string, ExtraListRow>,
  listItemsByListId: Map<string, ExtraListItemRow[]>,
) {
  const inline = (inlineExtras.get(item.id) ?? []).map((extra) => ({
    id: extra.code,
    name: extra.name,
    price: money(Number(extra.price)),
    source: "inline" as const,
  }));
  const list = item.extra_list_id
    ? (listItemsByListId.get(item.extra_list_id) ?? []).map((extra) => ({
        id: `${extraListsById.get(item.extra_list_id!)?.code ?? "lista"}:${extra.code}`,
        name: extra.name,
        price: money(Number(extra.price)),
        source: "list" as const,
      }))
    : [];
  return [...inline, ...list];
}

function resolveAddedExtras(
  item: Pick<MenuItemRow, "id" | "extra_list_id">,
  codes: string[],
  inlineExtras: Map<string, ItemExtraRow[]>,
  listItemsByListId: Map<string, ExtraListItemRow[]>,
) {
  const inlineByCode = new Map((inlineExtras.get(item.id) ?? []).map((extra) => [extra.code, extra]));
  const listByCode = new Map((item.extra_list_id ? listItemsByListId.get(item.extra_list_id) ?? [] : []).map((extra) => [extra.code, extra]));
  return codes.map((rawCode) => {
    const code = rawCode.includes(":") ? rawCode.split(":").pop()! : rawCode;
    const extra = inlineByCode.get(code) ?? listByCode.get(code);
    if (!extra) throw new Error(`missing_extra:${rawCode}`);
    return { id: rawCode, name: extra.name, price: Number(extra.price) };
  });
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function localMenuTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MENU_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  const weekday = byType.get("weekday") ?? "";
  const dayByLabel: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    day: dayByLabel[weekday] ?? now.getDay(),
    minutes: Number(byType.get("hour") ?? "0") * 60 + Number(byType.get("minute") ?? "0"),
  };
}

function timeToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function isTimeInWindow(current: number, start: unknown, end: unknown): boolean {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes == null && endMinutes == null) return true;
  if (startMinutes != null && endMinutes == null) return current >= startMinutes;
  if (startMinutes == null && endMinutes != null) return current <= endMinutes;
  if (startMinutes == null || endMinutes == null) return true;
  return startMinutes <= endMinutes
    ? current >= startMinutes && current <= endMinutes
    : current >= startMinutes || current <= endMinutes;
}

function normalizeVisibility(value: unknown): MenuListVisibility {
  const raw = asObject(value);
  const validChannels = new Set<MenuOrderChannel>(["phone", "whatsapp", "online", "table"]);
  return {
    days: Array.isArray(raw.days) ? raw.days.filter((day): day is number => typeof day === "number") : undefined,
    startTime: typeof raw.startTime === "string" ? raw.startTime : undefined,
    endTime: typeof raw.endTime === "string" ? raw.endTime : undefined,
    tableIds: Array.isArray(raw.tableIds) ? raw.tableIds.filter((id): id is string => typeof id === "string") : undefined,
    channels: Array.isArray(raw.channels)
      ? raw.channels.filter((channel): channel is MenuOrderChannel =>
          typeof channel === "string" && validChannels.has(channel as MenuOrderChannel),
        )
      : undefined,
  };
}

function isMenuListVisible(list: MenuListRow, channel: MenuOrderChannel, now = new Date()): boolean {
  if (!list.enabled) return false;
  const local = localMenuTime(now);
  const visibility = normalizeVisibility(list.visibility);
  if (visibility.channels && !visibility.channels.includes(channel)) return false;
  if (visibility.days?.length && !visibility.days.includes(local.day)) return false;
  if (!isTimeInWindow(local.minutes, visibility.startTime, visibility.endTime)) return false;
  // Conversational channels handle off-premise orders: table-only lists are not relevant.
  return channel === "table" || !visibility.tableIds?.length;
}

function hasMenuListRestriction(list: MenuListRow): boolean {
  const visibility = normalizeVisibility(list.visibility);
  return Boolean(visibility.days?.length || visibility.startTime || visibility.endTime || visibility.tableIds?.length || visibility.channels);
}

function normalizeCategoryAvailability(value: unknown): MenuCategoryAvailability | null {
  const raw = asObject(value);
  if (typeof raw.label !== "string" || typeof raw.from !== "string" || typeof raw.to !== "string") return null;
  return {
    label: raw.label,
    from: raw.from,
    to: raw.to,
    days: Array.isArray(raw.days) ? raw.days.filter((day): day is number => typeof day === "number") : undefined,
  };
}

function isCategoryVisible(category: Pick<CategoryRow, "availability">, now = new Date()): boolean {
  const availability = normalizeCategoryAvailability(category.availability);
  if (!availability) return true;
  const local = localMenuTime(now);
  if (availability.days?.length && !availability.days.includes(local.day)) return false;
  return isTimeInWindow(local.minutes, availability.from, availability.to);
}

async function loadActiveMenuLists(db: Db, tenantId: string, channel: MenuOrderChannel, now = new Date()) {
  const listsResult = await (db as unknown as {
    from: (table: "menu_lists") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => Promise<{ data: MenuListRow[] | null; error: { message: string } | null }>;
      };
    };
  }).from("menu_lists").select("id,code,name,description,enabled,visibility").eq("tenant_id", tenantId);
  if (listsResult.error) throw new Error(listsResult.error.message);

  const lists = listsResult.data ?? [];
  const activeLists = lists.filter((list) => isMenuListVisible(list, channel, now));
  const activeRestrictedLists = activeLists.filter(hasMenuListRestriction);
  const listsForItems = activeRestrictedLists.length > 0 ? activeRestrictedLists : activeLists.filter((list) => !hasMenuListRestriction(list));
  const listIds = listsForItems.map((list) => list.id);
  if (listIds.length === 0) {
    return {
      activeLists: listsForItems,
      allowedItemIds: lists.length > 0 ? new Set<string>() : null as Set<string> | null,
    };
  }

  const itemsResult = await (db as unknown as {
    from: (table: "menu_list_items") => {
      select: (columns: string) => {
        in: (column: string, values: string[]) => Promise<{ data: MenuListItemRow[] | null; error: { message: string } | null }>;
      };
    };
  }).from("menu_list_items").select("list_id,item_id").in("list_id", listIds);
  if (itemsResult.error) throw new Error(itemsResult.error.message);
  return {
    activeLists: listsForItems,
    allowedItemIds: new Set((itemsResult.data ?? []).map((item) => item.item_id)),
  };
}

function requireRetellFeature(features: Json, registryEnabled: boolean): boolean {
  if (features && typeof features === "object" && !Array.isArray(features)) {
    const value = (features as Record<string, Json | undefined>).aiPhone;
    if (typeof value === "boolean") return value;
  }
  return registryEnabled;
}

function checkSecret(request: Request, rawBody = ""): boolean {
  const configuredSecret = process.env.RETELL_WEBHOOK_SECRET;
  if (configuredSecret && request.headers.get("x-retell-secret") === configuredSecret) return true;

  const apiKey = process.env.RETELL_API_KEY;
  const signature = request.headers.get("x-retell-signature");
  const signatureMatch = signature?.match(/^v=(\d+),d=([a-fA-F0-9]+)$/);
  if (apiKey && signatureMatch) {
    const [, timestamp, digest] = signatureMatch;
    if (Math.abs(Date.now() - Number(timestamp)) <= 5 * 60 * 1000) {
      const expected = createHmac("sha256", apiKey).update(`${rawBody}${timestamp}`).digest();
      const actual = Buffer.from(digest, "hex");
      if (actual.length === expected.length && timingSafeEqual(actual, expected)) return true;
    }
  }

  return process.env.NODE_ENV !== "production";
}

export function isAuthorizedRetellRequest(request: Request, rawBody = ""): boolean {
  return checkSecret(request, rawBody);
}

function conversationalMenuChannel(channel: "retell" | "whatsapp" | undefined): MenuOrderChannel {
  return channel === "whatsapp" ? "whatsapp" : "phone";
}

export async function buildRetellInboundContext(
  tenantId: string,
  options: { locationId?: string | null; includeUnavailable?: boolean; channel?: "retell" | "whatsapp" } = {},
): Promise<RetellInboundContext> {
  const db = svc();
  const registryTenant = findTenantById(tenantId);
  if (!registryTenant) throw new Error("tenant_not_found");

  const [{ data: tenantRow }, { data: locationRows }, { data: specialRows }] = await Promise.all([
    db.from("tenants").select("id,name,vertical,enabled,features,hours").eq("id", tenantId).maybeSingle(),
    (db as unknown as {
      from: (table: "locations") => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            order: (column: string, opts?: { ascending?: boolean }) => {
              order: (column: string, opts?: { ascending?: boolean }) => Promise<{ data: LocationRow[] | null }>;
            };
          };
        };
      };
    })
      .from("locations")
      .select("id,slug,name,address,city,phone,email,is_default,hours")
      .eq("tenant_id", tenantId)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true }),
    db
      .from("tenant_special_hours")
      .select("id,date,closed,slots,label,location_id")
      .eq("tenant_id", tenantId)
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true }),
  ]);

  const enabled = Boolean(tenantRow?.enabled ?? registryTenant.enabled);
  const aiPhoneEnabled = requireRetellFeature(tenantRow?.features ?? {}, registryTenant.features.aiPhone);
  const aiWhatsappEnabled = requireRetellFeature(tenantRow?.features ?? {}, registryTenant.features.aiWhatsapp);
  const channelEnabled = options.channel === "whatsapp" ? aiWhatsappEnabled : aiPhoneEnabled;
  const aiSettings = await getAiPhoneSettings(tenantId);
  const acceptingOrders = isAiPhoneControlAccepting(aiSettings.quickSettings.acceptNewOrders);
  const acceptingReservations = isAiPhoneControlAccepting(aiSettings.quickSettings.acceptReservations);
  const fallbackHours = isDayScheduleArray(tenantRow?.hours)
    ? tenantRow.hours
    : defaultHoursWeekForTenant(tenantId);
  const selectedLocations = (locationRows ?? []).filter((location) => {
    if (!options.locationId) return true;
    return location.id === options.locationId;
  });
  const locations = (selectedLocations.length ? selectedLocations : locationRows ?? []).map<LocationContext>((location) => {
    const weeklyHours = isDayScheduleArray(location.hours) && location.hours.length > 0
      ? location.hours
      : fallbackHours;
    return {
      id: location.id,
      slug: location.slug,
      name: location.name,
      address: location.address,
      city: location.city ?? null,
      phone: location.phone ?? null,
      email: location.email ?? null,
      isDefault: location.is_default,
      weeklyHours,
      specialHours: aiSettings.includeSpecialHours
        ? (specialRows ?? [])
            .filter((row) => !row.location_id || row.location_id === location.id)
            .map((row) => ({
              date: row.date,
              closed: row.closed,
              slots: (row.slots as string[]) ?? [],
              label: row.label,
            }))
        : [],
    };
  });

  const catsQ = db
    .from("menu_categories")
    .select("id,code,title,description,position,location_id,availability")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  const itemsQ = db
    .from("menu_items")
    .select("id,code,category_id,name,description,price,tags,allergens,available,bookable,duration_minutes,extra_list_id,location_id,position")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (!options.includeUnavailable) itemsQ.eq("available", true);
  if (options.locationId) {
    catsQ.or(`location_id.is.null,location_id.eq.${options.locationId}`);
    itemsQ.or(`location_id.is.null,location_id.eq.${options.locationId}`);
  }

  const [{ data: categories }, { data: items }, { data: itemExtras }, { data: extraLists }, { data: extraListItems }, menuLists] =
    await Promise.all([
      catsQ,
      itemsQ,
      db.from("menu_item_extras").select("item_id,code,name,price,position").order("position", { ascending: true }),
      db.from("extra_lists").select("id,code,name,tenant_id,created_at,updated_at").eq("tenant_id", tenantId),
      db.from("extra_list_items").select("id,list_id,code,name,price,position").order("position", { ascending: true }),
      loadActiveMenuLists(db, tenantId, conversationalMenuChannel(options.channel)),
    ]);

  const visibleItems = ((items ?? []) as MenuItemRow[]).filter((item) =>
    !menuLists.allowedItemIds || menuLists.allowedItemIds.has(item.id),
  );
  const itemsByCategory = groupBy(visibleItems, (item) => item.category_id);
  const inlineExtrasByItem = groupBy((itemExtras ?? []) as unknown as ItemExtraRow[], (extra) => extra.item_id);
  const extraListsById = new Map(((extraLists ?? []) as ExtraListRow[]).map((list) => [list.id, list]));
  const listItemsByListId = groupBy((extraListItems ?? []) as ExtraListItemRow[], (item) => item.list_id);

  return {
    tenant: {
      id: tenantId,
      name: tenantRow?.name ?? registryTenant.name,
      vertical: tenantRow?.vertical ?? registryTenant.vertical,
      enabled,
      aiPhoneEnabled,
      aiWhatsappEnabled,
      channelEnabled,
    },
    locale: "it-IT",
    generatedAt: new Date().toISOString(),
    capabilities: {
      canAnswerQuestions: enabled && channelEnabled && aiSettings.enabled,
      canCreateTakeawayOrders: enabled && channelEnabled && aiSettings.enabled && acceptingOrders && registryTenant.features.takeaway,
      canCreateDeliveryOrders: enabled && channelEnabled && aiSettings.enabled && acceptingOrders && registryTenant.features.deliveryHub,
      canCreateReservations: enabled && channelEnabled && aiSettings.enabled && acceptingReservations && registryTenant.features.reservations,
      canCreateAppointments: enabled && channelEnabled && aiSettings.enabled && acceptingReservations && registryTenant.vertical === "services" && registryTenant.features.reservations,
      canRequestPaymentLinks: enabled && channelEnabled && aiSettings.enabled && aiSettings.paymentControls.enabled,
    },
    assistantSettings: {
      phoneNumber: aiSettings.phoneNumber,
      greetingMessage: aiSettings.greetingMessage,
      systemPrompt: aiSettings.systemPrompt,
      handoffPhone: aiSettings.handoffPhone,
      language: aiSettings.language,
      humanTransferEnabled: aiSettings.humanTransferEnabled,
      confirmBeforeWrite: aiSettings.confirmBeforeWrite,
      afterHoursMode: aiSettings.afterHoursMode,
      quickSettings: aiSettings.quickSettings,
      paymentControls: aiSettings.paymentControls,
    },
    locations,
    menu: {
      timezone: MENU_TIMEZONE,
      activeLists: menuLists.activeLists.map((list) => ({
        code: list.code,
        name: list.name,
        description: list.description,
      })),
      categories: aiSettings.menuSyncEnabled
        ? ((categories ?? []) as CategoryRow[]).filter((category) => isCategoryVisible(category)).map((category) => ({
            id: category.id,
            code: category.code,
            title: category.title,
            description: category.description,
            items: (itemsByCategory.get(category.id) ?? []).map((item) => ({
              id: item.id,
              code: item.code,
              name: item.name,
              description: item.description,
              available: item.available,
              bookable: item.bookable,
              durationMinutes: item.duration_minutes,
              price: formatPrice(item.price),
              priceOptions: listPriceOptions(item.price).map((option) => ({
                code: option.code,
                label: option.label,
                price: formatEuro(option.value),
              })),
              tags: item.tags ?? [],
              allergens: item.allergens ?? [],
              modifications: buildItemModifications(item, inlineExtrasByItem, extraListsById, listItemsByListId),
            })),
          })).filter((category) => category.items.length > 0)
        : [],
    },
    retellInstructions: [
      "Usa solo le informazioni presenti in questo contesto per menu/listino, prezzi, modifiche, orari e sedi.",
      "Il menu nel contesto e gia filtrato per l'orario locale della chiamata. Non proporre voci assenti e recupera nuovamente il contesto prima di confermare un ordine.",
      "Prima di creare ordini, prenotazioni o appuntamenti conferma sempre nome, telefono, giorno, orario e sede quando ci sono piu sedi.",
      "Per ordini delivery raccogli indirizzo, citofono, piano, note consegna, orario desiderato e numero di telefono. Se il numero chiamante non va bene, chiedine uno alternativo.",
      "Prima di proporre prenotazioni o appuntamenti usa l'azione availability per leggere gli slot disponibili dal calendario interno.",
      "Se e richiesto pagamento digitale, conferma il numero di recapito e invia il link Stripe tramite il canale configurato.",
      "Se un prezzo e variabile o da confermare, dillo chiaramente e non inventare importi.",
      "Per allergeni, intolleranze o disponibilita dubbie, segnala che il locale confermera manualmente.",
      aiSettings.quickSettings.notesForAssistant,
    ].filter(Boolean),
  };
}

function dayIndex(date: string): number {
  const parsed = new Date(`${date}T12:00:00`);
  return (parsed.getDay() + 6) % 7;
}

function buildSlotsFromDay(day: DaySchedule | undefined, step = 30): string[] {
  if (!day || day.closed) return [];
  const out: string[] = [];
  for (const slot of day.slots) {
    const parts = slot.match(/(\d{1,2}):(\d{2}).*?(\d{1,2}):(\d{2})/);
    if (!parts) continue;
    const start = Number(parts[1]) * 60 + Number(parts[2]);
    const end = Number(parts[3]) * 60 + Number(parts[4]);
    const normalizedEnd = end <= start ? end + 24 * 60 : end;
    for (let t = start; t < normalizedEnd; t += step) {
      const hh = Math.floor((t % (24 * 60)) / 60).toString().padStart(2, "0");
      const mm = (t % 60).toString().padStart(2, "0");
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
}

export async function getRetellAvailability(input: RetellAvailabilityInput) {
  const db = svc();
  const context = await buildRetellInboundContext(input.tenantId, { locationId: input.locationId });
  const location = context.locations[0];
  const special = location?.specialHours.find((entry) => entry.date === input.date);
  const day = special
    ? { label: special.label ?? input.date, closed: special.closed, slots: special.slots }
    : location?.weeklyHours[dayIndex(input.date)];
  const slots = buildSlotsFromDay(day);

  const service = input.serviceCode
    ? await db
        .from("menu_items")
        .select("id,duration_minutes")
        .eq("tenant_id", input.tenantId)
        .eq("code", input.serviceCode)
        .maybeSingle()
    : { data: null };

  const [{ data: tablesRaw }, { data: existingRows }] = await Promise.all([
    db
      .from("tables")
      .select("id,label,seats,area")
      .eq("tenant_id", input.tenantId),
    db
      .from("reservation_requests")
      .select("table_id,covers,reservation_date,reservation_time,status")
      .eq("tenant_id", input.tenantId)
      .eq("reservation_date", input.date),
  ]);

  const tables: TableForPlanner[] = (tablesRaw ?? []).map((table) => ({
    id: table.id,
    label: table.label,
    seats: table.seats,
    area: table.area ?? "Sala",
  }));
  const existing: ReservationSlot[] = (existingRows ?? []).map((row) => ({
    tableId: row.table_id,
    covers: row.covers,
    reservationDate: row.reservation_date,
    reservationTime: row.reservation_time,
    status: row.status,
  }));
  const covers = Math.max(1, input.covers ?? 1);

  return {
    date: input.date,
    locationId: location?.id ?? null,
    durationMinutes: service.data?.duration_minutes ?? null,
    slots: slots.map((time) => {
      const occupiedAtTime = existing.filter((row) => row.reservationTime === time);
      const { tableId, assignedArea } = suggestTableForReservation(tables, occupiedAtTime, covers);
      return {
        time,
        available: tables.length === 0 ? true : Boolean(tableId),
        tableId,
        assignedArea,
      };
    }),
  };
}

export async function createRetellReservation(input: CreateRetellReservationInput) {
  const db = svc();
  const settings = await getAiPhoneSettings(input.tenantId);
  if (!settings.enabled || !isAiPhoneControlAccepting(settings.quickSettings.acceptReservations)) {
    throw new Error("reservations_not_accepting");
  }
  const service = input.serviceCode
    ? await db
        .from("menu_items")
        .select("id,duration_minutes")
        .eq("tenant_id", input.tenantId)
        .eq("code", input.serviceCode)
        .maybeSingle()
    : { data: null };
  const identity = await resolveCustomerIdentity({
    tenantId: input.tenantId,
    phone: input.customerPhone,
    displayName: input.customerName,
    source: input.source ?? "retell",
  });

  const { data, error } = await db
    .from("reservation_requests")
    .insert({
      tenant_id: input.tenantId,
      location_id: input.locationId ?? null,
      customer_id: identity?.customerId ?? null,
      customer_name: input.customerName,
      customer_phone: identity?.phone ?? input.customerPhone,
      covers: Math.max(1, input.covers ?? 1),
      reservation_date: input.date,
      reservation_time: input.time,
      notes: input.notes ?? null,
      channel: input.source === "whatsapp" ? "whatsapp" : "retell",
      status: "pending_manual",
      service_id: service.data?.id ?? null,
      duration_minutes: service.data?.duration_minutes ?? null,
      menuary_user_id: identity?.menuaryUserId ?? null,
    } as never)
    .select("id,status")
    .single();

  if (error) throw new Error(error.message);
  if (identity) {
    await recordCustomerEvent({
      tenantId: input.tenantId,
      customerId: identity.customerId,
      eventKind: "reservation_created",
      refId: data.id,
      meta: {
        source: input.source ?? "retell",
        registered: identity.registered,
        date: input.date,
        time: input.time,
        covers: input.covers ?? 1,
      },
    });
  }
  return data;
}

export async function createRetellOrder(input: CreateRetellOrderInput) {
  const db = svc();
  const settings = await getAiPhoneSettings(input.tenantId);
  if (!settings.enabled || !isAiPhoneControlAccepting(settings.quickSettings.acceptNewOrders)) {
    throw new Error("orders_not_accepting");
  }
  const fulfillmentType = input.fulfillmentType ?? "takeaway";
  if (fulfillmentType === "delivery" && !input.delivery?.address?.trim()) {
    throw new Error("delivery_address_required");
  }
  // Risoluzione metodo di pagamento effettivo, tenendo conto di:
  //   1) scelta esplicita raccolta dall'agente (`paymentMethodChoice`);
  //   2) policy tenant `acceptedMethods` (online_only / on_site_only / both);
  //   3) stato Stripe Connect (se non ready → forziamo on_site);
  //   4) fallback storico ai flag requireForTakeaway/Delivery quando policy="both"
  //      e nessuna scelta esplicita è stata raccolta.
  const tenantProfile = findTenantById(input.tenantId);
  const stripeAccount = tenantProfile?.features.payments
    ? await getTenantPaymentAccount(input.tenantId).catch(() => null)
    : null;
  const stripeReady = Boolean(stripeAccount?.chargesEnabled);
  const policy = settings.paymentControls.acceptedMethods;

  let effectivePaymentMethod: "online" | "on_site";
  if (!stripeReady || policy === "on_site_only") {
    effectivePaymentMethod = "on_site";
  } else if (policy === "online_only") {
    effectivePaymentMethod = "online";
  } else if (input.paymentMethodChoice === "online" || input.paymentMethodChoice === "on_site") {
    effectivePaymentMethod = input.paymentMethodChoice;
  } else {
    // policy=both, agente non ha raccolto scelta → fallback legacy.
    const legacyRequire =
      input.requestPayment === true ||
      (fulfillmentType === "delivery"
        ? settings.paymentControls.requireForDelivery
        : settings.paymentControls.requireForTakeaway);
    effectivePaymentMethod = legacyRequire ? "online" : "on_site";
  }

  const shouldRequestPayment = effectivePaymentMethod === "online";
  if (shouldRequestPayment && !input.customerPhone?.trim()) {
    throw new Error("payment_phone_required");
  }
  const identity = await resolveCustomerIdentity({
    tenantId: input.tenantId,
    phone: input.customerPhone,
    displayName: input.customerName,
    source: input.source ?? "retell",
  });
  if (input.lines.length === 0) throw new Error("empty_order");
  const codes = input.lines.map((line) => line.itemCode);
  const { data: items, error: itemsError } = await db
    .from("menu_items")
    .select("id,code,category_id,name,price,available,extra_list_id,location_id")
    .eq("tenant_id", input.tenantId)
    .in("code", codes);
  if (itemsError) throw new Error(itemsError.message);

  const byCode = new Map((items ?? []).map((item) => [item.code, item]));
  const missing = codes.filter((code) => !byCode.has(code));
  if (missing.length > 0) throw new Error(`missing_items:${missing.join(",")}`);

  const itemIds = (items ?? []).map((item) => item.id);
  const categoryIds = [...new Set((items ?? []).map((item) => item.category_id))];
  const listIds = (items ?? []).map((item) => item.extra_list_id).filter(Boolean) as string[];
  const [{ data: itemExtras }, { data: extraListItems }, { data: categories }, menuLists] = await Promise.all([
    db.from("menu_item_extras").select("item_id,code,name,price,position").in("item_id", itemIds),
    listIds.length
      ? db.from("extra_list_items").select("id,list_id,code,name,price,position").in("list_id", listIds)
      : Promise.resolve({ data: [] as ExtraListItemRow[] }),
    db.from("menu_categories").select("id,availability,location_id").in("id", categoryIds),
    loadActiveMenuLists(db, input.tenantId, conversationalMenuChannel(input.source)),
  ]);
  const categoriesById = new Map((categories ?? []).map((category) => [category.id, category]));
  const inlineExtrasByItem = groupBy((itemExtras ?? []) as unknown as ItemExtraRow[], (extra) => extra.item_id);
  const listItemsByListId = groupBy((extraListItems ?? []) as ExtraListItemRow[], (item) => item.list_id);

  const rows = input.lines.map((line, index) => {
    const item = byCode.get(line.itemCode)!;
    if (!item.available) throw new Error(`item_unavailable:${line.itemCode}`);
    const category = categoriesById.get(item.category_id);
    const isWrongLocation = input.locationId && (
      (item.location_id && item.location_id !== input.locationId) ||
      (category?.location_id && category.location_id !== input.locationId)
    );
    if (
      !category ||
      isWrongLocation ||
      !isCategoryVisible(category) ||
      (menuLists.allowedItemIds && !menuLists.allowedItemIds.has(item.id))
    ) {
      throw new Error(`item_not_in_active_menu:${line.itemCode}`);
    }
    const qty = Math.max(1, Math.floor(line.quantity));
    const addedExtras = resolveAddedExtras(item, line.addedExtraCodes ?? [], inlineExtrasByItem, listItemsByListId);
    const unit = resolveNumericPrice(item.code, item.price, line.priceOption) + addedExtras.reduce((sum, extra) => sum + extra.price, 0);
    return {
      item,
      row: {
        item_id: item.code,
        item_uuid: item.id,
        category_id: item.category_id,
        name: item.name,
        qty,
        unit_price: unit,
        line_total: unit * qty,
        note: line.note ?? null,
        added_extras: addedExtras as unknown as Json,
        removed_ingredients: (line.removedIngredients ?? []) as unknown as Json,
        bundle_picks: [] as unknown as Json,
        position: index,
      },
    };
  });
  const total = rows.reduce((sum, row) => sum + row.row.line_total, 0);

  const { data: codeRow, error: codeErr } = await db.rpc("next_order_code", {
    p_tenant_id: input.tenantId,
    p_prefix: "R",
  });
  if (codeErr) throw new Error(codeErr.message);

  const { data: order, error: orderErr } = await db
    .from("orders")
    .insert({
      tenant_id: input.tenantId,
      code: codeRow as string,
      type: "asporto",
      total,
      customer_name: input.customerName ?? null,
      customer_id: identity?.customerId ?? null,
      menuary_user_id: identity?.menuaryUserId ?? null,
      pickup_time: input.pickupTime ?? null,
      notes: [input.notes, identity?.phone || input.customerPhone ? `Telefono: ${identity?.phone ?? input.customerPhone}` : null]
        .filter(Boolean)
        .join("\n") || null,
      location_id: input.locationId ?? null,
      status: "nuovo",
      customer_phone: identity?.phone ?? input.customerPhone ?? null,
      fulfillment_type: fulfillmentType,
      delivery_address: input.delivery?.address ?? null,
      delivery_doorbell: input.delivery?.doorbell ?? null,
      delivery_floor: input.delivery?.floor ?? null,
      delivery_notes: input.delivery?.notes ?? null,
      desired_time: input.desiredTime ?? input.pickupTime ?? null,
      payment_status: shouldRequestPayment ? "pending" : "not_required",
    } as never)
    .select("id,code,total,status")
    .single();
  if (orderErr || !order) throw new Error(orderErr?.message ?? "order_create_failed");

  const { error: linesErr } = await db.from("order_lines").insert(
    rows.map(({ row }) => ({ ...row, order_id: order.id })),
  );
  if (linesErr) throw new Error(linesErr.message);
  if (identity) {
    await recordCustomerEvent({
      tenantId: input.tenantId,
      customerId: identity.customerId,
      eventKind: fulfillmentType === "delivery" ? "delivery_order_created" : "takeaway_order_created",
      refId: order.id,
      meta: {
        source: input.source ?? "retell",
        registered: identity.registered,
        total,
        fulfillmentType,
        paymentRequested: shouldRequestPayment,
      },
    });
  }

  // Invio link al cliente:
  // - pagamento online  → link a /checkout/[code] con pulsante Paga abilitato
  // - pagamento on_site → stesso link, ma la pagina mostra solo il riepilogo
  //   (badge "Pagamento al ritiro/consegna") e nasconde il bottone Paga.
  // Inviamo solo se abbiamo un telefono; in caso contrario l'agente comunicherà
  // verbalmente che l'ordine è registrato.
  let payment: ChannelPaymentRequest | null = null;
  const canSendLink =
    settings.paymentControls.enabled &&
    Boolean(input.customerPhone?.trim());
  if (canSendLink) {
    payment = await createChannelPaymentRequest({
      tenantId: input.tenantId,
      orderId: order.id,
      channel: input.paymentChannel ?? settings.paymentControls.defaultChannel,
      recipientPhone: input.customerPhone!,
      amount: total,
      currency: "EUR",
      description: `Ordine ${order.code}`,
      paymentRequired: effectivePaymentMethod === "online",
      metadata: {
        source: "retell",
        fulfillmentType,
        paymentMethod: effectivePaymentMethod,
        fallbackChannel: settings.paymentControls.fallbackChannel,
      },
    });
  }

  return { ...order, payment, paymentMethod: effectivePaymentMethod };
}
