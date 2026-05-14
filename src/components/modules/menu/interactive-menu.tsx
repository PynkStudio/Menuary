"use client";

import { useEffect, useMemo } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MenuCardInteractive } from "@/components/modules/menu/menu-card-interactive";
import { MenuCategoryNav } from "@/components/modules/menu/menu-category-nav";
import { MenuDisclaimer } from "@/components/modules/menu/menu-disclaimer";
import {
  useMenuStore,
  selectCategoriesOrdered,
  selectItemsByCategory,
  selectVisibleMenuLists,
} from "@/store/menu-store";
import { useCartStore } from "@/store/cart-store";
import { useHydrated } from "@/components/core/providers";
import { useTenant } from "@/components/core/tenant-provider";

export function InteractiveMenu({
  showOnlyAvailable = true,
}: {
  showOnlyAvailable?: boolean;
}) {
  const hydrated = useHydrated();
  const tenant = useTenant();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("t");
  const setContext = useCartStore((s) => s.setContext);

  const categoriesRaw = useMenuStore((s) => s.categories);
  const items = useMenuStore((s) => s.items);
  const menuLists = useMenuStore((s) => s.menuLists);
  const currentTenantId = useMenuStore((s) => s.currentTenantId);
  const setTenantSeed = useMenuStore((s) => s.setTenantSeed);
  const cartContext = useCartStore((s) => s.context);
  const [selectedMenuListId, setSelectedMenuListId] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (currentTenantId === tenant.id) return;
    setTenantSeed(tenant.id);
  }, [currentTenantId, hydrated, setTenantSeed, tenant.id]);

  useEffect(() => {
    if (!hydrated) return;
    if (currentTenantId !== tenant.id) return;
    if (!tableParam) return;
    const n = Number(tableParam);
    if (Number.isNaN(n)) return;
    const ctx = useCartStore.getState().context;
    if (
      ctx.type === "tavolo" &&
      ctx.table === n &&
      ctx.sessionId == null &&
      ctx.tableId == null &&
      ctx.clientId == null
    ) {
      return;
    }
    setContext({ type: "tavolo", table: n });
  }, [tableParam, hydrated, setContext, currentTenantId, tenant.id]);

  const categories = useMemo(
    () => selectCategoriesOrdered({ categories: categoriesRaw } as never),
    [categoriesRaw],
  );

  const tableIdForMenus = cartContext.type === "tavolo" ? cartContext.tableId ?? null : null;

  const visibleMenuLists = useMemo(
    () => selectVisibleMenuLists(menuLists, { tableId: tableIdForMenus }),
    [menuLists, tableIdForMenus],
  );

  const selectedMenuList = useMemo(() => {
    if (visibleMenuLists.length === 0) return null;
    return (
      visibleMenuLists.find((list) => list.id === selectedMenuListId) ??
      visibleMenuLists[0]
    );
  }, [selectedMenuListId, visibleMenuLists]);

  useEffect(() => {
    if (!selectedMenuList) {
      setSelectedMenuListId(null);
      return;
    }
    setSelectedMenuListId((prev) =>
      prev && visibleMenuLists.some((list) => list.id === prev)
        ? prev
        : selectedMenuList.id,
    );
  }, [selectedMenuList, visibleMenuLists]);

  const activeItemIds = useMemo(
    () => (selectedMenuList ? new Set(selectedMenuList.itemIds) : null),
    [selectedMenuList],
  );

  const populatedCategories = useMemo(
    () =>
      categories
        .map((c) => ({
          ...c,
          items: selectItemsByCategory(items, c.id, showOnlyAvailable).filter((item) =>
            activeItemIds ? activeItemIds.has(item.id) : true,
          ),
        }))
        .filter((c) => c.items.length > 0),
    [activeItemIds, categories, items, showOnlyAvailable],
  );

  const categoryNavCategories = useMemo(
    () =>
      populatedCategories.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        items: [],
      })),
    [populatedCategories],
  );

  if (!hydrated || currentTenantId !== tenant.id) return null;

  return (
    <>
      <MenuCategoryNav categories={categoryNavCategories} />

      <div className="bg-pork-cream pb-[max(8rem,calc(6rem+env(safe-area-inset-bottom)))] pt-10">
        <div className="container-wide space-y-20">
          {visibleMenuLists.length > 1 && (
            <section className="space-y-3">
              <p className="impact-title text-xs text-pork-red">Menu disponibili</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {visibleMenuLists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => setSelectedMenuListId(list.id)}
                    className={
                      "shrink-0 rounded-full px-4 py-2 text-sm font-black transition " +
                      (selectedMenuList?.id === list.id
                        ? "bg-pork-red text-white shadow-md"
                        : "bg-white text-pork-ink/70 ring-1 ring-pork-ink/10 hover:text-pork-ink")
                    }
                  >
                    {list.name}
                  </button>
                ))}
              </div>
              {selectedMenuList?.description && (
                <p className="max-w-2xl text-sm text-pork-ink/60">
                  {selectedMenuList.description}
                </p>
              )}
            </section>
          )}

          {populatedCategories.map((category) => (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-[calc(10.5rem+env(safe-area-inset-top))] md:scroll-mt-[calc(11.5rem+env(safe-area-inset-top))]"
            >
              <header className="mb-8 flex flex-col gap-2 border-b-2 border-pork-ink/10 pb-4">
                <span className="impact-title text-sm text-pork-red">
                  {category.subtitle ?? "\u00A0"}
                </span>
                <h2 className="headline text-4xl sm:text-5xl lg:text-6xl text-balance">
                  {category.title}
                </h2>
              </header>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <MenuCardInteractive key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}

          <div className="space-y-6 pt-10">
            <MenuDisclaimer />
          </div>
        </div>
      </div>
    </>
  );
}
