import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ComponiBody } from "@/app/componi/componi-body";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { resolveTenantFeatures } from "@/lib/tenant-modules";
import { getTenantDishRecipes } from "@/lib/dish-builder/tenant-recipes";
import { dishText } from "@/lib/dish-builder/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = resolveTenantFromHost((await headers()).get("host"));
  const recipe = tenant ? getTenantDishRecipes(tenant.id)[0] : null;
  if (!tenant || !recipe) return { title: "Pagina non trovata", robots: { index: false, follow: false } };
  return { title: dishText(recipe.title, "it"), description: dishText(recipe.subtitle, "it") || undefined };
}

export default async function ComponiPage() {
  const tenant = resolveTenantFromHost((await headers()).get("host"));
  if (!tenant) notFound();
  if (!resolveTenantFeatures(tenant.features).dishBuilder || getTenantDishRecipes(tenant.id).length === 0) notFound();
  return <ComponiBody />;
}
