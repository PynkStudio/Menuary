import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import type { MenuOrderChannel } from "@/lib/types";
import { isMenuOrderChannel, menuChannelIgnoresTimeRules } from "@/lib/menu-channels";

type Db = SupabaseClient<Database>;

type MenuListVisibility = {
  days?: number[];
  startTime?: string;
  endTime?: string;
  tableIds?: string[];
  channels?: MenuOrderChannel[];
};

type MenuListRow = {
  id: string;
  enabled: boolean;
  visibility: Json;
};

type MenuListItemRow = {
  item_id: string;
};

const MENU_TIMEZONE = "Europe/Rome";

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

function isVisible(list: MenuListRow, channel: MenuOrderChannel, tableId: string | null, now: Date): boolean {
  if (!list.enabled) return false;
  const visibility = normalizeVisibility(list.visibility);
  if (visibility.channels && !visibility.channels.includes(channel)) return false;
  // Le prenotazioni ignorano vincoli di orario, giorno e tavolo: prodotti/servizi sono sempre prenotabili.
  if (menuChannelIgnoresTimeRules(channel)) return true;
  const local = localMenuTime(now);
  if (visibility.days?.length && !visibility.days.includes(local.day)) return false;
  if (!isTimeInWindow(local.minutes, visibility.startTime, visibility.endTime)) return false;
  return !visibility.tableIds?.length || Boolean(tableId && visibility.tableIds.includes(tableId));
}

function hasRestriction(list: MenuListRow): boolean {
  const visibility = normalizeVisibility(list.visibility);
  return Boolean(visibility.days?.length || visibility.startTime || visibility.endTime || visibility.tableIds?.length || visibility.channels);
}

export async function validateMenuItemsForOrderChannel(
  db: Db,
  input: {
    tenantId: string;
    itemCodes: string[];
    channel: MenuOrderChannel;
    tableId?: string | null;
    now?: Date;
  },
): Promise<string[]> {
  const listsResult = await (db as unknown as {
    from: (table: "menu_lists") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => Promise<{ data: MenuListRow[] | null; error: { message: string } | null }>;
      };
    };
  }).from("menu_lists").select("id,enabled,visibility").eq("tenant_id", input.tenantId);
  if (listsResult.error) throw new Error(listsResult.error.message);

  const lists = listsResult.data ?? [];
  if (lists.length === 0) return [];

  const visible = lists.filter((list) => isVisible(list, input.channel, input.tableId ?? null, input.now ?? new Date()));
  const restricted = visible.filter(hasRestriction);
  const listsForItems = restricted.length > 0 ? restricted : visible.filter((list) => !hasRestriction(list));
  if (listsForItems.length === 0) return input.itemCodes;

  const listItemsResult = await (db as unknown as {
    from: (table: "menu_list_items") => {
      select: (columns: string) => {
        in: (column: string, values: string[]) => Promise<{ data: MenuListItemRow[] | null; error: { message: string } | null }>;
      };
    };
  }).from("menu_list_items").select("item_id").in("list_id", listsForItems.map((list) => list.id));
  if (listItemsResult.error) throw new Error(listItemsResult.error.message);

  const allowedIds = [...new Set((listItemsResult.data ?? []).map((item) => item.item_id))];
  if (allowedIds.length === 0) return input.itemCodes;
  const { data: items, error } = await db.from("menu_items").select("code").in("id", allowedIds);
  if (error) throw new Error(error.message);
  const allowedCodes = new Set((items ?? []).map((item) => item.code));
  return input.itemCodes.filter((code) => !allowedCodes.has(code));
}
