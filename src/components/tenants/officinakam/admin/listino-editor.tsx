"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { officinaKamMenu } from "@/lib/tenant-menu-data";
import { useHydrated } from "@/components/core/providers";

const STORAGE_KEY = "officinakam:listino:v1";

type Price = { kind: "single"; value: number } | { kind: "range" };

interface Item {
  id: string;
  name: string;
  description: string;
  price: Price;
}

interface Category {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  items: Item[];
}

function seed(): Category[] {
  return officinaKamMenu.map((cat) => ({
    id: cat.id,
    title: cat.title,
    subtitle: cat.subtitle ?? "",
    description: cat.description ?? "",
    items: cat.items.map((it) => ({
      id: it.id,
      name: it.name,
      description: it.description ?? "",
      price:
        it.price.kind === "single"
          ? { kind: "single", value: it.price.value ?? 0 }
          : { kind: "range" },
    })),
  }));
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

export function OfficinakamListinoEditor() {
  const hydrated = useHydrated();
  const [categories, setCategories] = useState<Category[]>(seed);
  const [persisted, setPersisted] = useState<Category[] | null>(null);
  const [activeId, setActiveId] = useState<string>(officinaKamMenu[0]?.id ?? "");

  useEffect(() => {
    if (!hydrated) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Category[];
        setCategories(parsed);
        setPersisted(parsed);
      } else {
        setPersisted(seed());
      }
    } catch {
      setPersisted(seed());
    }
  }, [hydrated]);

  const dirty = useMemo(
    () => persisted !== null && JSON.stringify(categories) !== JSON.stringify(persisted),
    [categories, persisted],
  );

  const active = categories.find((c) => c.id === activeId) ?? categories[0];

  function updateItem(catId: string, itemId: string, patch: Partial<Item>) {
    setCategories((cats) =>
      cats.map((cat) =>
        cat.id !== catId
          ? cat
          : {
              ...cat,
              items: cat.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
            },
      ),
    );
  }

  function addItem(catId: string) {
    setCategories((cats) =>
      cats.map((cat) =>
        cat.id !== catId
          ? cat
          : {
              ...cat,
              items: [
                ...cat.items,
                {
                  id: newId(catId),
                  name: "Nuovo intervento",
                  description: "",
                  price: { kind: "single", value: 0 },
                },
              ],
            },
      ),
    );
  }

  function removeItem(catId: string, itemId: string) {
    setCategories((cats) =>
      cats.map((cat) =>
        cat.id !== catId ? cat : { ...cat, items: cat.items.filter((it) => it.id !== itemId) },
      ),
    );
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
      setPersisted(JSON.parse(JSON.stringify(categories)));
    } catch {
      /* ignore */
    }
  }

  if (!hydrated || !active) {
    return <p style={{ color: "var(--ga-ink-faint)" }}>Caricamento...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="ga-eyebrow">Listino servizi</span>
          <h1 className="ga-heading">Interventi e prezzi</h1>
          <p className="ga-lead">
            Prezzi indicativi IVA inclusa. Il preventivo finale dipende dal veicolo, dai ricambi e
            dalla diagnosi.
          </p>
        </div>
        <button
          type="button"
          disabled={!dirty}
          onClick={save}
          className="ga-btn ga-btn-primary"
        >
          <Save size={15} /> Salva listino
        </button>
      </header>

      <nav className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveId(cat.id)}
            className="ga-pill-link"
            data-active={cat.id === active.id}
            style={
              cat.id === active.id
                ? { background: "var(--ga-accent)", color: "var(--ga-accent-ink)", borderColor: "var(--ga-accent)" }
                : undefined
            }
          >
            {cat.title}
            <span style={{ marginLeft: 8, opacity: 0.6 }}>{cat.items.length}</span>
          </button>
        ))}
      </nav>

      <section className="ga-card">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="ga-card-title" style={{ fontSize: 18 }}>
              {active.title}
            </h2>
            <p className="ga-card-hint" style={{ marginTop: 4, fontSize: 12 }}>
              {active.subtitle}
            </p>
          </div>
          <button type="button" onClick={() => addItem(active.id)} className="ga-btn ga-btn-ghost">
            <Plus size={14} /> Aggiungi intervento
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {active.items.length === 0 && (
            <p style={{ color: "var(--ga-ink-faint)", fontSize: 13 }}>
              Nessun intervento. Aggiungi il primo.
            </p>
          )}
          {active.items.map((item) => (
            <article
              key={item.id}
              className="grid gap-3 rounded-xl p-3 sm:grid-cols-[1fr_2fr_140px_44px] sm:items-start"
              style={{
                background: "var(--ga-surface)",
                border: "1px solid var(--ga-border-soft)",
              }}
            >
              <div>
                <label className="ga-label-text">Nome intervento</label>
                <input
                  value={item.name}
                  onChange={(e) => updateItem(active.id, item.id, { name: e.target.value })}
                  className="ga-input"
                />
                <small className="ga-card-hint" style={{ marginTop: 6 }}>
                  Codice: {item.id}
                </small>
              </div>
              <div>
                <label className="ga-label-text">Descrizione</label>
                <textarea
                  value={item.description}
                  onChange={(e) =>
                    updateItem(active.id, item.id, { description: e.target.value })
                  }
                  className="ga-textarea"
                  rows={2}
                />
              </div>
              <div>
                <label className="ga-label-text">Prezzo (€)</label>
                <input
                  type="number"
                  min={0}
                  value={item.price.kind === "single" ? item.price.value : 0}
                  disabled={item.price.kind !== "single"}
                  onChange={(e) =>
                    updateItem(active.id, item.id, {
                      price: { kind: "single", value: Number(e.target.value) || 0 },
                    })
                  }
                  className="ga-input"
                />
                <label
                  className="mt-2 flex items-center gap-2 text-xs"
                  style={{ color: "var(--ga-ink-muted)" }}
                >
                  <input
                    type="checkbox"
                    className="ga-checkbox"
                    checked={item.price.kind === "range"}
                    onChange={(e) =>
                      updateItem(active.id, item.id, {
                        price: e.target.checked ? { kind: "range" } : { kind: "single", value: 0 },
                      })
                    }
                  />
                  Da preventivo
                </label>
              </div>
              <button
                type="button"
                onClick={() => removeItem(active.id, item.id)}
                aria-label="Elimina intervento"
                className="ga-btn ga-btn-ghost"
                style={{ alignSelf: "start", padding: "10px 12px" }}
              >
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </div>

        <footer
          className="mt-6 flex items-center justify-between border-t pt-4 text-xs"
          style={{ borderColor: "var(--ga-border-soft)", color: "var(--ga-ink-faint)" }}
        >
          <span>{active.items.length} interventi · prezzo medio {avgPrice(active.items)}</span>
          {dirty ? (
            <span style={{ color: "var(--ga-accent)" }}>Modifiche non salvate</span>
          ) : (
            <span>Tutto salvato</span>
          )}
        </footer>
      </section>
    </div>
  );
}

function avgPrice(items: Item[]): string {
  const singles = items.flatMap((it) => (it.price.kind === "single" ? [it.price.value] : []));
  if (singles.length === 0) return "—";
  const avg = Math.round(singles.reduce((a, b) => a + b, 0) / singles.length);
  return `€${avg}`;
}
