"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { libritechCatalog, type LibritechBook } from "@/lib/libritech-catalog";
import { useHydrated } from "@/components/core/providers";

const STORAGE_KEY = "libritech:eshop:v1";
const DEFAULT_STOCK = 12;

interface Book extends LibritechBook {
  stock: number;
  available: boolean;
}

function seed(): Book[] {
  return libritechCatalog.map((b) => ({
    ...b,
    stock: DEFAULT_STOCK,
    available: true,
  }));
}

function newId() {
  return `book-${Math.random().toString(36).slice(2, 8)}`;
}

export function LibritechListinoEditor() {
  const hydrated = useHydrated();
  const [books, setBooks] = useState<Book[]>(seed);
  const [persisted, setPersisted] = useState<Book[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Book[];
        setBooks(parsed);
        setPersisted(parsed);
      } else {
        setPersisted(seed());
      }
    } catch {
      setPersisted(seed());
    }
  }, [hydrated]);

  const dirty = useMemo(
    () => persisted !== null && JSON.stringify(books) !== JSON.stringify(persisted),
    [books, persisted],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q),
    );
  }, [books, search]);

  function update(id: string, patch: Partial<Book>) {
    setBooks((list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function add() {
    setBooks((list) => [
      {
        id: newId(),
        name: "Nuovo libro",
        description: "",
        price: 0,
        stock: 0,
        available: true,
        imageUrl: "",
      },
      ...list,
    ]);
  }

  function remove(id: string) {
    setBooks((list) => list.filter((b) => b.id !== id));
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
      setPersisted(JSON.parse(JSON.stringify(books)));
    } catch {
      /* ignore */
    }
  }

  if (!hydrated) {
    return <p style={{ color: "var(--ga-ink-faint)" }}>Caricamento...</p>;
  }

  const totalStock = books.reduce((sum, b) => sum + (b.stock || 0), 0);
  const outOfStock = books.filter((b) => (b.stock || 0) === 0).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="ga-eyebrow">eShop · Catalogo libri</span>
          <h1 className="ga-heading">Libri in vendita</h1>
          <p className="ga-lead">
            Gestisci il catalogo libri della libreria online: foto, titolo, descrizione, prezzo e disponibilità in magazzino.
          </p>
        </div>
        <button type="button" disabled={!dirty} onClick={save} className="ga-btn ga-btn-primary">
          <Save size={15} /> Salva catalogo
        </button>
      </header>

      <section
        className="ga-card grid gap-3 sm:grid-cols-4"
        style={{ fontSize: 13, color: "var(--ga-ink-muted)" }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ga-ink)" }}>{books.length}</div>
          <div>libri in catalogo</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ga-ink)" }}>{totalStock}</div>
          <div>copie totali in magazzino</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ga-ink)" }}>{outOfStock}</div>
          <div>libri esauriti</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ga-ink)" }}>
            €{avgPrice(books)}
          </div>
          <div>prezzo medio</div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca libro per titolo o descrizione..."
          className="ga-input"
          style={{ flex: "1 1 280px" }}
        />
        <button type="button" onClick={add} className="ga-btn ga-btn-ghost">
          <Plus size={14} /> Nuovo libro
        </button>
      </div>

      <section className="space-y-3">
        {filtered.length === 0 && (
          <p style={{ color: "var(--ga-ink-faint)", fontSize: 13 }}>Nessun libro trovato.</p>
        )}
        {filtered.map((book) => (
          <article
            key={book.id}
            className="grid gap-3 rounded-xl p-3 sm:grid-cols-[88px_1.4fr_2fr_120px_110px_44px] sm:items-start"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--ga-border-soft)",
              opacity: book.available ? 1 : 0.55,
            }}
          >
            <div
              style={{
                aspectRatio: "3 / 4",
                borderRadius: 8,
                overflow: "hidden",
                background: "var(--ga-border-soft)",
              }}
            >
              {book.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.imageUrl}
                  alt={book.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </div>

            <div>
              <label className="ga-label-text">Titolo</label>
              <input
                value={book.name}
                onChange={(e) => update(book.id, { name: e.target.value })}
                className="ga-input"
              />
              <small className="ga-card-hint" style={{ marginTop: 6 }}>
                URL immagine
              </small>
              <input
                value={book.imageUrl}
                onChange={(e) => update(book.id, { imageUrl: e.target.value })}
                className="ga-input"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="ga-label-text">Descrizione</label>
              <textarea
                value={book.description}
                onChange={(e) => update(book.id, { description: e.target.value })}
                className="ga-textarea"
                rows={4}
              />
            </div>

            <div>
              <label className="ga-label-text">Prezzo (€)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={book.price}
                onChange={(e) => update(book.id, { price: Number(e.target.value) || 0 })}
                className="ga-input"
              />
            </div>

            <div>
              <label className="ga-label-text">Magazzino</label>
              <input
                type="number"
                min={0}
                value={book.stock}
                onChange={(e) => update(book.id, { stock: Math.max(0, Number(e.target.value) || 0) })}
                className="ga-input"
              />
              <label
                className="mt-2 flex items-center gap-2 text-xs"
                style={{ color: "var(--ga-ink-muted)" }}
              >
                <input
                  type="checkbox"
                  className="ga-checkbox"
                  checked={book.available}
                  onChange={(e) => update(book.id, { available: e.target.checked })}
                />
                In vendita
              </label>
            </div>

            <button
              type="button"
              onClick={() => remove(book.id)}
              aria-label="Elimina libro"
              className="ga-btn ga-btn-ghost"
              style={{ alignSelf: "start", padding: "10px 12px" }}
            >
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </section>

      <footer
        className="flex items-center justify-between border-t pt-4 text-xs"
        style={{ borderColor: "var(--ga-border-soft)", color: "var(--ga-ink-faint)" }}
      >
        <span>
          {filtered.length} libri visualizzati · {books.length} totali
        </span>
        {dirty ? (
          <span style={{ color: "var(--ga-accent)" }}>Modifiche non salvate</span>
        ) : (
          <span>Tutto salvato</span>
        )}
      </footer>
    </div>
  );
}

function avgPrice(books: Book[]): string {
  if (books.length === 0) return "0";
  const avg = books.reduce((a, b) => a + (b.price || 0), 0) / books.length;
  return avg.toFixed(2);
}
