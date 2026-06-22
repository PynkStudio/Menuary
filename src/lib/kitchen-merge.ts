import { COPERTO_ITEM_ID, COPERTO_CATEGORY_ID } from "@/lib/coperto";
import type {
  AdminMenuCategory,
  AdminMenuItem,
  Order,
  OrderLine,
  OrderStatus,
} from "@/lib/types";

const ALTRO_CATEGORY_ID = "__bepork_kitchen_altro__";

function lineKey(l: OrderLine): string {
  const ex = (l.addedExtras ?? [])
    .map((e) => e.id)
    .sort()
    .join(",");
  const rm = [...(l.removedIngredients ?? [])].sort().join("|");
  const bp = (l.bundlePicks ?? [])
    .map((p) => `${p.slotId}:${p.choiceItemId}`)
    .sort()
    .join(",");
  const vs = (l.variantSelections ?? [])
    .map((p) => `${p.groupId}:${p.optionId}`)
    .sort()
    .join(",");
  return [
    l.itemId,
    l.categoryId ?? "",
    l.variantLabel ?? "",
    l.note ?? "",
    rm,
    ex,
    bp,
    vs,
  ].join("::");
}

function mergeLines(lines: OrderLine[]): OrderLine[] {
  const m = new Map<string, OrderLine>();
  for (const l of lines) {
    const k = lineKey(l);
    const cur = m.get(k);
    if (!cur) {
      m.set(k, { ...l });
    } else {
      const q = cur.qty + l.qty;
      m.set(k, {
        ...cur,
        qty: q,
        lineTotal: cur.unitPrice * q,
      });
    }
  }
  return [...m.values()];
}

function mergeOrderList(list: Order[]): Order {
  const sorted = [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const first = sorted[0];
  const mergedLines = mergeLines(sorted.flatMap((o) => o.lines));
  const total = mergedLines.reduce((a, l) => a + l.lineTotal, 0);
  const codes = sorted.map((o) => o.code).join(" + ");
  const oldest = sorted.reduce(
    (min, o) =>
      new Date(o.createdAt) < new Date(min) ? o.createdAt : min,
    first.createdAt,
  );

  return {
    ...first,
    id: first.id,
    code: codes,
    createdAt: oldest,
    dinerNickname: undefined,
    lines: mergedLines,
    total,
    notes:
      sorted
        .map((o) => o.notes)
        .filter(Boolean)
        .join(" · ") || undefined,
  };
}

function sortKitchenColumnGroups(
  groups: Array<{ ids: string[]; display: Order }>,
): Array<{ ids: string[]; display: Order }> {
  return [...groups].sort((a, b) => {
    const asportoA = a.display.type === "asporto" ? 1 : 0;
    const asportoB = b.display.type === "asporto" ? 1 : 0;
    if (asportoA !== asportoB) return asportoA - asportoB;
    return (
      new Date(a.display.createdAt).getTime() -
      new Date(b.display.createdAt).getTime()
    );
  });
}

/** Raggruppa ordini tavolo con stesso sessionId in un’unica card (solo UI). */
export function kitchenGroupsForColumn(
  orders: Order[],
  dinerSeparation: boolean,
): Array<{ ids: string[]; display: Order }> {
  if (dinerSeparation) {
    return sortKitchenColumnGroups(
      orders.map((o) => ({ ids: [o.id], display: o })),
    );
  }

  const nonGrouped: Order[] = [];
  const bySession = new Map<string, Order[]>();

  for (const o of orders) {
    if (o.type === "tavolo" && o.sessionId) {
      const arr = bySession.get(o.sessionId) ?? [];
      arr.push(o);
      bySession.set(o.sessionId, arr);
    } else {
      nonGrouped.push(o);
    }
  }

  const out: Array<{ ids: string[]; display: Order }> = [];
  for (const o of nonGrouped) {
    out.push({ ids: [o.id], display: o });
  }
  for (const list of bySession.values()) {
    const ids = list.map((o) => o.id);
    if (list.length === 1) out.push({ ids, display: list[0] });
    else out.push({ ids, display: mergeOrderList(list) });
  }
  return sortKitchenColumnGroups(out);
}

/** Sezioni righe per tipologia (ordine come in menu admin). */
export type KitchenLineSection = { title: string; lines: OrderLine[] };

export function groupKitchenOrderLines(
  lines: OrderLine[],
  categories: AdminMenuCategory[],
  items: AdminMenuItem[],
): KitchenLineSection[] {
  const byItem = new Map(items.map((i) => [i.id, i.categoryId]));
  const sortedCats = [...categories].sort((a, b) => a.order - b.order);
  const orderIndex = new Map(sortedCats.map((c, i) => [c.id, i]));
  const titleById = new Map(categories.map((c) => [c.id, c.title]));

  function resolveCategoryId(line: OrderLine): string {
    if (line.itemId === COPERTO_ITEM_ID) return COPERTO_CATEGORY_ID;
    return line.categoryId ?? byItem.get(line.itemId) ?? ALTRO_CATEGORY_ID;
  }

  function sortKey(catId: string): number {
    if (catId === COPERTO_CATEGORY_ID) return 1_000_000;
    if (catId === ALTRO_CATEGORY_ID) return 999_000;
    return orderIndex.get(catId) ?? 999_500;
  }

  const byCat = new Map<string, OrderLine[]>();
  for (const l of lines) {
    const cid = resolveCategoryId(l);
    const arr = byCat.get(cid) ?? [];
    arr.push(l);
    byCat.set(cid, arr);
  }

  const unique = [...byCat.keys()].sort((a, b) => sortKey(a) - sortKey(b));

  return unique.map((cid) => {
    const title =
      cid === COPERTO_CATEGORY_ID
        ? "Coperto"
        : cid === ALTRO_CATEGORY_ID
          ? "Altro"
          : titleById.get(cid) ?? "Altro";
    return { title, lines: byCat.get(cid)! };
  });
}

export function advanceKitchenGroup(
  ids: string[],
  next: OrderStatus,
  update: (id: string, status: OrderStatus) => void,
) {
  ids.forEach((id) => update(id, next));
}

/** Somma tutte le righe degli ordini di una sessione (chiusura tavolo / riepilogo). */
export function aggregateOrderLinesForSession(orders: Order[]): {
  lines: OrderLine[];
  total: number;
} {
  const lines = mergeLines(orders.flatMap((o) => o.lines));
  const total = lines.reduce((a, l) => a + l.lineTotal, 0);
  return { lines, total };
}
