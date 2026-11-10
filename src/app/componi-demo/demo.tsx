"use client";

import { useState, type CSSProperties } from "react";
import { DishBuilder, type DishBuilderSubmit } from "@/components/modules/dish-builder/dish-builder";
import { SAMPLE_RECIPES } from "@/lib/dish-builder/sample-recipes";
import { dishText } from "@/lib/dish-builder/i18n";

// Due vesti d'esempio per mostrare che il modulo si personalizza solo con le variabili --db-*.
const THEMES: Record<string, CSSProperties> = {
  Notte: {},
  Giorno: {
    ["--db-bg" as string]: "#f6ecd9",
    ["--db-surface" as string]: "#fff8ea",
    ["--db-surface-2" as string]: "#fffdf7",
    ["--db-ink" as string]: "#1f2a6b",
    ["--db-muted" as string]: "rgba(31,42,107,0.6)",
    ["--db-line" as string]: "rgba(31,42,107,0.14)",
    ["--db-accent" as string]: "#2c3fd6",
    ["--db-selected" as string]: "#2c3fd6",
    ["--db-price" as string]: "#2c3fd6",
    ["--db-glow" as string]: "#ffd23f",
    ["--db-font-display" as string]: "ui-rounded, 'Arial Rounded MT Bold', system-ui, sans-serif",
  },
};

export function DishBuilderDemo() {
  const [recipeId, setRecipeId] = useState(SAMPLE_RECIPES[0].id);
  const [theme, setTheme] = useState("Notte");
  const [locale, setLocale] = useState("it");
  const [last, setLast] = useState<DishBuilderSubmit["line"] | null>(null);
  const recipe = SAMPLE_RECIPES.find((r) => r.id === recipeId)!;

  return (
    <main style={{ minHeight: "100dvh", background: "#0b0a09", padding: "16px 16px 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {SAMPLE_RECIPES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => { setRecipeId(r.id); setLast(null); }}
            style={pill(r.id === recipeId)}
          >
            {dishText(r.name, "it").replace(" componibile", "")}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        {["it", "en", "es", "fr", "de"].map((l) => (
          <button key={l} type="button" onClick={() => setLocale(l)} style={pill(l === locale)}>
            {l.toUpperCase()}
          </button>
        ))}
        {Object.keys(THEMES).map((t) => (
          <button key={t} type="button" onClick={() => setTheme(t)} style={pill(t === theme)}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", borderRadius: 28, overflow: "clip", minHeight: "80dvh" }}>
        <DishBuilder
          key={recipe.id}
          recipe={recipe}
          locale={locale}
          style={THEMES[theme]}
          onSubmit={({ line }) => setLast(line)}
        />
      </div>
      {last ? (
        <pre style={{ maxWidth: 1100, margin: "16px auto 0", color: "#d9d2c5", fontSize: 12, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(last, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}

function pill(active: boolean): CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.2)",
    background: active ? "#f6f1e8" : "transparent",
    color: active ? "#141210" : "#f6f1e8",
    fontWeight: 600,
    cursor: "pointer",
  };
}
