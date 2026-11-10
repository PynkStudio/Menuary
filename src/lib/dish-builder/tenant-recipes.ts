import { KIMOS_PIZZA } from "./recipes/kimos";
import type { DishRecipe } from "./types";

// Ricette per tenant. Lo leggono sia le pagine sia l'API ordini, che ricalcola le righe
// «Componi il piatto»: una ricetta che non e' qui non puo' essere ordinata.
const TENANT_DISH_RECIPES: Record<string, DishRecipe[]> = {
  kimos: [KIMOS_PIZZA],
};

export function getTenantDishRecipes(tenantId: string): DishRecipe[] {
  return TENANT_DISH_RECIPES[tenantId] ?? [];
}

export function findTenantDishRecipe(tenantId: string, recipeId: string): DishRecipe | null {
  return getTenantDishRecipes(tenantId).find((r) => r.id === recipeId) ?? null;
}
