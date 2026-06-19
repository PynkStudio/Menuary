import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findTenantById } from "@/lib/tenant-registry";
import { defaultHoursWeekForTenant, type DaySchedule } from "@/lib/venue-hours";
import { formatEuro } from "@/lib/price-utils";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/lib/database.types";
import { getAiPhoneSettings, isAiPhoneControlAccepting, type AiPhoneSettings } from "@/lib/retell/settings";
import { createChannelPaymentRequest, type ChannelPaymentRequest, type PaymentLinkChannel } from "@/lib/payments/channel-payment-links";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import { tenantUsesStripeDemoSandbox } from "@/lib/payments/stripe/sandbox-policy";
import { suggestTableForReservation, type ReservationSlot, type TableForPlanner } from "@/lib/reservations/engine";
import { normalizePhone, recordCustomerEvent, resolveCustomerIdentity } from "@/lib/crm/customer-identity";
import { evaluateAutoAccept, loadOrderSettings, resolveOrderNoticeMinutes, resolvePendingTimeoutSeconds } from "@/lib/orders/order-settings";
import type { MenuOrderChannel } from "@/lib/types";
import { isMenuOrderChannel } from "@/lib/menu-channels";
import { euroToItalianWords, orderCodeToSpoken } from "@/lib/retell/number-speech";
import { tenantCheckoutUrl } from "@/lib/orders/checkout-url";
import { notifyOperationalNewOrder } from "@/lib/notifications/operational-order-push";

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
    isDefault: boolean;
  }[];
  variantGroups: {
    id: string;
    name: string;
    required: boolean;
    defaultOptionId: string | null;
    options: {
      id: string;
      name: string;
      price: string;
      isDefault: boolean;
    }[];
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
  pickupDate?: string | null;
  desiredTime?: string | null;
  desiredDate?: string | null;
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

function normalizeConversationalOrderTime(input: {
  desiredTime?: string | null;
  desiredDate?: string | null;
  pickupTime?: string | null;
  pickupDate?: string | null;
}): string | null {
  const rawTime = (input.desiredTime ?? input.pickupTime ?? "").trim();
  if (!rawTime) return null;
  const rawDate = (input.desiredDate ?? input.pickupDate ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate) && /^\d{1,2}:\d{2}$/.test(rawTime)) {
    const [hour, minute] = rawTime.split(":");
    return `${rawDate} ${hour!.padStart(2, "0")}:${minute}`;
  }
  return rawTime;
}

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    if (Array.isArray(p.variants)) {
      const variants = p.variants
        .map((variant) => {
          if (!variant || typeof variant !== "object" || Array.isArray(variant)) return null;
          const v = variant as Record<string, Json | undefined>;
          return typeof v.label === "string" && typeof v.price === "number"
            ? `${v.label} ${formatEuro(v.price)}`
            : null;
        })
        .filter(Boolean);
      if (variants.length > 0) return variants.join(", ");
    }
    const small = p.small as Record<string, Json | undefined>;
    const large = p.large as Record<string, Json | undefined>;
    if (typeof small.label === "string" && typeof small.price === "number" && typeof large.label === "string" && typeof large.price === "number") {
      return `${small.label} ${formatEuro(small.price)}, ${large.label} ${formatEuro(large.price)}`;
    }
  }
  return "Prezzo da confermare";
}

function listPriceOptions(price: Json): { code: string; label: string; value: number; isDefault: boolean }[] {
  if (typeof price === "number") return [{ code: "standard", label: "Standard", value: price, isDefault: true }];
  if (!price || Array.isArray(price) || typeof price !== "object") return [];
  const p = price as Record<string, Json | undefined>;
  const defaultKey = typeof p.defaultKey === "string" ? p.defaultKey : null;
  if (p.kind === "single" && typeof p.value === "number") {
    return [{ code: "standard", label: "Standard", value: p.value, isDefault: true }];
  }
  if (p.kind === "sized" && typeof p.small === "number" && typeof p.big === "number") {
    const opts = [
      { code: "small", label: "Small", value: p.small },
      { code: "big", label: "Big", value: p.big },
    ];
    return opts.map((o, i) => ({ ...o, isDefault: defaultKey ? o.code === defaultKey : i === 0 }));
  }
  if (p.kind === "persone" && typeof p.per2 === "number" && typeof p.per4 === "number") {
    const opts = [
      { code: "per2", label: "2 persone", value: p.per2 },
      { code: "per4", label: "4 persone", value: p.per4 },
    ];
    return opts.map((o, i) => ({ ...o, isDefault: defaultKey ? o.code === defaultKey : i === 0 }));
  }
  if (p.kind === "volume" && p.small && p.large) {
    if (Array.isArray(p.variants)) {
      const opts = p.variants.flatMap((variant, index) => {
        if (!variant || typeof variant !== "object" || Array.isArray(variant)) return [];
        const v = variant as Record<string, Json | undefined>;
        return typeof v.label === "string" && typeof v.price === "number"
          ? [{ code: typeof v.id === "string" ? v.id : `volume-${index}`, label: v.label, value: v.price }]
          : [];
      });
      return opts.map((o, i) => ({ ...o, isDefault: defaultKey ? o.code === defaultKey : i === 0 }));
    }
    const small = p.small as Record<string, Json | undefined>;
    const large = p.large as Record<string, Json | undefined>;
    if (typeof small.label === "string" && typeof small.price === "number" && typeof large.label === "string" && typeof large.price === "number") {
      const opts = [
        { code: "small", label: small.label, value: small.price },
        { code: "large", label: large.label, value: large.price },
      ];
      return opts.map((o, i) => ({ ...o, isDefault: defaultKey ? o.code === defaultKey : i === 0 }));
    }
  }
  return [];
}

function resolveNumericPrice(itemCode: string, price: Json, selectedOption?: string | null): number {
  const options = listPriceOptions(price);
  if (options.length === 0) throw new Error(`price_to_confirm:${itemCode}`);
  if (options.length === 1) return options[0].value;

  if (selectedOption) {
    const selected = selectedOption.trim().toLocaleLowerCase("it-IT");
    const option = options.find((candidate) => candidate.code.toLocaleLowerCase("it-IT") === selected);
    if (option) return option.value;
  }

  // Nessuna selezione esplicita: usa la variante di default configurata nel menu,
  // oppure la prima disponibile come fallback.
  return (options.find((o) => o.isDefault) ?? options[0]).value;
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

const BASE_VARIANT_NAMES = ["normale", "classica", "classico", "semplice", "standard", "base", "regular", "plain"];

function inferBaseVariantIndex(names: string[]): number {
  const idx = names.findIndex((n) =>
    BASE_VARIANT_NAMES.includes(n.trim().toLocaleLowerCase("it-IT")),
  );
  return idx >= 0 ? idx : 0;
}

function listVariantGroups(value: Json) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((group) => {
    if (!group || typeof group !== "object" || Array.isArray(group)) return [];
    const g = group as Record<string, Json | undefined>;
    if (typeof g.id !== "string" || typeof g.name !== "string" || !Array.isArray(g.options)) return [];
    const defaultOptionId = typeof g.defaultOptionId === "string" ? g.defaultOptionId : null;
    const options = g.options.flatMap((option) => {
      if (!option || typeof option !== "object" || Array.isArray(option)) return [];
      const o = option as Record<string, Json | undefined>;
      if (typeof o.id !== "string" || typeof o.name !== "string") return [];
      const price = typeof o.price === "number" ? o.price : 0;
      return [{
        id: o.id,
        name: o.name,
        price: money(price),
        isDefault: defaultOptionId ? o.id === defaultOptionId : false,
      }];
    });
    if (options.length === 0) return [];
    let resolvedOptions = options;
    if (!defaultOptionId) {
      const baseIndex = inferBaseVariantIndex(options.map((o) => o.name));
      resolvedOptions = options.map((option, index) => ({ ...option, isDefault: index === baseIndex }));
    }
    return [{
      id: g.id,
      name: g.name,
      required: g.required === true,
      defaultOptionId,
      options: resolvedOptions,
    }];
  });
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

function requireRetellFeature(features: Json, key: "aiPhone" | "aiWhatsapp", registryEnabled: boolean): boolean {
  if (features && typeof features === "object" && !Array.isArray(features)) {
    const value = (features as Record<string, Json | undefined>)[key];
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
  options: {
    locationId?: string | null;
    includeUnavailable?: boolean;
    channel?: "retell" | "whatsapp";
    sharedWhatsappSender?: boolean;
  } = {},
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

  const enabled = options.channel === "whatsapp" && options.sharedWhatsappSender === true
    ? registryTenant.enabled
    : Boolean(tenantRow?.enabled ?? registryTenant.enabled);
  const aiPhoneEnabled = requireRetellFeature(tenantRow?.features ?? {}, "aiPhone", registryTenant.features.aiPhone);
  const aiWhatsappEnabled = requireRetellFeature(tenantRow?.features ?? {}, "aiWhatsapp", registryTenant.features.aiWhatsapp);
  const channelEnabled = options.channel === "whatsapp"
    ? aiWhatsappEnabled || options.sharedWhatsappSender === true
    : aiPhoneEnabled;
  const aiSettings = await getAiPhoneSettings(tenantId);
  const assistantEnabled = aiSettings.enabled || (options.channel === "whatsapp" && options.sharedWhatsappSender === true);
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
    .select("id,code,category_id,name,description,price,tags,allergens,available,bookable,duration_minutes,variant_groups,extra_list_id,location_id,position")
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
      canAnswerQuestions: enabled && channelEnabled && assistantEnabled,
      canCreateTakeawayOrders: enabled && channelEnabled && assistantEnabled && acceptingOrders && registryTenant.features.takeaway,
      canCreateDeliveryOrders: enabled && channelEnabled && assistantEnabled && acceptingOrders && registryTenant.features.deliveryHub,
      canCreateReservations: enabled && channelEnabled && assistantEnabled && acceptingReservations && registryTenant.features.reservations,
      canCreateAppointments: enabled && channelEnabled && assistantEnabled && acceptingReservations && registryTenant.vertical === "services" && registryTenant.features.reservations,
      canRequestPaymentLinks: enabled && channelEnabled && assistantEnabled && aiSettings.paymentControls.enabled,
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
                isDefault: option.isDefault,
              })),
              variantGroups: listVariantGroups(item.variant_groups),
              tags: item.tags ?? [],
              allergens: item.allergens ?? [],
              modifications: buildItemModifications(item, inlineExtrasByItem, extraListsById, listItemsByListId),
            })),
          })).filter((category) => category.items.length > 0)
        : [],
    },
    retellInstructions: [
      "Se il risultato di `customer_lookup` contiene un campo `language` non vuoto, adotta quella lingua fin dalla prima risposta. Altrimenti rileva la lingua dal primo messaggio del chiamante (default italiano se non determinabile) e mantienila per tutta la conversazione senza mai cambiarla o mescolarla con altre lingue. Dopo aver identificato la lingua chiama `set_customer_language` per salvarla nel CRM. Se possibile traduci nomi di piatti, ingredienti e modificatori nella lingua del chiamante.",
      "Usa solo le informazioni presenti in questo contesto per menu/listino, prezzi, modifiche, orari e sedi.",
      "Il menu nel contesto e gia filtrato per l'orario locale della chiamata. Non proporre voci assenti e recupera nuovamente il contesto prima di confermare un ordine.",
      "Se il cliente chiede di vedere il menu, il listino completo o vuole sfogliare i piatti, proponi di inviargli il link via messaggio usando la funzione send_menu_link; non elencare i piatti verbalmente.",
      "Se un piatto ha piu varianti e il cliente non specifica quale, seleziona automaticamente la variante marcata come default nel menu. Se nessuna variante e marcata come default, scegli quella il cui nome indica la versione base — ad esempio 'Normale', 'Classica', 'Semplice', 'Standard', 'Base', 'Regular' — e procedi senza chiedere. Chiedi la variante SOLO se il cliente la nomina in modo ambiguo o se non esiste ne un default ne una variante dal nome riconoscibile come base.",
      registryTenant.id === "kimos"
        ? "Per Kimos, se il cliente ordina una pizza senza specificare formato o impasto, procedi senza chiarimenti usando formato Normale e impasto Classico. Chiedi chiarimenti solo se il cliente cita una variante in modo ambiguo."
        : "",
      "Quando il cliente ordina un piatto, conferma brevemente e chiedi se vuole aggiungere altro (es. 'Va bene, una margherita. Qualcos'altro?'). Non elencare MAI ingredienti, descrizione, allergeni o prezzo del singolo piatto: queste informazioni vanno fornite SOLO se il cliente le chiede esplicitamente (es. 'cosa c'e dentro?', 'contiene glutine?', 'quanto costa?'). Se il cliente ha gia indicato la quantita (es. 'una margherita') non richiedere quante ne vuole.",
      "Non comunicare i prezzi dei singoli piatti durante la raccolta dell'ordine. Il prezzo viene comunicato solo alla fine, come totale complessivo nel riepilogo.",
      "Fulfillment: se il cliente dice 'portare a casa', 'consegnare', 'delivery', 'a domicilio' o simili, tratta l'ordine come delivery senza chiedere conferma. Se dice 'passo io', 'ritiro', 'vengo a prendere' o simili, tratta come asporto. Chiedi 'asporto o consegna?' SOLO se {{delivery_available}} e {{takeaway_available}} sono entrambi true E il cliente non ha indicato alcuna preferenza. Se solo uno dei due e disponibile, usalo senza chiedere.",
      "Prima di creare ordini, prenotazioni o appuntamenti conferma sempre nome e sede quando ci sono piu sedi.",
      "Quando il cliente fornisce dati nella prima frase (es. 'vorrei una margherita in via Roma 10 citofono Rossi'), estrai TUTTI i dati gia forniti e chiedi SOLO quelli mancanti. Per delivery servono: indirizzo, citofono, piano, orario desiderato. Se manca un solo dato (es. il piano) chiedi solo quello, senza ripetere cio che il cliente ha gia detto.",
      "Non chiedere di confermare il numero da cui chiama e non dire che lo richiameremo su quel numero. Usa caller_phone se non viene dato un numero alternativo.",
      "Prima di proporre prenotazioni o appuntamenti usa l'azione availability per leggere gli slot disponibili dal calendario interno.",
      "Non proporre spontaneamente il metodo di pagamento e non chiedere come il cliente vuole pagare. Se il cliente chiede come puo pagare o se accettate carta/contanti, rispondi che ricevera un link su WhatsApp dove trovera tutte le istruzioni per il pagamento. Dopo la conferma dell'ordine di solo che arrivera un messaggio su WhatsApp con il link.",
      "Il riepilogo finale deve essere il piu breve possibile: solo cosa ha ordinato, dove e quando portarlo o ritirarlo e il totale. Non ripetere il numero di telefono. Concludi dicendo che arrivera il messaggio su WhatsApp e basta.",
      "Se un prezzo e variabile o da confermare, dillo chiaramente e non inventare importi.",
      "Per allergeni, intolleranze o disponibilita dubbie, segnala che il locale confermera manualmente solo se il cliente chiede informazioni su allergeni.",
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
  if (!findTenantById(input.tenantId)) throw new Error("tenant_not_found");
  const locationId = input.locationId && UUID_RE.test(input.locationId) ? input.locationId : null;
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
      location_id: locationId,
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
  // L'assistente AI a volte inventa il tenantId (es. il placeholder "kimos_tenant_id")
  // invece di usare {{tenant_id}}: senza questo guard finiva in un 500 da FK su customers.
  if (!findTenantById(input.tenantId)) throw new Error("tenant_not_found");
  // Idem per il locationId (es. "kimos_main"): le sedi reali sono UUID, altrimenti
  // la usiamo come sede di default (null) per non rompere le foreign key.
  const locationId = input.locationId && UUID_RE.test(input.locationId) ? input.locationId : null;
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
  const useDemoSandbox = tenantUsesStripeDemoSandbox(input.tenantId);
  const stripeAccount = tenantProfile?.features.payments
    ? await getTenantPaymentAccount(input.tenantId, { demoSandbox: useDemoSandbox }).catch(() => null)
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
    // policy=both, agente non chiede più la preferenza → online di default così il bottone
    // "Paga" è visibile sul link di riepilogo; il cliente può scegliere se pagare subito.
    effectivePaymentMethod = "online";
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
  const requestedCodes = input.lines.map((line) => line.itemCode);
  // L'assistente AI a volte invia il codice senza prefisso tenant (es. "margherita"
  // invece di "kimos-margherita") o con case diverso. Allarghiamo la query alle varianti
  // plausibili e risolviamo tollerando prefisso/maiuscole. Resta retrocompatibile: il
  // match esatto (caso normale degli altri tenant) vince comunque per primo.
  const codeCandidates = new Set<string>();
  const tenantPrefix = `${input.tenantId}-`;
  for (const code of requestedCodes) {
    codeCandidates.add(code);
    codeCandidates.add(`${tenantPrefix}${code}`);
    if (code.startsWith(tenantPrefix)) codeCandidates.add(code.slice(tenantPrefix.length));
  }
  const { data: items, error: itemsError } = await db
    .from("menu_items")
    .select("id,code,category_id,name,price,available,extra_list_id,location_id")
    .eq("tenant_id", input.tenantId)
    .in("code", [...codeCandidates]);
  if (itemsError) throw new Error(itemsError.message);

  const byExactCode = new Map((items ?? []).map((item) => [item.code, item]));
  const byLowerCode = new Map((items ?? []).map((item) => [item.code.toLocaleLowerCase("it-IT"), item]));
  const resolveItem = (code: string) => {
    const prefixed = `${tenantPrefix}${code}`;
    return (
      byExactCode.get(code) ??
      byExactCode.get(prefixed) ??
      byLowerCode.get(code.toLocaleLowerCase("it-IT")) ??
      byLowerCode.get(prefixed.toLocaleLowerCase("it-IT")) ??
      null
    );
  };
  const resolvedByRequested = new Map(requestedCodes.map((code) => [code, resolveItem(code)] as const));
  const missing = requestedCodes.filter((code) => !resolvedByRequested.get(code));
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
    const item = resolvedByRequested.get(line.itemCode)!;
    if (!item.available) throw new Error(`item_unavailable:${line.itemCode}`);
    const category = categoriesById.get(item.category_id);
    const isWrongLocation = locationId && (
      (item.location_id && item.location_id !== locationId) ||
      (category?.location_id && category.location_id !== locationId)
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
  const orderSettings = await loadOrderSettings(db, input.tenantId, locationId);
  const hasNotes =
    Boolean(input.notes?.trim()) ||
    Boolean(input.delivery?.notes?.trim()) ||
    input.lines.some((line) => Boolean(line.note?.trim()));
  const itemsCount = input.lines.reduce((sum, line) => sum + Math.max(1, Math.floor(line.quantity)), 0);
  const crmEnabled = Boolean(tenantProfile?.features.crm);
  const isReturningCustomer = Boolean(identity?.registered) || Boolean(identity?.customerId);
  const noticeMinutes = resolveOrderNoticeMinutes({
    pickupTime: input.pickupTime,
    desiredTime: input.desiredTime,
    pickupDate: input.desiredDate ?? input.pickupDate,
  });
  const desiredTime = normalizeConversationalOrderTime(input);
  const autoAccepted = evaluateAutoAccept(orderSettings, {
    total,
    itemsCount,
    hasNotes,
    isReturningCustomer,
    crmEnabled,
    noticeMinutes,
  });
  const initialStatus = autoAccepted ? "nuovo" : "pending_confirmation";
  const pendingTimeoutSeconds = resolvePendingTimeoutSeconds(orderSettings.pendingTimeoutSeconds);
  const confirmationExpiresAt = autoAccepted
    ? null
    : new Date(Date.now() + pendingTimeoutSeconds * 1000).toISOString();
  const confirmedAt = autoAccepted ? new Date().toISOString() : null;

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
      type: fulfillmentType === "delivery" ? "delivery" : "asporto",
      total,
      source: input.source ?? "retell",
      customer_name: input.customerName ?? null,
      customer_id: identity?.customerId ?? null,
      menuary_user_id: identity?.menuaryUserId ?? null,
      pickup_time: input.pickupTime ?? null,
      // Il telefono vive nella colonna customer_phone (mostrata in operativo come
      // link tel:). Non duplicarlo nelle note, altrimenti riappare al cliente nel
      // riepilogo del checkout pubblico.
      notes: input.notes?.trim() || null,
      location_id: locationId,
      status: initialStatus,
      customer_phone: identity?.phone ?? input.customerPhone ?? null,
      fulfillment_type: fulfillmentType,
      dine_option: fulfillmentType === "delivery" ? null : "takeaway",
      delivery_address: input.delivery?.address ?? null,
      delivery_doorbell: input.delivery?.doorbell ?? null,
      delivery_floor: input.delivery?.floor ?? null,
      delivery_notes: input.delivery?.notes ?? null,
      desired_time: desiredTime,
      payment_status: shouldRequestPayment ? "pending" : "not_required",
      confirmation_expires_at: confirmationExpiresAt,
      confirmed_at: confirmedAt,
      auto_accepted: autoAccepted,
    } as never)
    .select("id,code,total,status")
    .single();
  if (orderErr || !order) throw new Error(orderErr?.message ?? "order_create_failed");

  const { error: linesErr } = await db.from("order_lines").insert(
    rows.map(({ row }) => ({ ...row, order_id: order.id })),
  );
  if (linesErr) throw new Error(linesErr.message);
  void notifyOperationalNewOrder({
    tenantId: input.tenantId,
    orderCode: order.code,
    status: order.status,
    customerName: input.customerName ?? null,
    locationId,
  }).catch(() => null);
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
  // Inviamo SEMPRE il messaggio di checkout quando abbiamo un telefono, a prescindere
  // dal metodo di pagamento: il template WhatsApp usato dipende poi da effectivePaymentMethod
  // (online → "paga ora", on_site → "vedi riepilogo"), gestito in createChannelPaymentRequest.
  const canSendLink = Boolean(input.customerPhone?.trim());
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
      onSiteAvailable: effectivePaymentMethod === "online" && policy === "both",
      fulfillmentType,
      deliveryAddress: input.delivery?.address ?? null,
      metadata: {
        source: input.source ?? "retell",
        fulfillmentType,
        paymentMethod: effectivePaymentMethod,
        fallbackChannel: settings.paymentControls.fallbackChannel,
      },
    });
  }

  // Versioni "parlate" per l'agente vocale: il codice letto cifra per cifra e il
  // totale in lettere evitano la pronuncia errata del TTS.
  return {
    ...order,
    code_spoken: orderCodeToSpoken(order.code),
    total_spoken: euroToItalianWords(order.total),
    payment,
    paymentMethod: effectivePaymentMethod,
  };
}

export type MenuOpportunitySuggestion = {
  menuItemCode: string;
  menuItemName: string;
  menuPrice: number;
  currentItemsTotal: number;
  savingsEuro: number;
  /** Testo già pronto per il TTS dell'agente vocale. */
  spokenSuggestion: string;
};

/**
 * Dato un set di codici-item già raccolti dall'agente, cerca se esiste un menu
 * composto (bundle) che copre tutti gli slot con quegli item, e calcola il risparmio.
 *
 * Chiamare PRIMA di createRetellOrder, come tool separato dell'agente vocale.
 * Se il cliente accetta, l'agente crea l'ordine con il solo item-menu (non i singoli).
 */
export async function detectRetellMenuOpportunity(
  tenantId: string,
  itemCodes: string[],
): Promise<MenuOpportunitySuggestion | null> {
  if (itemCodes.length < 2) return null;

  const db = svc();
  const tenantPrefix = `${tenantId}-`;

  // Carica gli item richiesti
  const candidates = new Set<string>(itemCodes.flatMap((c) => [c, `${tenantPrefix}${c}`]));
  const { data: requestedItems } = await db
    .from("menu_items")
    .select("id,code,category_id,price")
    .eq("tenant_id", tenantId)
    .in("code", [...candidates]);

  if (!requestedItems?.length) return null;

  // Normalizza i codici alle versioni "senza prefisso" per la ricerca slot
  const normalizeCode = (code: string) =>
    code.startsWith(tenantPrefix) ? code.slice(tenantPrefix.length) : code;

  const inputById = new Map(requestedItems.map((it) => [it.id, it]));
  const inputByCat = new Map<string, typeof requestedItems[number][]>();
  for (const it of requestedItems) {
    const bucket = inputByCat.get(it.category_id) ?? [];
    bucket.push(it);
    inputByCat.set(it.category_id, bucket);
  }

  // Carica tutti i menu bundle del tenant
  const { data: menuItems } = await db
    .from("menu_items")
    .select("id,code,name,price,bundle_slots,available")
    .eq("tenant_id", tenantId)
    .eq("available", true)
    .not("bundle_slots", "is", null);

  if (!menuItems?.length) return null;

  let bestOpportunity: MenuOpportunitySuggestion | null = null;

  for (const menuItem of menuItems) {
    const slots = menuItem.bundle_slots as Array<{
      id: string;
      sourceCategoryIds: string[];
      sourceItemIds?: string[];
    }> | null;
    if (!slots?.length) continue;

    const usedItemIds = new Set<string>();
    let allSlotsCovered = true;

    for (const slot of slots) {
      let covered = false;

      for (const it of requestedItems) {
        if (usedItemIds.has(it.id)) continue;
        const catMatch = slot.sourceCategoryIds.includes(it.category_id);
        const itemMatch = slot.sourceItemIds?.includes(it.id) ||
          slot.sourceItemIds?.includes(normalizeCode(it.code));
        if (catMatch || itemMatch) {
          usedItemIds.add(it.id);
          covered = true;
          break;
        }
      }

      if (!covered) {
        allSlotsCovered = false;
        break;
      }
    }

    if (!allSlotsCovered) continue;

    const coveredItems = [...usedItemIds].map((id) => inputById.get(id)!);
    const currentItemsTotal = coveredItems.reduce(
      (sum, it) => sum + resolveNumericPrice(it.code, it.price),
      0,
    );
    const menuPrice = resolveNumericPrice(menuItem.code, menuItem.price);
    const savingsEuro = currentItemsTotal - menuPrice;

    if (!bestOpportunity || savingsEuro > bestOpportunity.savingsEuro) {
      const savingsFmt = savingsEuro > 0
        ? `risparmi ${euroToItalianWords(savingsEuro)}`
        : "stesso prezzo";
      bestOpportunity = {
        menuItemCode: normalizeCode(menuItem.code),
        menuItemName: menuItem.name,
        menuPrice,
        currentItemsTotal,
        savingsEuro,
        spokenSuggestion:
          `Ho notato che gli articoli che hai scelto corrispondono al ${menuItem.name}: con il menu ${savingsFmt}. Vuoi che lo converta?`,
      };
    }
  }

  return bestOpportunity;
}

export type RetellActiveOrder = {
  orderId: string;
  code: string;
  status: string;
  statusLabel: string;
  fulfillmentType: string;
  scheduledTime: string;
  itemsSummary: string;
  /** True se l'ordine è ancora nella finestra di modifica/annullo (5 min da created_at, status permitting). */
  isModifiable: boolean;
  /** URL della pagina di riepilogo/pagamento dell'ordine, già con token. */
  checkoutUrl: string;
};

export type RetellCustomerContext = {
  isKnown: boolean;
  firstName: string;
  language: string;
  lastAddress: string;
  lastOrderSummary: string;
  activeOrder: RetellActiveOrder | null;
};

export async function setCustomerLanguage(
  tenantId: string,
  callerPhone: string,
  language: string,
): Promise<{ updated: boolean }> {
  const phone = normalizePhone(callerPhone);
  if (!phone || !language.trim()) return { updated: false };

  const db = svc();
  const { error } = await db
    .from("customers")
    .update({ language: language.trim(), updated_at: new Date().toISOString() } as never)
    .eq("tenant_id", tenantId)
    .eq("phone", phone);
  return { updated: !error };
}

const ACTIVE_ORDER_STATUSES = ["pending_confirmation", "nuovo", "in_preparazione", "pronto"] as const;
const MODIFIABLE_STATUSES = ["pending_confirmation", "nuovo"] as const;
const MODIFY_WINDOW_MS = 5 * 60 * 1000;

function orderStatusLabel(status: string): string {
  switch (status) {
    case "pending_confirmation": return "in attesa di conferma dal locale";
    case "nuovo": return "confermato, in attesa di preparazione";
    case "in_preparazione": return "in preparazione";
    case "pronto": return "pronto per il ritiro o la consegna";
    default: return status;
  }
}

function fulfillmentLabel(type: string): string {
  return type === "delivery" ? "consegna a domicilio" : "asporto";
}

export async function lookupRetellCustomer(
  tenantId: string,
  callerPhone: string,
): Promise<RetellCustomerContext> {
  const empty: RetellCustomerContext = { isKnown: false, firstName: "", language: "", lastAddress: "", lastOrderSummary: "", activeOrder: null };

  const phone = normalizePhone(callerPhone);
  if (!phone) return empty;

  const db = svc();

  type ActiveOrderRow = { id: string; code: string; status: string; fulfillment_type: string; pickup_time: string | null; desired_time: string | null; created_at: string; public_token: string };
  const activeOrderQuery = db
    .from("orders")
    .select("id,code,status,fulfillment_type,pickup_time,desired_time,created_at,public_token")
    .eq("tenant_id", tenantId)
    .eq("customer_phone", phone)
    .in("status", [...ACTIVE_ORDER_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() as unknown as Promise<{ data: ActiveOrderRow | null }>;

  const [{ data: customer }, { data: orders }, { data: activeOrderRow }] = await Promise.all([
    db
      .from("customers")
      .select("id,display_name,language")
      .eq("tenant_id", tenantId)
      .eq("phone", phone)
      .order("menuary_user_id", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("orders")
      .select("id,delivery_address,fulfillment_type")
      .eq("tenant_id", tenantId)
      .eq("customer_phone", phone)
      .in("status", ["nuovo", "in_preparazione", "pronto", "consegnato"])
      .order("created_at", { ascending: false })
      .limit(3),
    activeOrderQuery,
  ]);

  if (!customer && (!orders || orders.length === 0) && !activeOrderRow) return empty;

  const firstName = (customer as { display_name?: string | null } | null)?.display_name?.trim().split(/\s+/)[0] ?? "";
  const language = (customer as { language?: string | null } | null)?.language?.trim() ?? "";

  const lastAddress =
    (orders as { delivery_address: string | null }[] | null)?.find((o) => o.delivery_address)?.delivery_address ?? "";

  let lastOrderSummary = "";
  if (orders && orders.length > 0) {
    const lastOrderId = (orders as { id: string }[])[0].id;
    const { data: lines } = await db
      .from("order_lines")
      .select("name,qty,note,variant_label")
      .eq("order_id", lastOrderId)
      .order("position", { ascending: true });

    if (lines && lines.length > 0) {
      lastOrderSummary = (lines as { name: string; qty: number; note: string | null; variant_label: string | null }[])
        .map((l) => {
          let s = `${l.qty}× ${l.name}`;
          if (l.variant_label) s += ` (${l.variant_label})`;
          if (l.note?.trim()) s += ` — ${l.note.trim()}`;
          return s;
        })
        .join(", ");
    }
  }

  let activeOrder: RetellActiveOrder | null = null;
  if (activeOrderRow) {
    const isModifiableStatus = (MODIFIABLE_STATUSES as readonly string[]).includes(activeOrderRow.status);
    const ageMs = Date.now() - new Date(activeOrderRow.created_at).getTime();
    const isModifiable = isModifiableStatus && ageMs <= MODIFY_WINDOW_MS;
    const scheduledTime = activeOrderRow.pickup_time ?? activeOrderRow.desired_time ?? "";

    const { data: activeLines } = await db
      .from("order_lines")
      .select("name,qty")
      .eq("order_id", activeOrderRow.id)
      .order("position", { ascending: true });

    const itemsSummary = (activeLines as { name: string; qty: number }[] | null ?? [])
      .map((l) => `${l.qty}× ${l.name}`)
      .join(", ");

    activeOrder = {
      orderId: activeOrderRow.id,
      code: activeOrderRow.code,
      status: activeOrderRow.status,
      statusLabel: orderStatusLabel(activeOrderRow.status),
      fulfillmentType: fulfillmentLabel(activeOrderRow.fulfillment_type),
      scheduledTime,
      itemsSummary,
      isModifiable,
      checkoutUrl: tenantCheckoutUrl(tenantId, activeOrderRow.code, activeOrderRow.public_token),
    };
  }

  return {
    isKnown: Boolean(customer || (orders && orders.length > 0) || activeOrderRow),
    firstName,
    language,
    lastAddress,
    lastOrderSummary,
    activeOrder,
  };
}

export type ResendRetellOrderLinkInput = {
  tenantId: string;
  orderId: string;
  recipientPhone: string;
};

export async function resendRetellOrderLink(
  input: ResendRetellOrderLinkInput,
): Promise<{ sent: boolean; channel: string | null }> {
  const phone = normalizePhone(input.recipientPhone);
  if (!phone) return { sent: false, channel: null };

  const db = svc();

  type OrderRow = {
    id: string;
    code: string;
    total: number | string;
    fulfillment_type: string;
    delivery_address: string | null;
    payment_status: string;
    customer_name: string | null;
  };

  const { data } = await (db as unknown as {
    from: (table: "orders") => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: OrderRow | null }>;
          };
        };
      };
    };
  })
    .from("orders")
    .select("id,code,total,fulfillment_type,delivery_address,payment_status,customer_name")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.orderId)
    .maybeSingle();

  if (!data) return { sent: false, channel: null };

  const isDelivery = data.fulfillment_type === "delivery";
  // Pagamento richiesto solo se l'ordine è ancora in attesa di pagamento online.
  const paymentRequired = data.payment_status === "pending";
  const total = Number(data.total);

  const aiSettings = await getAiPhoneSettings(input.tenantId);

  await createChannelPaymentRequest({
    tenantId: input.tenantId,
    orderId: data.id,
    channel: "retell",
    recipientPhone: phone,
    amount: total > 0 ? total : 0.01,
    description: `Riepilogo ordine ${data.code}${data.customer_name ? ` — ${data.customer_name}` : ""}`,
    paymentRequired,
    fulfillmentType: isDelivery ? "delivery" : "takeaway",
    deliveryAddress: isDelivery ? (data.delivery_address ?? undefined) : undefined,
  });

  return { sent: true, channel: aiSettings.paymentControls.defaultChannel };
}
