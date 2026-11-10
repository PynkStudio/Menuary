import type { CartLine } from "@/lib/types";
import { checkDishLine } from "./engine";
import { findTenantDishRecipe } from "./tenant-recipes";

export type DishLineError = { itemId: string; reason: string };

/** Ricalcola ogni riga «Componi il piatto» con la ricetta del tenant; ritorna le righe non valide. */
export function validateDishLines(tenantId: string, lines: CartLine[]): DishLineError[] {
  const errors: DishLineError[] = [];
  for (const line of lines) {
    if (!line.dish) continue;
    const recipe = findTenantDishRecipe(tenantId, line.dish.recipeId);
    const reason = recipe ? checkDishLine(recipe, line.dish, line) : "unknown_recipe";
    if (reason) errors.push({ itemId: line.itemId, reason });
  }
  return errors;
}
