"use client";

import { useMemo, useState } from "react";
import { Globe, ImageIcon, Plus, Save, Sparkles, X } from "lucide-react";
import { resolveExtrasForItem } from "@/lib/extra-lists";
import type {
  AdminMenuItem,
  Extra,
  MenuAllergen,
  MenuTag,
  PiccanteLevel,
  TenantMenuTagDefinition,
} from "@/lib/types";
import { ALLERGEN_OPTIONS } from "@/lib/allergens";
import { PriceEditor } from "./price-editor";
import { ImageUpload } from "./image-upload";
import { useMenuStore } from "@/store/menu-store";
import { formatEuro } from "@/lib/price-utils";
import { normalizeMenuIngredients, type MenuIngredient } from "@/lib/ingredients";
import { defaultExpiryDate, isBuiltInMenuTag } from "@/lib/menu-tags";

const TAGS: { key: MenuTag; label: string }[] = [
  { key: "firma", label: "Firma" },
  { key: "piccante", label: "Piccante" },
  { key: "veg", label: "Veg" },
  { key: "novita", label: "Novità" },
];

const VEG_TAGS: MenuTag[] = ["veg", "vegano"];

export function ItemEditor({
  item,
  customTags = [],
  volumeLabelPresets = [],
  locales = ["it"],
  onClose,
}: {
  item: AdminMenuItem;
  customTags?: TenantMenuTagDefinition[];
  volumeLabelPresets?: string[];
  locales?: readonly string[];
  onClose: () => void;
}) {
  const updateItem = useMenuStore((s) => s.updateItem);
  const removeItem = useMenuStore((s) => s.removeItem);
  const extraLists = useMenuStore((s) => s.extraLists);
  const addCustomTag = useMenuStore((s) => s.addCustomTag);
  const addVolumeLabel = useMenuStore((s) => s.addVolumeLabel);
  const tenantId = useMenuStore((s) => s.currentTenantId);

  const [draft, setDraft] = useState<AdminMenuItem>(item);
  const [extrasMode, setExtrasMode] = useState<"none" | "list" | "inline">(
    () =>
      item.extraListId
        ? "list"
        : item.extras && item.extras.length > 0
          ? "inline"
          : "none",
  );
  const [listId, setListId] = useState(item.extraListId ?? "");
  const [ingInput, setIngInput] = useState("");
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // AI state
  const [aiIngLoading, setAiIngLoading] = useState(false);
  const [aiIngError, setAiIngError] = useState("");
  const [aiDescLoading, setAiDescLoading] = useState(false);
  const [aiDescError, setAiDescError] = useState("");
  const [activeLang, setActiveLang] = useState("it");
  const [translations, setTranslations] = useState<Record<string, { name?: string; description?: string; ingredients?: string[] }>>({});
  const [aiTranslating, setAiTranslating] = useState(false);
  const [aiTranslateError, setAiTranslateError] = useState("");

  const SUPPORTED_LANGS = locales.map((code) => ({ code, label: code.toUpperCase() }));

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(item);
  }, [draft, item]);

  function persist(patch: Partial<AdminMenuItem> = {}) {
    if (extrasMode === "list") {
      updateItem(draft.id, {
        ...draft,
        ...patch,
        extraListId: listId || undefined,
        extras: undefined,
      });
    } else if (extrasMode === "inline") {
      updateItem(draft.id, { ...draft, ...patch, extraListId: undefined, extras: draft.extras });
    } else {
      updateItem(draft.id, { ...draft, ...patch, extraListId: undefined, extras: undefined });
    }
  }

  function save() {
    persist();
    onClose();
  }

  function saveAsDraft() {
    persist({ available: false });
    onClose();
  }

  function tryClose() {
    if (isDirty) {
      setShowUnsavedDialog(true);
      return;
    }
    onClose();
  }

  function addIngredient() {
    const v = ingInput.trim();
    if (!v) return;
    const id = `ing-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const row: MenuIngredient = { id, name: v };
    setDraft((d) => ({
      ...d,
      ingredients: [...(d.ingredients ?? []), row],
    }));
    setIngInput("");
  }

  function removeIngredient(i: number) {
    setDraft((d) => ({
      ...d,
      ingredients: (d.ingredients ?? []).filter((_, idx) => idx !== i),
    }));
  }

  function addExtra() {
    if (extrasMode !== "inline") return;
    const name = extraName.trim();
    const price = parseFloat(extraPrice.replace(",", "."));
    if (!name || !Number.isFinite(price) || price < 0) return;
    const id = `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const newExtra: Extra = { id, name, price };
    setDraft((d) => ({
      ...d,
      extraListId: undefined,
      extras: [...(d.extras ?? []), newExtra],
    }));
    setExtraName("");
    setExtraPrice("");
  }

  function removeExtra(id: string) {
    setDraft((d) => ({
      ...d,
      extras: (d.extras ?? []).filter((e) => e.id !== id),
    }));
  }

  function setExtrasModeAndDraft(next: "none" | "list" | "inline") {
    if (next === "none") {
      setExtrasMode("none");
      setListId("");
      setDraft((d) => ({
        ...d,
        extraListId: undefined,
        extras: undefined,
      }));
      return;
    }
    if (next === "list") {
      setExtrasMode("list");
      const first = listId || extraLists[0]?.id || "";
      setListId(first);
      setDraft((d) => ({
        ...d,
        extraListId: first,
        extras: undefined,
      }));
      return;
    }
    if (next === "inline") {
      setExtrasMode("inline");
      setListId("");
      setDraft((d) => {
        const base = d.extraListId
          ? resolveExtrasForItem(d, extraLists)
          : (d.extras ?? []);
        return {
          ...d,
          extraListId: undefined,
          extras: base.map((e) => ({ ...e })),
        };
      });
    }
  }

  function toggleTag(t: MenuTag) {
    if (t === "piccante") return;
    if (t === "veg" || t === "vegano") return;
    setDraft((d) => {
      const has = d.tags?.includes(t);
      const nextTags = has ? d.tags?.filter((x) => x !== t) : [...(d.tags ?? []), t];
      const nextMeta = { ...(d.tagMeta ?? {}) };
      if (t === "novita" && !has) {
        nextMeta.novita = { expiresAt: nextMeta.novita?.expiresAt ?? defaultExpiryDate(14) };
      }
      if (has) delete nextMeta[t];
      return {
        ...d,
        tags: nextTags,
        tagMeta: Object.keys(nextMeta).length ? nextMeta : undefined,
      };
    });
  }

  function addAndToggleCustomTag() {
    const id = addCustomTag(newTagName);
    if (!id) return;
    setDraft((d) => ({
      ...d,
      tags: d.tags?.includes(id) ? d.tags : [...(d.tags ?? []), id],
    }));
    setNewTagName("");
  }

  /** Tocchi consecutivi: off → 1 → 2 → 3 → 4 → off. */
  function cyclePiccante() {
    setDraft((d) => {
      const hasTag = d.tags?.includes("piccante");
      const cur: 0 | PiccanteLevel = hasTag ? (d.piccanteLevel ?? 1) : 0;
      if (cur === 0) {
        return {
          ...d,
          tags: [...(d.tags ?? []), "piccante"],
          piccanteLevel: 1,
        };
      }
      if (cur < 4) {
        return {
          ...d,
          piccanteLevel: ((cur + 1) as PiccanteLevel),
        };
      }
      return {
        ...d,
        tags: d.tags?.filter((x) => x !== "piccante"),
        piccanteLevel: undefined,
      };
    });
  }

  /** Tocchi consecutivi: off → veg → vegano → off. */
  function cycleVeg() {
    setDraft((d) => {
      const tags = d.tags ?? [];
      const hasVeg = tags.includes("veg");
      const hasVegano = tags.includes("vegano");
      const stripped = tags.filter((x) => !VEG_TAGS.includes(x));
      if (!hasVeg && !hasVegano) {
        return { ...d, tags: [...stripped, "veg"] };
      }
      if (hasVeg && !hasVegano) {
        return { ...d, tags: [...stripped, "vegano"] };
      }
      return { ...d, tags: stripped };
    });
  }

  async function aiSuggestIngredients() {
    setAiIngLoading(true);
    setAiIngError("");
    try {
      const res = await fetch("/api/ai/menu-item", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "suggest-ingredients",
          tenantId,
          name: draft.name,
          description: draft.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ai_error");
      if (data.ingredients?.length) {
        setDraft((d) => ({
          ...d,
          ingredients: [
            ...(d.ingredients ?? []),
            ...data.ingredients
              .filter((n: string) => !(d.ingredients ?? []).some((i) => i.name === n))
              .map((n: string) => ({ id: `ai-${Date.now()}-${Math.random().toString(36).slice(2,5)}`, name: n })),
          ],
        }));
      }
      if (data.allergens?.length) {
        const known = ALLERGEN_OPTIONS
          .filter((o) => (data.allergens as string[]).some((a) => a.toLowerCase().includes(o.label.toLowerCase()) || o.label.toLowerCase().includes(a.toLowerCase())))
          .map((o) => o.key);
        if (known.length) {
          setDraft((d) => ({ ...d, allergens: Array.from(new Set([...(d.allergens ?? []), ...known])) as MenuAllergen[] }));
        }
      }
      if (data.disclaimer) setAiIngError(`ℹ️ ${data.disclaimer}`);
    } catch (e) {
      setAiIngError(e instanceof Error ? e.message : "Errore AI");
    } finally {
      setAiIngLoading(false);
    }
  }

  async function aiRewriteDescription() {
    setAiDescLoading(true);
    setAiDescError("");
    try {
      const res = await fetch("/api/ai/menu-item", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "rewrite-description",
          tenantId,
          name: draft.name,
          description: draft.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ai_error");
      if (data.description) setDraft((d) => ({ ...d, description: data.description }));
    } catch (e) {
      setAiDescError(e instanceof Error ? e.message : "Errore AI");
    } finally {
      setAiDescLoading(false);
    }
  }

  async function aiTranslate(toLang: string) {
    setAiTranslating(true);
    setAiTranslateError("");
    try {
      const res = await fetch("/api/ai/menu-item", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "translate",
          tenantId,
          name: draft.name,
          description: draft.description,
          ingredients: (draft.ingredients ?? []).map((i) => i.name),
          fromLang: "it",
          toLang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ai_error");
      setTranslations((t) => ({ ...t, [toLang]: data }));
    } catch (e) {
      setAiTranslateError(e instanceof Error ? e.message : "Errore AI");
    } finally {
      setAiTranslating(false);
    }
  }

  function toggleAllergen(a: MenuAllergen) {
    setDraft((d) => {
      const cur = d.allergens ?? [];
      const has = cur.includes(a);
      return {
        ...d,
        allergens: has ? cur.filter((x) => x !== a) : [...cur, a],
      };
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pork-ink/70 p-4 backdrop-blur-sm"
      onClick={tryClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-pork-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-pork-ink/10 px-5 py-4">
          <div className="min-w-0">
            <p className="impact-title text-xs text-pork-red">
              Modifica piatto {isDirty && <span className="ml-1 text-pork-ink/40">· modifiche non salvate</span>}
            </p>
            <h2 className="headline truncate text-2xl">{draft.name || "—"}</h2>
          </div>
          <button
            onClick={tryClose}
            className="rounded-full p-2 hover:bg-pork-ink/10"
            aria-label="Chiudi"
          >
            <X size={22} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <Field label="Nome">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
                />
              </Field>

              <Field label="Descrizione">
                <textarea
                  rows={3}
                  value={draft.description ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  className="w-full resize-none rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
                />
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={aiRewriteDescription}
                    disabled={aiDescLoading || !draft.name}
                    className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1 text-[11px] font-bold text-pork-ink/60 hover:bg-pork-mustard/30 hover:text-pork-ink disabled:opacity-40"
                  >
                    <Sparkles size={11} />
                    {aiDescLoading ? "Riscrivendo…" : "Riscrivi con AI"}
                  </button>
                  {aiDescError && (
                    <span className="text-[10px] text-pork-ink/50">{aiDescError}</span>
                  )}
                </div>
              </Field>

              <Field label="Prezzo">
                <PriceEditor
                  value={draft.price}
                  volumeLabelPresets={volumeLabelPresets}
                  onAddVolumeLabelPreset={addVolumeLabel}
                  onChange={(p) => setDraft({ ...draft, price: p })}
                />
              </Field>

              <Field label="Ingredienti e allergeni">
                <div className="mb-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={aiSuggestIngredients}
                    disabled={aiIngLoading || !draft.name}
                    className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1 text-[11px] font-bold text-pork-ink/60 hover:bg-pork-mustard/30 hover:text-pork-ink disabled:opacity-40"
                  >
                    <Sparkles size={11} />
                    {aiIngLoading ? "Generando…" : "Genera con AI"}
                  </button>
                  {aiIngError && (
                    <span className="max-w-[200px] text-[10px] leading-snug text-pork-ink/50">{aiIngError}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ingInput}
                    onChange={(e) => setIngInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addIngredient();
                      }
                    }}
                    placeholder="Aggiungi e invio"
                    className="flex-1 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
                  />
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="rounded-xl bg-pork-ink px-4 text-sm font-bold text-pork-cream"
                  >
                    +
                  </button>
                </div>
                {draft.ingredients && draft.ingredients.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {normalizeMenuIngredients(
                      draft.id,
                      draft.ingredients,
                    ).map((ing, i) => (
                      <li
                        key={ing.id}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold ring-1 ring-pork-ink/10"
                      >
                        {ing.name}
                        <button
                          type="button"
                          onClick={() => removeIngredient(i)}
                          className="text-pork-ink/40 hover:text-pork-red"
                          aria-label="Rimuovi"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Field>

              <Field label="Aggiunte (sovrapprezzo)">
                <p className="mb-2 text-[11px] text-pork-ink/50">
                  Lista condivisa: stesso set per più piatti; se aggiorni la lista in
                  &ldquo;Liste aggiunte&rdquo; cambia per tutti.
                </p>
                <div className="mb-2 flex flex-wrap gap-1">
                  {(
                    [
                      ["none", "Nessuna"] as const,
                      ["list", "Lista condivisa"] as const,
                      ["inline", "Solo su questo piatto"] as const,
                    ] as const
                  ).map(([k, lab]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setExtrasModeAndDraft(k)}
                      className={
                        "rounded-full px-2.5 py-1 text-[11px] font-bold " +
                        (extrasMode === k
                          ? "bg-pork-red text-white"
                          : "bg-pork-ink/5 text-pork-ink/70 hover:bg-pork-ink/10")
                      }
                    >
                      {lab}
                    </button>
                  ))}
                </div>
                {extrasMode === "list" && (
                  <div>
                    {extraLists.length > 0 ? (
                      <select
                        className="mb-2 w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-pork-red"
                        value={listId}
                        onChange={(e) => {
                          const v = e.target.value;
                          setListId(v);
                          setDraft((d) => ({ ...d, extraListId: v, extras: undefined }));
                        }}
                      >
                        {extraLists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.extras.length} voci)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-pork-ink/50">Crea una lista sopra.</p>
                    )}
                    {listId && (
                      <ul className="space-y-1 rounded-lg bg-white/50 p-2 text-xs text-pork-ink/80 ring-1 ring-pork-ink/5">
                        {(extraLists.find((l) => l.id === listId)?.extras ?? []).map(
                          (ex) => (
                            <li key={ex.id} className="flex justify-between">
                              <span>{ex.name}</span>
                              <span className="text-pork-red">+{formatEuro(ex.price)}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    )}
                  </div>
                )}
                {extrasMode === "inline" && (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={extraName}
                        onChange={(e) => setExtraName(e.target.value)}
                        placeholder="Nome (es. Extra bacon)"
                        className="flex-1 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
                      />
                      <input
                        type="text"
                        value={extraPrice}
                        onChange={(e) => setExtraPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addExtra();
                          }
                        }}
                        placeholder="€"
                        inputMode="decimal"
                        className="w-20 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
                      />
                      <button
                        type="button"
                        onClick={addExtra}
                        className="rounded-xl bg-pork-ink px-4 text-sm font-bold text-pork-cream"
                      >
                        +
                      </button>
                    </div>
                    {draft.extras && draft.extras.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {draft.extras.map((ex) => (
                          <li
                            key={ex.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-pork-ink/10"
                          >
                            <span className="font-semibold">{ex.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-impact text-pork-red">
                                +{formatEuro(ex.price)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeExtra(ex.id)}
                                className="text-pork-ink/40 hover:text-pork-red"
                                aria-label="Rimuovi"
                              >
                                ×
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </Field>

              <Field label="Etichette">
                <p className="mb-2 text-[11px] text-pork-ink/50">
                  Piccante: tocchi ripetuti sul tasto per i livelli 1–3 (🌶) e il quarto
                  (piccantissimo); un altro tocco disattiva.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => {
                    if (t.key === "piccante") {
                      const lev = draft.tags?.includes("piccante")
                        ? (draft.piccanteLevel ?? 1)
                        : 0;
                      const spicyClass =
                        lev === 0
                          ? "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10"
                          : lev === 1
                            ? "bg-pork-mustard text-pork-ink ring-2 ring-pork-mustard/40"
                            : lev === 2
                              ? "bg-orange-400 text-pork-ink ring-2 ring-orange-300"
                              : lev === 3
                                ? "bg-orange-600 text-white ring-2 ring-orange-400"
                                : "bg-gradient-to-r from-red-800 to-orange-600 text-white ring-2 ring-amber-300/80";
                      return (
                        <button
                          key="piccante"
                          type="button"
                          onClick={cyclePiccante}
                          title="Livello piccante: ripeti il tocco per aumentare (max 4), poi spegni"
                          className={
                            "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors " +
                            spicyClass
                          }
                        >
                          Piccante
                          {lev > 0 ? (
                            <span className="ml-1.5 font-black normal-case opacity-90">
                              {lev < 4 ? `· ${lev}` : "· ★"}
                            </span>
                          ) : null}
                        </button>
                      );
                    }
                    if (t.key === "veg") {
                      const isVeg = draft.tags?.includes("veg");
                      const isVegano = draft.tags?.includes("vegano");
                      const label = isVegano ? "Vegano" : "Vegetariano";
                      const vegClass = isVegano
                        ? "bg-green-700 text-white ring-2 ring-green-500/40"
                        : isVeg
                          ? "bg-green-500 text-white ring-2 ring-green-300/50"
                          : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10";
                      return (
                        <button
                          key="veg"
                          type="button"
                          onClick={cycleVeg}
                          title="1 tocco: vegetariano · 2 tocchi: vegano · 3 tocchi: nessuno"
                          className={
                            "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors " +
                            vegClass
                          }
                        >
                          {label}
                        </button>
                      );
                    }
                    const active = draft.tags?.includes(t.key);
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => toggleTag(t.key)}
                        className={
                          "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors " +
                          (active
                            ? "bg-pork-red text-white"
                            : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10")
                        }
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                {draft.tags?.includes("novita") && (
                  <div className="mt-3 space-y-2">
                    <span className="block text-[10px] font-black uppercase tracking-wide text-pork-ink/45">
                      Scadenza novità
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "7 giorni", days: 7 },
                        { label: "15 giorni", days: 15 },
                        { label: "30 giorni", days: 30 },
                      ].map((preset) => {
                        const candidate = defaultExpiryDate(preset.days);
                        const active = draft.tagMeta?.novita?.expiresAt === candidate;
                        return (
                          <button
                            key={preset.days}
                            type="button"
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                tagMeta: {
                                  ...(d.tagMeta ?? {}),
                                  novita: { expiresAt: candidate },
                                },
                              }))
                            }
                            className={
                              "rounded-full px-3 py-1 text-xs font-bold transition-colors " +
                              (active
                                ? "bg-pork-pink text-white"
                                : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10")
                            }
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            tagMeta: {
                              ...(d.tagMeta ?? {}),
                              novita: { expiresAt: undefined },
                            },
                          }))
                        }
                        className={
                          "rounded-full px-3 py-1 text-xs font-bold transition-colors " +
                          (draft.tagMeta?.novita?.expiresAt === undefined
                            ? "bg-pork-ink text-pork-cream"
                            : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10")
                        }
                      >
                        Nessuna
                      </button>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-pork-ink/45">
                        Personalizzata
                      </span>
                      <input
                        type="date"
                        value={draft.tagMeta?.novita?.expiresAt ?? ""}
                        onChange={(event) =>
                          setDraft((d) => ({
                            ...d,
                            tagMeta: {
                              ...(d.tagMeta ?? {}),
                              novita: { expiresAt: event.target.value || undefined },
                            },
                          }))
                        }
                        className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-pork-red"
                      />
                    </label>
                  </div>
                )}
                {(customTags.length > 0 || draft.tags?.some((tag) => !isBuiltInMenuTag(tag))) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mergeTagDefinitions(customTags, draft.tags ?? []).map((tag) => {
                      const active = draft.tags?.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={
                            "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors " +
                            (active
                              ? "bg-pork-ink text-pork-cream"
                              : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10")
                          }
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(event) => setNewTagName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addAndToggleCustomTag();
                      }
                    }}
                    placeholder="Nuovo tag personalizzato"
                    className="min-w-0 flex-1 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-pork-red"
                  />
                  <button
                    type="button"
                    onClick={addAndToggleCustomTag}
                    className="inline-flex items-center gap-1 rounded-xl bg-pork-ink px-3 text-sm font-bold text-pork-cream"
                  >
                    <Plus size={14} /> Tag
                  </button>
                </div>
              </Field>

              <Field label="Allergeni (UE 1169/2011)">
                <p className="mb-2 text-[11px] text-pork-ink/50">
                  Seleziona tutti gli allegati presenti nel piatto. In menu compaiono
                  come icone (su desktop passando il mouse il bubble si allarga e
                  mostra il nome accanto; in modale ordine sezione collassabile: icone
                  se chiusa, nomi se aperta).
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ALLERGEN_OPTIONS.map((o) => {
                    const active = draft.allergens?.includes(o.key);
                    return (
                      <button
                        key={o.key}
                        type="button"
                        title={o.label}
                        onClick={() => toggleAllergen(o.key)}
                        className={
                          "flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs font-semibold leading-snug transition-colors " +
                          (active
                            ? "border-pork-red bg-pork-red/5 text-pork-ink"
                            : "border-pork-ink/10 bg-white text-pork-ink/70 hover:border-pork-ink/25")
                        }
                      >
                        <span
                          className={
                            "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black " +
                            (active
                              ? "bg-pork-red text-white"
                              : "bg-pork-ink/10 text-pork-ink/50")
                          }
                        >
                          {o.annexNumber}
                        </span>
                        <span>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <div className="space-y-4">
              <Field label="Foto">
                <ImageUpload
                  value={draft.image}
                  tenantId={tenantId}
                  onChange={(p) => setDraft({ ...draft, image: p })}
                />
                <button
                  type="button"
                  disabled
                  title="In arrivo: l'AI renderà la foto professionale mantenendo il carattere del ristorante"
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1 text-[11px] font-bold text-pork-ink/30 cursor-not-allowed"
                >
                  <ImageIcon size={11} /> Beautify con AI — in arrivo
                </button>
              </Field>

              <Field label="Disponibilità">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-pork-ink/10 bg-white px-4 py-3">
                  <span>
                    <span className="block font-bold">
                      {draft.available ? "Disponibile" : "Non disponibile"}
                    </span>
                    <span className="text-xs text-pork-ink/60">
                      Se disattivato, il piatto non compare nel menu pubblico.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft.available}
                    onChange={(e) =>
                      setDraft({ ...draft, available: e.target.checked })
                    }
                    className="h-5 w-5 accent-pork-red"
                  />
                </label>
              </Field>
            </div>
          </div>

          {/* Traduzioni — solo se il tenant ha più di una lingua */}
          {SUPPORTED_LANGS.length > 1 && <div className="mt-6 border-t border-pork-ink/10 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <Globe size={15} className="text-pork-red" />
              <span className="text-sm font-bold text-pork-ink">Traduzioni</span>
              <div className="ml-auto flex gap-1">
                {SUPPORTED_LANGS.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setActiveLang(lang.code)}
                    className={
                      "rounded-full px-2.5 py-0.5 text-[11px] font-black transition-colors " +
                      (activeLang === lang.code
                        ? "bg-pork-ink text-pork-cream"
                        : "bg-pork-ink/5 text-pork-ink/50 hover:bg-pork-ink/10")
                    }
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {activeLang === "it" ? (
              <p className="text-xs text-pork-ink/45">
                I campi in italiano sono quelli principali nell&apos;editor qui sopra.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-pork-ink/50">
                      Nome ({activeLang.toUpperCase()})
                    </span>
                    <input
                      type="text"
                      value={translations[activeLang]?.name ?? ""}
                      onChange={(e) =>
                        setTranslations((t) => ({
                          ...t,
                          [activeLang]: { ...t[activeLang], name: e.target.value },
                        }))
                      }
                      placeholder={draft.name}
                      className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-pork-red"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-pork-ink/50">
                      Descrizione ({activeLang.toUpperCase()})
                    </span>
                    <textarea
                      rows={2}
                      value={translations[activeLang]?.description ?? ""}
                      onChange={(e) =>
                        setTranslations((t) => ({
                          ...t,
                          [activeLang]: { ...t[activeLang], description: e.target.value },
                        }))
                      }
                      placeholder={draft.description ?? ""}
                      className="w-full resize-none rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-pork-red"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => aiTranslate(activeLang)}
                    disabled={aiTranslating || !draft.name}
                    className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1 text-[11px] font-bold text-pork-ink/60 hover:bg-pork-mustard/30 hover:text-pork-ink disabled:opacity-40"
                  >
                    <Sparkles size={11} />
                    {aiTranslating ? "Traducendo…" : `Traduci con AI → ${activeLang.toUpperCase()}`}
                  </button>
                  <span className="text-[10px] text-pork-ink/40">
                    Verifica sempre prima di pubblicare
                  </span>
                  {aiTranslateError && (
                    <span className="text-[10px] text-pork-red">{aiTranslateError}</span>
                  )}
                </div>
                {translations[activeLang] && (
                  <p className="text-[10px] text-pork-ink/40">
                    ⚠️ Le traduzioni sono salvate localmente. Il collegamento al DB per le lingue è in arrivo.
                  </p>
                )}
              </div>
            )}
          </div>}
        </div>

        <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-pork-ink/10 bg-white px-5 py-4 shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.15)]">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Eliminare definitivamente "${draft.name}"?`)) {
                removeItem(draft.id);
                onClose();
              }
            }}
            className="text-sm font-semibold text-pork-red hover:underline"
          >
            Elimina piatto
          </button>
          <div className="flex flex-wrap gap-2">
            <button onClick={tryClose} className="btn-ghost text-sm">
              Annulla
            </button>
            <button
              onClick={saveAsDraft}
              className="rounded-xl border-2 border-pork-ink/20 bg-white px-3 py-1.5 text-sm font-bold text-pork-ink hover:border-pork-ink"
              title="Salva i cambiamenti ma rendi il piatto non disponibile sul menu pubblico"
            >
              Salva bozza
            </button>
            <button onClick={save} className="btn-primary text-sm">
              <Save size={16} /> Salva
            </button>
          </div>
        </footer>

        {showUnsavedDialog && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-pork-ink/40 p-4 backdrop-blur-sm"
            onClick={() => setShowUnsavedDialog(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="impact-title text-lg text-pork-ink">Modifiche non salvate</h3>
              <p className="mt-2 text-sm text-pork-ink/70">
                Hai modifiche non salvate su questo piatto. Cosa vuoi fare?
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowUnsavedDialog(false);
                    save();
                  }}
                  className="btn-primary text-sm"
                >
                  <Save size={16} /> Salva e chiudi
                </button>
                <button
                  onClick={() => {
                    setShowUnsavedDialog(false);
                    saveAsDraft();
                  }}
                  className="rounded-xl border-2 border-pork-ink/20 bg-white px-3 py-2 text-sm font-bold text-pork-ink hover:border-pork-ink"
                >
                  Salva come bozza
                </button>
                <button
                  onClick={() => {
                    setShowUnsavedDialog(false);
                    onClose();
                  }}
                  className="text-sm font-semibold text-pork-red hover:underline"
                >
                  Scarta le modifiche
                </button>
                <button
                  onClick={() => setShowUnsavedDialog(false)}
                  className="mt-1 text-xs text-pork-ink/50 hover:text-pork-ink"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-pork-ink/60">
        {label}
      </p>
      {children}
    </div>
  );
}

function mergeTagDefinitions(
  customTags: TenantMenuTagDefinition[],
  activeTags: MenuTag[],
): TenantMenuTagDefinition[] {
  const out = new Map<string, TenantMenuTagDefinition>();
  for (const tag of customTags) out.set(tag.id, tag);
  for (const tag of activeTags) {
    if (!isBuiltInMenuTag(tag)) out.set(tag, out.get(tag) ?? { id: tag, label: tag });
  }
  return [...out.values()].sort((a, b) => a.label.localeCompare(b.label, "it"));
}
