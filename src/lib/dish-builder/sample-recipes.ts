import type { DishRecipe } from "./types";

// Ricette di esempio per la pagina demo del modulo. Non sono dati di nessun tenant:
// ogni locale definisce le proprie ricette con prezzi, ingredienti e ritagli fotografici.

export const SAMPLE_PIZZA: DishRecipe = {
  id: "pizza",
  name: { it: "Pizza componibile", en: "Build-your-own pizza" },
  title: { it: "Componi la tua pizza", en: "Build your pizza" },
  totalLabel: { it: "La tua pizza", en: "Your pizza" },
  layout: "disc",
  basePrice: 4,
  baseArt: { primary: "#e2b26c", secondary: "#c8321e", tertiary: "#6b3a17" },
  choices: [
    {
      id: "size",
      label: { it: "Taglia", en: "Size" },
      defaultOptionId: "m",
      options: [
        { id: "s", label: { it: "Baby", en: "Baby" }, shortLabel: "S", priceDelta: -1, scale: 0.84, ingredientPriceFactor: 0.8 },
        { id: "m", label: { it: "Classica", en: "Classic" }, shortLabel: "M" },
        { id: "l", label: { it: "Maxi", en: "Large" }, shortLabel: "L", priceDelta: 2.5, scale: 1.12, ingredientPriceFactor: 1.5 },
      ],
    },
    {
      id: "base",
      label: { it: "Base", en: "Base" },
      defaultOptionId: "rossa",
      options: [
        { id: "rossa", label: { it: "Rossa", en: "Tomato" } },
        { id: "bianca", label: { it: "Bianca", en: "White" }, baseArt: { secondary: "#f3e7cf" } },
      ],
    },
  ],
  groups: [
    {
      id: "formaggi",
      label: { it: "Formaggi", en: "Cheese" },
      ingredients: [
        { id: "mozzarella", name: { it: "Mozzarella", en: "Mozzarella" }, price: 1, art: { shape: "chunk", color: "#fbf7ec", accent: "#e8dcc0", count: 9 } },
        { id: "bufala", name: { it: "Bufala", en: "Buffalo mozzarella" }, price: 2, art: { shape: "chunk", color: "#ffffff", accent: "#ece6d6", count: 6, size: 1.3 } },
        { id: "gorgonzola", name: { it: "Gorgonzola", en: "Gorgonzola" }, price: 1, art: { shape: "chunk", color: "#f1ead2", accent: "#6f8f6a", count: 7 } },
        { id: "parmigiano", name: { it: "Parmigiano", en: "Parmesan" }, price: 0.8, art: { shape: "shred", color: "#f4dc94", count: 14 } },
      ],
    },
    {
      id: "salumi",
      label: { it: "Salumi", en: "Cured meats" },
      ingredients: [
        { id: "salame-piccante", name: { it: "Salame piccante", en: "Spicy salami" }, price: 1.5, art: { shape: "round-slice", color: "#7e1a14", accent: "#f3cfc0", count: 8 } },
        { id: "prosciutto-cotto", name: { it: "Prosciutto cotto", en: "Ham" }, price: 1.5, art: { shape: "strip", color: "#f2a7a0", accent: "#fbe3dc", count: 5 } },
        { id: "nduja", name: { it: "'Nduja", en: "'Nduja" }, price: 1.5, art: { shape: "chunk", color: "#a51f13", accent: "#d9502e", count: 7, size: 0.8 } },
      ],
    },
    {
      id: "verdure",
      label: { it: "Verdure", en: "Vegetables" },
      ingredients: [
        { id: "funghi", name: { it: "Funghi", en: "Mushrooms" }, price: 1, art: { shape: "wedge", color: "#c9a77c", accent: "#6e4d2c", count: 8 } },
        { id: "olive", name: { it: "Olive nere", en: "Black olives" }, price: 0.8, art: { shape: "ring", color: "#3b322e", accent: "#8a7d74", count: 10, size: 0.6 } },
        { id: "cipolla", name: { it: "Cipolla rossa", en: "Red onion" }, price: 0.6, art: { shape: "ring", color: "#9b3e74", accent: "#e8c6dc", count: 7 } },
        { id: "peperoni", name: { it: "Peperoni", en: "Peppers" }, price: 1, art: { shape: "strip", color: "#e0a21b", accent: "#c3361f", count: 7, size: 0.7 } },
      ],
    },
    {
      id: "finiture",
      label: { it: "Erbe e finiture", en: "Herbs & finishes" },
      ingredients: [
        { id: "basilico", name: { it: "Basilico", en: "Basil" }, price: 0.5, art: { shape: "leaf", color: "#3f9b3a", accent: "#2a6e27", count: 6 } },
        { id: "rucola", name: { it: "Rucola", en: "Rocket" }, price: 0.8, art: { shape: "leaf", color: "#5c8f2f", accent: "#3a6519", count: 12, size: 0.7 }, maxPortions: 1 },
        { id: "origano", name: { it: "Origano", en: "Oregano" }, price: 0.3, art: { shape: "crumb", color: "#6f7a37", count: 40 }, maxPortions: 1 },
      ],
    },
    {
      id: "salse",
      label: { it: "Creme e salse", en: "Creams & sauces" },
      ingredients: [
        { id: "olio-piccante", name: { it: "Olio piccante", en: "Chilli oil" }, price: 0.5, art: { shape: "drizzle", color: "#e2451d" } },
        { id: "crema-pistacchio", name: { it: "Crema di pistacchio", en: "Pistachio cream" }, price: 1.5, art: { shape: "drizzle", color: "#9cbf3b" } },
      ],
    },
  ],
  maxTotalPortions: 14,
};

export const SAMPLE_BURGER: DishRecipe = {
  id: "burger",
  name: "Smash burger componibile",
  title: "Costruisci il tuo burger",
  totalLabel: "Il tuo burger",
  layout: "stack",
  basePrice: 6,
  baseArt: { primary: "#d9903f", secondary: "#f6d9a8", tertiary: "#fff6dc" },
  choices: [
    {
      id: "pane",
      label: "Pane",
      defaultOptionId: "brioche",
      options: [
        { id: "brioche", label: "Brioche" },
        { id: "integrale", label: "Integrale", priceDelta: 0.5, baseArt: { primary: "#8a5a2e", secondary: "#c99a6a" } },
        { id: "nero", label: "Nero", priceDelta: 1, baseArt: { primary: "#2b2523", secondary: "#4a403b" } },
      ],
    },
  ],
  groups: [
    {
      id: "carne",
      label: "Carne",
      hint: "Almeno un patty",
      min: 1,
      max: 3,
      ingredients: [
        { id: "smash", name: "Smash patty", price: 3, art: { shape: "patty", color: "#5a2f1a", accent: "#2e160b" }, maxPortions: 3 },
        { id: "pollo", name: "Pollo croccante", price: 3, art: { shape: "patty", color: "#c98b3a", accent: "#8f5a1e" } },
        { id: "bacon", name: "Bacon", price: 1.5, art: { shape: "strip", color: "#b5483a", accent: "#f2c9b6" } },
      ],
    },
    {
      id: "formaggio",
      label: "Formaggio",
      ingredients: [
        { id: "cheddar", name: "Cheddar", price: 1, art: { shape: "cheese-slice", color: "#f29a1d", accent: "#d97a0c" } },
        { id: "provola", name: "Provola", price: 1.2, art: { shape: "cheese-slice", color: "#f4e7c4", accent: "#c7a35f" } },
      ],
    },
    {
      id: "verdure",
      label: "Verdure",
      ingredients: [
        { id: "lattuga", name: "Lattuga", price: 0.5, art: { shape: "leaf", color: "#79b84a", accent: "#4b8a2b" } },
        { id: "pomodoro", name: "Pomodoro", price: 0.5, art: { shape: "round-slice", color: "#d9372a", accent: "#f7a08f" } },
        { id: "cipolla", name: "Cipolla rossa", price: 0.5, art: { shape: "ring", color: "#9b3e74", accent: "#e8c6dc" } },
        { id: "pickles", name: "Pickles", price: 0.5, art: { shape: "round-slice", color: "#7c9a2e", accent: "#c7d77a" } },
      ],
    },
    {
      id: "salse",
      label: "Salse",
      max: 2,
      ingredients: [
        { id: "house", name: "House sauce", price: 0.5, art: { shape: "spread", color: "#e7a64b" }, maxPortions: 1 },
        { id: "ketchup", name: "Ketchup", price: 0.3, art: { shape: "spread", color: "#c8231b" }, maxPortions: 1 },
        { id: "maionese-aglio", name: "Maionese all'aglio", price: 0.5, art: { shape: "spread", color: "#f5ecd2" }, maxPortions: 1 },
      ],
    },
  ],
  maxTotalPortions: 9,
};

export const SAMPLE_POKE: DishRecipe = {
  id: "poke",
  name: "Poke componibile",
  title: "Componi la tua poke",
  totalLabel: "La tua poke",
  layout: "bowl",
  basePrice: 7,
  baseArt: { primary: "#f4efe6", secondary: "#fbfaf4", tertiary: "#1d1d1f" },
  choices: [
    {
      id: "formato",
      label: "Formato",
      defaultOptionId: "regular",
      options: [
        { id: "regular", label: "Regular", shortLabel: "R" },
        { id: "large", label: "Large", shortLabel: "L", priceDelta: 2.5, scale: 1.1 },
      ],
    },
    {
      id: "base",
      label: "Base",
      defaultOptionId: "riso",
      options: [
        { id: "riso", label: "Riso sushi" },
        { id: "venere", label: "Riso venere", priceDelta: 0.5, baseArt: { secondary: "#3b2a3f" } },
        { id: "insalata", label: "Insalata", baseArt: { secondary: "#8cc063" } },
      ],
    },
  ],
  groups: [
    {
      id: "proteine",
      label: "Proteine",
      hint: "Scegline almeno una",
      min: 1,
      max: 2,
      ingredients: [
        { id: "salmone", name: "Salmone", price: 3, art: { shape: "cube", color: "#f2875a", accent: "#ffd3be", count: 7 } },
        { id: "tonno", name: "Tonno", price: 3.5, art: { shape: "cube", color: "#b3263a", accent: "#e46e7a", count: 7 } },
        { id: "gamberi", name: "Gamberi", price: 3, art: { shape: "ring", color: "#f49a76", accent: "#fff0e6", count: 5, size: 1.2 } },
        { id: "tofu", name: "Tofu", price: 2, art: { shape: "cube", color: "#f3ead0", accent: "#d6c9a2", count: 7 } },
      ],
    },
    {
      id: "toppings",
      label: "Topping",
      max: 5,
      ingredients: [
        { id: "avocado", name: "Avocado", price: 1.2, art: { shape: "wedge", color: "#a8c94f", accent: "#e8eda1", count: 5 } },
        { id: "edamame", name: "Edamame", price: 0.8, art: { shape: "dot", color: "#6fae3b", count: 18 } },
        { id: "mais", name: "Mais", price: 0.5, art: { shape: "dot", color: "#f4c430", count: 22, size: 0.8 } },
        { id: "cetriolo", name: "Cetriolo", price: 0.5, art: { shape: "round-slice", color: "#9ac26a", accent: "#e4f0c2", count: 6 } },
        { id: "mango", name: "Mango", price: 1, art: { shape: "cube", color: "#ffb02e", accent: "#ffd685", count: 7 } },
        { id: "cavolo", name: "Cavolo viola", price: 0.5, art: { shape: "shred", color: "#7d3f8c", count: 16 } },
        { id: "wakame", name: "Alghe wakame", price: 1, art: { shape: "leaf", color: "#3e7f2c", accent: "#2c5c1f", count: 6 } },
      ],
    },
    {
      id: "crunch",
      label: "Crunch",
      ingredients: [
        { id: "sesamo", name: "Sesamo", price: 0.3, art: { shape: "crumb", color: "#efe1bd", count: 50 }, maxPortions: 1 },
        { id: "cipolla-croccante", name: "Cipolla croccante", price: 0.5, art: { shape: "crumb", color: "#c98a3a", count: 30, size: 1.6 }, maxPortions: 1 },
      ],
    },
    {
      id: "salse",
      label: "Salse",
      max: 2,
      ingredients: [
        { id: "teriyaki", name: "Teriyaki", price: 0.5, art: { shape: "drizzle", color: "#5b2d14" }, maxPortions: 1 },
        { id: "spicy-mayo", name: "Spicy mayo", price: 0.5, art: { shape: "drizzle", color: "#f08a4b" }, maxPortions: 1 },
        { id: "ponzu", name: "Ponzu", price: 0.5, art: { shape: "drizzle", color: "#c99a3d" }, maxPortions: 1 },
      ],
    },
  ],
};

export const SAMPLE_PASTA: DishRecipe = {
  id: "pasta",
  name: "Pasta componibile",
  title: "Componi la tua pasta",
  totalLabel: "La tua pasta",
  layout: "nest",
  basePrice: 6,
  baseArt: { primary: "#f6f2ea", secondary: "#f0c96a", tertiary: "#d8cfbf" },
  choices: [
    {
      id: "formato",
      label: "Formato",
      defaultOptionId: "spaghetti",
      options: [
        { id: "spaghetti", label: "Spaghetti" },
        { id: "rigatoni", label: "Rigatoni", baseArt: { secondary: "#ecc067" } },
        { id: "integrale", label: "Integrale", priceDelta: 0.5, baseArt: { secondary: "#b98a52" } },
      ],
    },
  ],
  groups: [
    {
      id: "sugo",
      label: "Sugo",
      hint: "Scegli il condimento",
      min: 1,
      max: 1,
      ingredients: [
        { id: "pomodoro", name: "Pomodoro", price: 1, art: { shape: "drizzle", color: "#c7321f" }, maxPortions: 1 },
        { id: "pesto", name: "Pesto", price: 1.5, art: { shape: "drizzle", color: "#5f9a2c" }, maxPortions: 1 },
        { id: "burro-salvia", name: "Burro e salvia", price: 1, art: { shape: "drizzle", color: "#f3d27a" }, maxPortions: 1 },
      ],
    },
    {
      id: "aggiunte",
      label: "Aggiunte",
      ingredients: [
        { id: "guanciale", name: "Guanciale", price: 2, art: { shape: "cube", color: "#e9c3a5", accent: "#a3412c", count: 9, size: 0.7 } },
        { id: "pomodorini", name: "Pomodorini", price: 1, art: { shape: "round-slice", color: "#e0331f", accent: "#ffb39e", count: 6, size: 0.8 } },
        { id: "burrata", name: "Burrata", price: 3, art: { shape: "egg", color: "#ffffff", accent: "#ece5d2", count: 1, size: 2.4 }, maxPortions: 1 },
        { id: "zucchine", name: "Zucchine", price: 1, art: { shape: "round-slice", color: "#5f8f3a", accent: "#e4efc0", count: 7, size: 0.8 } },
        { id: "gamberi", name: "Gamberi", price: 3, art: { shape: "ring", color: "#f49a76", accent: "#fff0e6", count: 4 } },
      ],
    },
    {
      id: "finiture",
      label: "Finiture",
      ingredients: [
        { id: "parmigiano", name: "Parmigiano", price: 0.8, art: { shape: "shred", color: "#f4dc94", count: 18 }, maxPortions: 2 },
        { id: "basilico", name: "Basilico", price: 0.3, art: { shape: "leaf", color: "#3f9b3a", accent: "#2a6e27", count: 4 } },
        { id: "pepe", name: "Pepe nero", price: 0, art: { shape: "crumb", color: "#2a2422", count: 40 }, maxPortions: 1 },
        { id: "pangrattato", name: "Pangrattato", price: 0.5, art: { shape: "crumb", color: "#d4a560", count: 40, size: 1.4 }, maxPortions: 1 },
      ],
    },
  ],
};

export const SAMPLE_RECIPES = [SAMPLE_PIZZA, SAMPLE_BURGER, SAMPLE_POKE, SAMPLE_PASTA];
