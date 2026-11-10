import type { CartLine } from "@/lib/types";
import { DISH_DEFAULT_LOCALE, dishText } from "./i18n";
import type {
  DishBlock,
  DishChoiceOption,
  DishGroup,
  DishIngredient,
  DishIssue,
  DishLinePayload,
  DishRecipe,
  DishState,
} from "./types";

export const DEFAULT_MAX_PORTIONS = 2;

export type DishIndex = {
  ingredients: Map<string, DishIngredient>;
  groupOf: Map<string, DishGroup>;
};

export function indexRecipe(recipe: DishRecipe): DishIndex {
  const ingredients = new Map<string, DishIngredient>();
  const groupOf = new Map<string, DishGroup>();
  for (const group of recipe.groups) {
    for (const ing of group.ingredients) {
      ingredients.set(ing.id, ing);
      groupOf.set(ing.id, group);
    }
  }
  return { ingredients, groupOf };
}

export function initialDishState(recipe: DishRecipe): DishState {
  const choices: Record<string, string> = {};
  for (const choice of recipe.choices ?? []) choices[choice.id] = choice.defaultOptionId;
  return { choices, picks: [...(recipe.initialPicks ?? [])] };
}

export function countPicks(picks: string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const id of picks) out.set(id, (out.get(id) ?? 0) + 1);
  return out;
}

export function selectedOptions(recipe: DishRecipe, state: DishState): DishChoiceOption[] {
  const out: DishChoiceOption[] = [];
  for (const choice of recipe.choices ?? []) {
    const id = state.choices[choice.id] ?? choice.defaultOptionId;
    const option = choice.options.find((o) => o.id === id) ?? choice.options[0];
    if (option) out.push(option);
  }
  return out;
}

export function ingredientPriceFactor(recipe: DishRecipe, state: DishState): number {
  return selectedOptions(recipe, state).reduce((f, o) => f * (o.ingredientPriceFactor ?? 1), 1);
}

/** Perche' non si puo' aggiungere una porzione di `id`, oppure null se si puo'. */
export function addBlockReason(
  recipe: DishRecipe,
  index: DishIndex,
  state: DishState,
  id: string,
): DishBlock | null {
  const ing = index.ingredients.get(id);
  if (!ing) return { code: "unknown" };
  if (ing.available === false) return { code: "unavailable", ingredientId: id };
  const counts = countPicks(state.picks);
  const max = ing.maxPortions ?? DEFAULT_MAX_PORTIONS;
  if ((counts.get(id) ?? 0) >= max) return { code: "maxPortions", ingredientId: id, max };
  const group = index.groupOf.get(id);
  if (group?.max != null) {
    const inGroup = state.picks.filter((p) => index.groupOf.get(p)?.id === group.id).length;
    if (inGroup >= group.max) return { code: "groupMax", groupId: group.id, max: group.max };
  }
  if (recipe.maxTotalPortions != null && state.picks.length >= recipe.maxTotalPortions) {
    return { code: "totalMax", max: recipe.maxTotalPortions };
  }
  return null;
}

export function addPick(state: DishState, id: string): DishState {
  return { ...state, picks: [...state.picks, id] };
}

/** Toglie l'ultima porzione aggiunta di `id`, lasciando intatto l'ordine delle altre. */
export function removePick(state: DishState, id: string): DishState {
  const at = state.picks.lastIndexOf(id);
  if (at < 0) return state;
  return { ...state, picks: [...state.picks.slice(0, at), ...state.picks.slice(at + 1)] };
}

export function setChoice(state: DishState, choiceId: string, optionId: string): DishState {
  return { ...state, choices: { ...state.choices, [choiceId]: optionId } };
}

export type DishPriceLine = {
  ingredient: DishIngredient;
  portions: number;
  paidPortions: number;
  total: number;
};

export type DishPrice = {
  base: number;
  choicesTotal: number;
  lines: DishPriceLine[];
  total: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceDish(recipe: DishRecipe, index: DishIndex, state: DishState): DishPrice {
  const options = selectedOptions(recipe, state);
  const factor = ingredientPriceFactor(recipe, state);
  const choicesTotal = options.reduce((s, o) => s + (o.priceDelta ?? 0), 0);
  const included = countPicks(recipe.includedPicks ?? []);
  const lines: DishPriceLine[] = [];
  for (const [id, portions] of countPicks(state.picks)) {
    const ingredient = index.ingredients.get(id);
    if (!ingredient) continue;
    const paidPortions = Math.max(0, portions - (included.get(id) ?? 0));
    lines.push({
      ingredient,
      portions,
      paidPortions,
      total: round2(paidPortions * ingredient.price * factor),
    });
  }
  const total = round2(recipe.basePrice + choicesTotal + lines.reduce((s, l) => s + l.total, 0));
  return { base: recipe.basePrice, choicesTotal: round2(choicesTotal), lines, total };
}

export function validateDish(recipe: DishRecipe, index: DishIndex, state: DishState): DishIssue[] {
  const issues: DishIssue[] = [];
  for (const group of recipe.groups) {
    if (!group.min) continue;
    const n = state.picks.filter((p) => index.groupOf.get(p)?.id === group.id).length;
    if (n < group.min) issues.push({ code: "groupMin", groupId: group.id, min: group.min });
  }
  return issues;
}

/** «salame piccante x2, funghi»: ripetizioni contate, ordine di prima aggiunta. */
export function describePicks(index: DishIndex, picks: string[], locale = DISH_DEFAULT_LOCALE): string {
  return [...countPicks(picks)]
    .map(([id, n]) => {
      const ing = index.ingredients.get(id);
      const name = ing ? dishText(ing.name, locale).toLowerCase() : id;
      return n > 1 ? `${name} x${n}` : name;
    })
    .join(", ");
}

/**
 * Riga pronta per `useCartStore.addLine`. I testi sono nella lingua della cucina
 * (`recipe.kitchenLocale`), non in quella del cliente: la comanda la legge il pizzaiolo.
 */
export function dishToCartLine(
  recipe: DishRecipe,
  index: DishIndex,
  state: DishState,
): Omit<CartLine, "lineId"> {
  const k = recipe.kitchenLocale ?? DISH_DEFAULT_LOCALE;
  const price = priceDish(recipe, index, state);
  let variantKey: string | undefined;
  let variantLabel: string | undefined;
  const variantSelections: NonNullable<CartLine["variantSelections"]> = [];
  for (const choice of recipe.choices ?? []) {
    const id = state.choices[choice.id] ?? choice.defaultOptionId;
    const option = choice.options.find((o) => o.id === id) ?? choice.options[0];
    if (option.cartVariant) {
      variantKey = option.cartVariant.key;
      variantLabel = dishText(option.cartVariant.label, k);
      continue;
    }
    variantSelections.push({
      groupId: choice.id,
      groupName: dishText(choice.label, k),
      optionId: option.id,
      optionName: dishText(option.label, k),
      price: option.priceDelta ?? 0,
    });
  }
  return {
    itemId: recipe.menuItemId ?? `dish:${recipe.id}`,
    categoryId: recipe.categoryId,
    name: dishText(recipe.name, k),
    qty: 1,
    variantKey,
    variantLabel,
    basePrice: recipe.basePrice,
    unitPrice: price.total,
    variantSelections,
    addedExtras: price.lines
      .filter((l) => l.paidPortions > 0)
      .map((l) => {
        const name = dishText(l.ingredient.name, k);
        return { id: l.ingredient.id, name: l.paidPortions > 1 ? `${name} x${l.paidPortions}` : name, price: l.total };
      }),
    dish: { recipeId: recipe.id, choices: { ...state.choices }, picks: [...state.picks] },
  };
}

/**
 * Controllo lato server: rigioca la composizione allegata alla riga con le regole della
 * ricetta e ricalcola il prezzo. Il client non puo' quindi inventare prezzi o superare i limiti.
 */
export function checkDishLine(
  recipe: DishRecipe,
  dish: DishLinePayload,
  line: Pick<CartLine, "unitPrice" | "itemId">,
): string | null {
  const index = indexRecipe(recipe);
  if ((recipe.menuItemId ?? `dish:${recipe.id}`) !== line.itemId) return "item_mismatch";
  const choices: Record<string, string> = {};
  for (const choice of recipe.choices ?? []) {
    const picked = dish.choices[choice.id] ?? choice.defaultOptionId;
    if (!choice.options.some((o) => o.id === picked)) return "invalid_choice";
    choices[choice.id] = picked;
  }
  let state: DishState = { choices, picks: [] };
  // Le porzioni iniziali della ricetta (es. la mozzarella della Margherita) non passano dai limiti.
  const initial = countPicks(recipe.initialPicks ?? []);
  for (const id of dish.picks) {
    const left = initial.get(id) ?? 0;
    if (left > 0) {
      initial.set(id, left - 1);
    } else if (addBlockReason(recipe, index, state, id)) {
      return "invalid_pick";
    }
    if (!index.ingredients.has(id)) return "invalid_pick";
    state = addPick(state, id);
  }
  if (validateDish(recipe, index, state).length > 0) return "incomplete";
  const expected = priceDish(recipe, index, state).total;
  if (Math.abs(expected - line.unitPrice) > 0.009) return "price_mismatch";
  return null;
}
