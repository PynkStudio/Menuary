import type { MenuItem, MenuTag } from "@/lib/menu-data";

export const BUILT_IN_MENU_TAGS = ["firma", "piccante", "veg", "vegano", "novita"] as const;

export const BUILT_IN_TAG_LABELS: Record<(typeof BUILT_IN_MENU_TAGS)[number], string> = {
  firma: "Firma",
  piccante: "Piccante",
  veg: "Vegetariano",
  vegano: "Vegano",
  novita: "Novità",
};

export function isBuiltInMenuTag(tag: string): tag is (typeof BUILT_IN_MENU_TAGS)[number] {
  return (BUILT_IN_MENU_TAGS as readonly string[]).includes(tag);
}

export function menuTagLabel(tag: MenuTag): string {
  return isBuiltInMenuTag(tag) ? BUILT_IN_TAG_LABELS[tag] : tag;
}

export function isMenuTagActive(item: Pick<MenuItem, "tagMeta">, tag: MenuTag, now = new Date()): boolean {
  const expiresAt = item.tagMeta?.[tag]?.expiresAt;
  if (!expiresAt) return true;
  const time = Date.parse(expiresAt);
  return Number.isFinite(time) ? time >= startOfToday(now).getTime() : true;
}

export function activeMenuTags(item: Pick<MenuItem, "tags" | "tagMeta">, now = new Date()): MenuTag[] {
  return (item.tags ?? []).filter((tag) => isMenuTagActive(item, tag, now));
}

export function defaultExpiryDate(daysFromToday: number): string {
  const date = startOfToday(new Date());
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
