"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserLocalJSONStorage } from "@/lib/zustand-json-storage";
import type { BundlePick, CartLine, OrderType } from "@/lib/types";

const LEGACY_CART_KEY = "bepork-cart-v1";
const CART_KEY_PREFIX = "menuary-cart-v1";
const CART_FALLBACK_KEY = `${CART_KEY_PREFIX}:unscoped`;

let activeCartTenantId: string | null = null;

export function cartStorageKey(tenantId: string): string {
  return `${CART_KEY_PREFIX}:${tenantId}`;
}

function migrateLegacyCartStorage(tenantId: string, nextKey: string) {
  if (typeof window === "undefined" || tenantId !== "bepork") return;
  try {
    if (window.localStorage.getItem(nextKey)) return;
    const legacy = window.localStorage.getItem(LEGACY_CART_KEY);
    if (legacy) window.localStorage.setItem(nextKey, legacy);
  } catch {}
}

export interface CartContext {
  type: OrderType;
  table?: number;
  tableId?: string;
  tableLabel?: string;
  sessionId?: string;
  sessionCode?: string;
  clientId?: string;
  nickname?: string;
}

export interface CartState {
  lines: CartLine[];
  context: CartContext;
  openDrawer: boolean;
  setContext: (ctx: CartContext) => void;
  addLine: (line: Omit<CartLine, "lineId">) => void;
  incLine: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  replaceLine: (lineId: string, line: Omit<CartLine, "lineId">) => void;
  setLineNote: (lineId: string, note: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  /** Toglie una unità da una riga qualsiasi con questo `itemId` (ordine inverso delle righe). */
  decOneUnitOfItem: (itemId: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      context: { type: "asporto" },
      openDrawer: false,

      setContext: (ctx) => set({ context: ctx }),

      addLine: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => sameCustomization(l, line));
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.lineId === existing.lineId
                  ? { ...l, qty: l.qty + line.qty }
                  : l,
              ),
            };
          }
          const lineId = `cl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          return { lines: [...s.lines, { ...line, lineId }] };
        }),

      incLine: (lineId, delta) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.lineId === lineId ? { ...l, qty: l.qty + delta } : l))
            .filter((l) => l.qty > 0),
        })),

      removeLine: (lineId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.lineId !== lineId) })),

      replaceLine: (lineId, line) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.lineId === lineId ? { ...line, lineId } : l,
          ),
        })),

      setLineNote: (lineId, note) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.lineId === lineId
              ? { ...l, note: note.trim() ? note.trim() : undefined }
              : l,
          ),
        })),

      clear: () => set({ lines: [] }),

      setOpen: (openDrawer) => set({ openDrawer }),

      decOneUnitOfItem: (itemId) =>
        set((s) => {
          for (let i = s.lines.length - 1; i >= 0; i--) {
            const l = s.lines[i]!;
            if (l.itemId !== itemId || l.qty <= 0) continue;
            if (l.qty <= 1) {
              return {
                lines: s.lines.filter((_, j) => j !== i),
              };
            }
            return {
              lines: s.lines.map((x, j) =>
                j === i ? { ...x, qty: x.qty - 1 } : x,
              ),
            };
          }
          return s;
        }),
    }),
    {
      name: CART_FALLBACK_KEY,
      skipHydration: true,
      storage: createBrowserLocalJSONStorage(),
      partialize: (s) => ({ lines: s.lines, context: s.context }),
    },
  ),
);

export function getActiveCartTenantId(): string | null {
  return activeCartTenantId;
}

export async function activateCartTenantStorage(tenantId: string) {
  const nextKey = cartStorageKey(tenantId);
  if (activeCartTenantId === tenantId && useCartStore.persist.getOptions().name === nextKey) {
    return;
  }
  migrateLegacyCartStorage(tenantId, nextKey);
  activeCartTenantId = tenantId;
  useCartStore.persist.setOptions({ name: nextKey });
  useCartStore.setState({ lines: [], context: { type: "asporto" }, openDrawer: false });
  await useCartStore.persist.rehydrate();
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.unitPrice * l.qty, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.qty, 0);
}

export function cartQtyForItem(lines: CartLine[], itemId: string): number {
  return lines
    .filter((l) => l.itemId === itemId)
    .reduce((acc, l) => acc + l.qty, 0);
}

function sameSet(a?: string[], b?: string[]): boolean {
  const aa = [...(a ?? [])].sort().join("|");
  const bb = [...(b ?? [])].sort().join("|");
  return aa === bb;
}

function sameExtras(
  a?: Array<{ id: string }>,
  b?: Array<{ id: string }>,
): boolean {
  const aa = [...(a ?? [])].map((x) => x.id).sort().join("|");
  const bb = [...(b ?? [])].map((x) => x.id).sort().join("|");
  return aa === bb;
}

function bundleSig(p?: BundlePick[]): string {
  return [...(p ?? [])]
    .slice()
    .sort((x, y) => x.slotId.localeCompare(y.slotId))
    .map((x) => `${x.slotId}:${x.choiceItemId}`)
    .join("|");
}

function variantSelectionSig(p?: CartLine["variantSelections"]): string {
  return [...(p ?? [])]
    .slice()
    .sort((x, y) => x.groupId.localeCompare(y.groupId))
    .map((x) => `${x.groupId}:${x.optionId}`)
    .join("|");
}

function sameCustomization(
  a: CartLine,
  b: Omit<CartLine, "lineId">,
): boolean {
  return (
    a.itemId === b.itemId &&
    a.variantKey === b.variantKey &&
    (a.note ?? "") === (b.note ?? "") &&
    sameSet(a.removedIngredients, b.removedIngredients) &&
    sameExtras(a.addedExtras, b.addedExtras) &&
    bundleSig(a.bundlePicks) === bundleSig(b.bundlePicks) &&
    variantSelectionSig(a.variantSelections) === variantSelectionSig(b.variantSelections)
  );
}
