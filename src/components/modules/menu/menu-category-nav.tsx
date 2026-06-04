"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/components/core/tenant-provider";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import type { MenuCategory } from "@/lib/menu-data";

export function MenuCategoryNav({
  categories,
  hasGlobalHeader = true,
}: {
  categories: MenuCategory[];
  hasGlobalHeader?: boolean;
}) {
  const tenant = useTenant();
  const tenantHref = useTenantLocalizedHref();
  const router = useRouter();
  const isDoca = tenant.id === "doca";
  const [active, setActive] = useState<string>(categories[0]?.id ?? "");
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
  const categoryIds = categories.map((c) => c.id).join("|");

  useEffect(() => {
    const cats = categoriesRef.current;
    const first = cats[0]?.id ?? "";
    setActive((prev) => (cats.some((c) => c.id === prev) ? prev : first));

    const sections = cats
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categoryIds]);

  return (
    <div
      className={cn(
        "sticky z-30 -mx-5 overflow-x-hidden border-y border-pork-ink/10 bg-pork-cream/95 backdrop-blur-lg sm:-mx-8 lg:-mx-12",
        hasGlobalHeader
          ? "top-[calc(4.75rem+env(safe-area-inset-top))] md:top-[calc(5.5rem+env(safe-area-inset-top))]"
          : "top-0",
      )}
    >
      <div className="container-wide flex items-center gap-3">
        {!hasGlobalHeader && (
          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-full bg-pork-ink/8 px-3 text-sm font-bold text-pork-ink/70 transition hover:bg-pork-ink/15 hover:text-pork-ink"
            aria-label="Torna indietro"
          >
            <ArrowLeft size={15} />
            Indietro
          </button>
        )}
        <nav
          aria-label="Categorie del menu"
          className="touch-pan-x flex min-w-0 flex-1 gap-2 overflow-x-auto overscroll-x-contain py-4 pl-0.5 pr-1 [-webkit-overflow-scrolling:touch] md:py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className={cn(
                "shrink-0 snap-start rounded-full px-4 py-2.5 text-sm font-bold transition-all sm:py-2",
                active === c.id
                  ? "bg-pork-ink text-pork-cream shadow-md"
                  : "bg-transparent text-pork-ink/70 hover:bg-pork-ink/5 hover:text-pork-ink"
              )}
            >
              {c.title}
            </a>
          ))}
        </nav>
        {isDoca && (
          <Link href={tenantHref("/prenota")} className="btn-primary shrink-0 text-sm">
            <CalendarDays size={18} />
            Prenota ora
          </Link>
        )}
      </div>
    </div>
  );
}
