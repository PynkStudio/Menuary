import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ShopCartLine = {
  lineId: string;
  bookId: string;
  name: string;
  price: number;
  imageUrl: string;
  qty: number;
};

type ShopCartState = {
  lines: ShopCartLine[];
  openDrawer: boolean;
  addLine: (book: Omit<ShopCartLine, "lineId" | "qty">) => void;
  incLine: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export function shopCartTotal(lines: ShopCartLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
}

export function shopCartCount(lines: ShopCartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export const useShopCartStore = create<ShopCartState>()(
  persist(
    (set) => ({
      lines: [],
      openDrawer: false,

      addLine(book) {
        set((s) => {
          const existing = s.lines.find((l) => l.bookId === book.bookId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.bookId === book.bookId ? { ...l, qty: l.qty + 1 } : l,
              ),
              openDrawer: true,
            };
          }
          return {
            lines: [
              ...s.lines,
              {
                lineId: `sc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
                qty: 1,
                ...book,
              },
            ],
            openDrawer: true,
          };
        });
      },

      incLine(lineId, delta) {
        set((s) => ({
          lines: s.lines
            .map((l) => (l.lineId === lineId ? { ...l, qty: l.qty + delta } : l))
            .filter((l) => l.qty > 0),
        }));
      },

      removeLine(lineId) {
        set((s) => ({ lines: s.lines.filter((l) => l.lineId !== lineId) }));
      },

      clear() {
        set({ lines: [], openDrawer: false });
      },

      setOpen(open) {
        set({ openDrawer: open });
      },
    }),
    { name: "lt-shop-cart-v1" },
  ),
);
