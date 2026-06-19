import type {
  AdminMenuCategory,
  AdminMenuItem,
  MenuBundleSlot,
} from "@/lib/types";

export function hasMenuBundle(item: Pick<AdminMenuItem, "bundleSlots">): boolean {
  return (item.bundleSlots?.length ?? 0) > 0;
}

export function bundleSlotOptionGroups(
  slot: MenuBundleSlot,
  items: AdminMenuItem[],
  categories: AdminMenuCategory[],
): Array<{ categoryId: string; title: string; items: AdminMenuItem[] }> {
  const catMap = new Map(categories.map((c) => [c.id, c.title]));
  const groupMap = new Map<string, AdminMenuItem[]>();

  for (const cid of slot.sourceCategoryIds) {
    const catItems = items
      .filter((it) => it.categoryId === cid && it.available)
      .sort((a, b) => a.order - b.order);
    if (catItems.length > 0) groupMap.set(cid, catItems);
  }

  if (slot.sourceItemIds?.length) {
    const coveredIds = new Set([...groupMap.values()].flat().map((it) => it.id));
    for (const itemId of slot.sourceItemIds) {
      const item = items.find((it) => it.id === itemId && it.available);
      if (!item || coveredIds.has(item.id)) continue;
      const existing = groupMap.get(item.categoryId) ?? [];
      groupMap.set(
        item.categoryId,
        [...existing, item].sort((a, b) => a.order - b.order),
      );
      coveredIds.add(item.id);
    }
  }

  return [...groupMap.entries()]
    .map(([cid, itms]) => ({
      categoryId: cid,
      title: catMap.get(cid) ?? cid,
      items: itms,
    }))
    .filter((g) => g.items.length > 0);
}
