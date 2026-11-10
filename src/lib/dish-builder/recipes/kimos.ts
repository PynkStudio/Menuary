import type { DishIngredient, DishRecipe } from "../types";

// Pizza componibile di Pizzeria Kimos. Si parte dalla Margherita del listino Supabase
// (`pizza-03-margherita`, Normale 6 € / Gigante 19 €): l'ordine passa la validazione del
// menu attivo e la comanda esce come «Margherita (Gigante)» con le aggiunte.
// Ingredienti presi dalle pizze del listino Kimos. Prezzi: i 4 «Supplementi pizza» del
// listino costano 2 €; gli altri 1,50 € e il fattore Gigante x2 sono DA CONFERMARE con Kimos.

const STD = 1.5;
const SUPPLEMENTO = 2;

const cheese = (id: string, name: string, art: DishIngredient["art"], price = STD): DishIngredient => ({
  id,
  name,
  price,
  art,
  allergens: ["latte"],
});

export const KIMOS_PIZZA: DishRecipe = {
  id: "pizza",
  name: "Margherita",
  title: "Componi la tua pizza",
  subtitle: "Parti dalla Margherita, aggiungi quello che vuoi.",
  totalLabel: "La tua pizza",
  kitchenLocale: "it",
  layout: "disc",
  menuItemId: "pizza-03-margherita",
  categoryId: "pizze",
  coverImage: "/kimos/pizza-margherita.jpg",
  basePrice: 6,
  baseArt: { primary: "#e4b06a", secondary: "#c23a2a", tertiary: "#5b2f12" },
  choices: [
    {
      id: "formato",
      label: "Formato",
      defaultOptionId: "normale",
      options: [
        { id: "normale", label: "Normale", cartVariant: { key: "small", label: "Normale" } },
        {
          id: "gigante",
          label: "Gigante",
          priceDelta: 13,
          scale: 1.12,
          ingredientPriceFactor: 2,
          cartVariant: { key: "large", label: "Gigante" },
        },
      ],
    },
    {
      id: "base",
      label: "Base",
      defaultOptionId: "rossa",
      options: [
        { id: "rossa", label: "Rossa" },
        { id: "bianca", label: "Bianca", baseArt: { secondary: "#f4e9d3" } },
      ],
    },
  ],
  initialPicks: ["mozzarella"],
  includedPicks: ["mozzarella"],
  maxTotalPortions: 12,
  groups: [
    {
      id: "formaggi",
      label: "Formaggi",
      ingredients: [
        cheese("mozzarella", "Mozzarella", { shape: "chunk", color: "#fbf6ea", accent: "#e6d9bc", count: 9 }),
        cheese("bufala", "Mozzarella di bufala", { shape: "chunk", color: "#ffffff", accent: "#ebe3d0", count: 6, size: 1.35 }, SUPPLEMENTO),
        cheese("scamorza", "Scamorza", { shape: "chunk", color: "#e9c47e", accent: "#b9813a", count: 7 }),
        cheese("gorgonzola", "Gorgonzola", { shape: "chunk", color: "#f1ead2", accent: "#6f8f6a", count: 7 }),
        cheese("brie", "Brie", { shape: "wedge", color: "#f5ecd2", accent: "#e1cfa0", count: 5 }),
        cheese("caprino", "Caprino", { shape: "egg", color: "#fbfaf3", accent: "#e9e4d4", count: 5, size: 0.55 }),
        cheese("stracchino", "Stracchino", { shape: "chunk", color: "#fffaf0", accent: "#efe4c8", count: 6, size: 1.15 }),
        cheese("ricotta", "Ricotta", { shape: "chunk", color: "#ffffff", accent: "#f0ece2", count: 7, size: 0.9 }),
        cheese("grana", "Grana", { shape: "shred", color: "#f2d98c", count: 16 }),
      ],
    },
    {
      id: "salumi",
      label: "Salumi e carne",
      ingredients: [
        { id: "prosciutto-cotto", name: "Prosciutto cotto", price: STD, art: { shape: "strip", color: "#f0a49b", accent: "#fbe1da", count: 5 } },
        { id: "prosciutto-crudo", name: "Prosciutto crudo", price: SUPPLEMENTO, art: { shape: "strip", color: "#c9473f", accent: "#f6d3c6", count: 5 } },
        { id: "salame-piccante", name: "Salame piccante", price: STD, badges: ["Piccante"], art: { shape: "round-slice", color: "#7e1a14", accent: "#f3cfc0", count: 8 } },
        { id: "salame-dolce", name: "Salame dolce", price: STD, art: { shape: "round-slice", color: "#9b3a33", accent: "#f6d6cb", count: 8 } },
        { id: "speck", name: "Speck", price: STD, art: { shape: "strip", color: "#8a2f28", accent: "#f2d6c9", count: 5 } },
        { id: "pancetta", name: "Pancetta", price: STD, art: { shape: "cube", color: "#f1cdb0", accent: "#a3412c", count: 10, size: 0.65 } },
        { id: "salsiccia", name: "Salsiccia", price: STD, art: { shape: "chunk", color: "#a0523c", accent: "#6e3324", count: 9, size: 0.75 } },
        { id: "wurstel", name: "Würstel", price: STD, art: { shape: "round-slice", color: "#d9846a", accent: "#f0b39c", count: 9, size: 0.7 } },
        { id: "bresaola", name: "Bresaola", price: SUPPLEMENTO, art: { shape: "round-slice", color: "#7a1f2b", accent: "#b84a55", count: 6, size: 1.2 } },
        { id: "nduja", name: "'Nduja", price: STD, badges: ["Piccante"], art: { shape: "chunk", color: "#a51f13", accent: "#d9502e", count: 7, size: 0.75 } },
        { id: "kebab", name: "Kebab", price: STD, art: { shape: "strip", color: "#a8683a", accent: "#6d3f1d", count: 7, size: 0.7 } },
      ],
    },
    {
      id: "verdure",
      label: "Verdure",
      ingredients: [
        { id: "funghi", name: "Funghi freschi", price: STD, art: { shape: "wedge", color: "#d8bf9a", accent: "#7a5636", count: 8 } },
        { id: "porcini", name: "Porcini", price: SUPPLEMENTO, art: { shape: "wedge", color: "#9a6a3c", accent: "#e2c7a0", count: 6, size: 1.15 } },
        { id: "peperoni", name: "Peperoni grigliati", price: STD, art: { shape: "strip", color: "#e0a21b", accent: "#c3361f", count: 7, size: 0.7 } },
        { id: "melanzane", name: "Melanzane grigliate", price: STD, art: { shape: "round-slice", color: "#e9d7a8", accent: "#3b1f3b", count: 6, size: 1.1 } },
        { id: "zucchine", name: "Zucchine", price: STD, art: { shape: "round-slice", color: "#5f8f3a", accent: "#e4efc0", count: 7, size: 0.8 } },
        { id: "cipolla", name: "Cipolla", price: STD, art: { shape: "ring", color: "#c48ab0", accent: "#f2dcea", count: 7 } },
        { id: "carciofi", name: "Carciofi", price: STD, art: { shape: "wedge", color: "#a7b26b", accent: "#5f6b33", count: 6 } },
        { id: "radicchio", name: "Radicchio", price: STD, art: { shape: "leaf", color: "#8c1f3f", accent: "#f1d8e0", count: 7, size: 0.85 } },
        { id: "pomodorini", name: "Pomodorini", price: STD, art: { shape: "round-slice", color: "#e0331f", accent: "#ffb39e", count: 7, size: 0.8 } },
        { id: "asparagi", name: "Asparagi", price: STD, art: { shape: "strip", color: "#7c9a3b", accent: "#c6d68a", count: 6, size: 0.75 } },
        { id: "rucola", name: "Rucola", price: STD, art: { shape: "leaf", color: "#5c8f2f", accent: "#3a6519", count: 12, size: 0.7 }, maxPortions: 1 },
        { id: "patatine", name: "Patatine fritte", price: STD, art: { shape: "strip", color: "#f1c24b", accent: "#d39a26", count: 10, size: 0.55 } },
      ],
    },
    {
      id: "mare",
      label: "Dal mare",
      ingredients: [
        { id: "tonno", name: "Tonno", price: STD, allergens: ["pesce"], art: { shape: "chunk", color: "#c9a587", accent: "#8f6b51", count: 8, size: 0.8 } },
        { id: "gamberetti", name: "Gamberetti", price: STD, allergens: ["crostacei"], art: { shape: "ring", color: "#f49a76", accent: "#fff0e6", count: 7, size: 0.8 } },
        { id: "acciughe", name: "Acciughe", price: STD, allergens: ["pesce"], art: { shape: "strip", color: "#6b5547", accent: "#b9a08a", count: 6, size: 0.6 } },
        { id: "salmone", name: "Salmone affumicato", price: STD, allergens: ["pesce"], art: { shape: "strip", color: "#f2875a", accent: "#ffd3be", count: 5, size: 0.9 } },
      ],
    },
    {
      id: "finiture",
      label: "Finiture",
      ingredients: [
        { id: "origano", name: "Origano", price: 0, art: { shape: "crumb", color: "#6f7a37", count: 40 }, maxPortions: 1 },
        { id: "aglio", name: "Aglio", price: 0, art: { shape: "crumb", color: "#f6efd9", count: 24, size: 1.8 }, maxPortions: 1 },
        { id: "pesto", name: "Pesto", price: STD, art: { shape: "drizzle", color: "#5f9a2c" }, maxPortions: 1 },
        { id: "crema-tartufo", name: "Crema di tartufo", price: STD, art: { shape: "drizzle", color: "#5b4632" }, maxPortions: 1 },
      ],
    },
  ],
};
