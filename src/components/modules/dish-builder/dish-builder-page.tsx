"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTenant } from "@/components/core/tenant-provider";
import { MenuActionOverlays } from "@/components/modules/menu/menu-action-overlays";
import { getTenantDishRecipes } from "@/lib/dish-builder/tenant-recipes";
import { DishBuilder } from "./dish-builder";

/** Pagina neutra per i tenant che non hanno ancora una pagina «Componi» propria. */
export function DishBuilderPage({ locale = "it" }: { locale?: string }) {
  const tenant = useTenant();
  const router = useRouter();
  const params = useSearchParams();
  const recipes = getTenantDishRecipes(tenant.id);
  const recipe = recipes.find((r) => r.id === params.get("piatto")) ?? recipes[0];
  if (!recipe) return null;
  const prefix = tenant.previewSlug ? `/${tenant.previewSlug}` : "";
  return (
    <main style={{ minHeight: "100dvh" }}>
      <DishBuilder recipe={recipe} locale={locale} onBack={() => router.push(`${prefix}/menu`)} />
      <MenuActionOverlays />
    </main>
  );
}
