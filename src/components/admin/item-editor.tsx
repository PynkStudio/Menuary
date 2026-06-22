"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Globe, GripVertical, ImageIcon, Plus, Save, Sparkles, X } from "lucide-react";
import { GestionePortalSurface } from "@/components/gestione/gestione-portal-surface";
import { resolveExtrasForItem } from "@/lib/extra-lists";
import type {
  AdminMenuItem,
  AdminMenuCategory,
  Extra,
  MenuAllergen,
  MenuBundleSlot,
  MenuVariantGroup,
  MenuTag,
  PiccanteLevel,
  TenantMenuTagDefinition,
} from "@/lib/types";
import { ALLERGEN_OPTIONS } from "@/lib/allergens";
import { PriceEditor } from "./price-editor";
import { ImageUpload } from "./image-upload";
import { useMenuStore, selectCategoriesOrdered } from "@/store/menu-store";
import { formatEuro } from "@/lib/price-utils";
import { normalizeMenuIngredients, type MenuIngredient } from "@/lib/ingredients";
import { defaultExpiryDate, isBuiltInMenuTag } from "@/lib/menu-tags";
import { HelpHint } from "@/components/gestione/help-hint";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";

const TAGS: { key: MenuTag; label: string }[] = [
  { key: "firma", label: "Firma" },
  { key: "piccante", label: "Piccante" },
  { key: "veg", label: "Veg" },
  { key: "novita", label: "Novità" },
];

const VEG_TAGS: MenuTag[] = ["veg", "vegano"];

type TranslationDraft = {
  name?: string;
  description?: string;
  ingredients?: string[];
};

function normalizeTranslationDraft(draft?: TranslationDraft) {
  return {
    name: draft?.name ?? "",
    description: draft?.description ?? "",
    ingredients: draft?.ingredients ?? [],
  };
}

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
  const categoriesRaw = useMenuStore((s) => s.categories);
  const allCategories = useMemo(
    () => selectCategoriesOrdered({ categories: categoriesRaw } as never),
    [categoriesRaw],
  );
  const allItems = useMenuStore((s) => s.items);

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
  const [showMissingTransDialog, setShowMissingTransDialog] = useState(false);
  const [missingTransLangs, setMissingTransLangs] = useState<string[]>([]);

  // AI state
  const [aiIngLoading, setAiIngLoading] = useState(false);
  const [aiIngError, setAiIngError] = useState("");
  const [aiDescLoading, setAiDescLoading] = useState(false);
  const [aiDescError, setAiDescError] = useState("");
  const [activeLang, setActiveLang] = useState("it");
  const [translations, setTranslations] = useState<Record<string, TranslationDraft>>({});
  const [aiTranslating, setAiTranslating] = useState(false);
  const [aiTranslateError, setAiTranslateError] = useState("");
  const translationsSavedRef = useRef<Record<string, TranslationDraft>>({});

  // Carica traduzioni esistenti dal DB al mount (solo se multilingua)
  const loadTranslations = useCallback(async () => {
    if (locales.length <= 1) return;
    try {
      const res = await fetch(
        `/api/gestione/menu-item-translations?tenantId=${encodeURIComponent(tenantId)}&itemId=${encodeURIComponent(item.id)}`,
      );
      if (!res.ok) return;
      const rows: Array<{ locale: string; name?: string; description?: string; ingredients?: string[] }> =
        await res.json();
      const loaded: Record<string, TranslationDraft> = {};
      for (const row of rows) {
        if (row.locale !== "it") {
          loaded[row.locale] = {
            name: row.name ?? "",
            description: row.description ?? "",
            ingredients: row.ingredients ?? [],
          };
        }
      }
      setTranslations(loaded);
      translationsSavedRef.current = loaded;
    } catch {
      // fail silently
    }
  }, [item.id, locales.length, tenantId]);

  useEffect(() => { loadTranslations(); }, [loadTranslations]);

  const SUPPORTED_LANGS = useMemo(
    () => locales.map((code) => ({ code, label: code.toUpperCase() })),
    [locales],
  );
  const hasSourceText = useMemo(
    () => SUPPORTED_LANGS.some((lang) => {
      const value = lang.code === "it" ? { name: draft.name, description: draft.description } : translations[lang.code];
      return Boolean(value?.name?.trim() || value?.description?.trim());
    }),
    [SUPPORTED_LANGS, draft.description, draft.name, translations],
  );

  const hasUnsavedTranslations = useMemo(() => {
    if (locales.length <= 1) return false;
    return locales.some((lang) => {
      if (lang === "it") return false;
      return (
        JSON.stringify(normalizeTranslationDraft(translations[lang])) !==
        JSON.stringify(normalizeTranslationDraft(translationsSavedRef.current[lang]))
      );
    });
  }, [locales, translations]);

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(item) || hasUnsavedTranslations;
  }, [draft, hasUnsavedTranslations, item]);
  useUnsavedChangesWarning(isDirty);

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

  function persistTranslations(translationsToPersist = translations) {
    if (locales.length <= 1) return;
    for (const lang of locales) {
      if (lang === "it") continue;
      const draft_ = translationsToPersist[lang];
      const saved = translationsSavedRef.current[lang];
      // Skip if nothing changed and nothing new
      if (!draft_ && !saved) continue;
      if (
        draft_?.name === saved?.name &&
        draft_?.description === saved?.description &&
        JSON.stringify(draft_?.ingredients) === JSON.stringify(saved?.ingredients)
      ) continue;
      // Fire and forget
      fetch("/api/gestione/menu-item-translations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantId,
          itemId: item.id,
          locale: lang,
          name: draft_?.name ?? "",
          description: draft_?.description ?? "",
          ingredients: draft_?.ingredients ?? [],
        }),
      }).then(() => {
        translationsSavedRef.current = { ...translationsSavedRef.current, [lang]: draft_ ?? {} };
      }).catch(() => {/* fail silently */});
    }
  }

  function save() {
    // Se il piatto è visibile e mancano traduzioni per lingue secondarie, prompt
    if (draft.available && locales.length > 1) {
      const missing = locales.filter(
        (lang) => lang !== "it" && isTranslationTargetEmpty(lang),
      );
      if (missing.length > 0) {
        setMissingTransLangs(missing);
        setShowMissingTransDialog(true);
        return;
      }
    }
    persist();
    persistTranslations();
    onClose();
  }

  async function saveWithAutoTranslate() {
    setShowMissingTransDialog(false);
    // Avvia traduzione in background per le lingue mancanti
    const source = readTranslationSource("it");
    let nextTranslations = translations;
    if (source) {
      for (const toLang of missingTransLangs) {
        try {
          const res = await fetch("/api/ai/menu-item", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              action: "translate",
              tenantId,
              name: source.name,
              description: source.description,
              ingredients: source.ingredients,
              fromLang: source.lang,
              toLang,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            nextTranslations = {
              ...nextTranslations,
              [toLang]: {
                name: data.name ?? "",
                description: data.description ?? "",
                ingredients: data.ingredients ?? [],
              },
            };
            setTranslations(nextTranslations);
          }
        } catch {
          // fail silently — salviamo comunque
        }
      }
    }
    persist();
    persistTranslations(nextTranslations);
    onClose();
  }

  function saveAsDraft() {
    persist({ available: false });
    persistTranslations();
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

  function addVariantGroup() {
    const id = `vg-${Date.now().toString(36)}`;
    const optionId = `opt-${Date.now().toString(36)}`;
    setDraft((d) => ({
      ...d,
      variantGroups: [
        ...(d.variantGroups ?? []),
        {
          id,
          name: "Impasto",
          required: true,
          defaultOptionId: optionId,
          options: [{ id: optionId, name: "Classico", price: 0 }],
        },
      ],
    }));
  }

  function updateVariantGroup(groupId: string, patch: Partial<MenuVariantGroup>) {
    setDraft((d) => ({
      ...d,
      variantGroups: (d.variantGroups ?? []).map((group) =>
        group.id === groupId ? { ...group, ...patch } : group,
      ),
    }));
  }

  function removeVariantGroup(groupId: string) {
    setDraft((d) => ({
      ...d,
      variantGroups: (d.variantGroups ?? []).filter((group) => group.id !== groupId),
    }));
  }

  function addVariantOption(groupId: string) {
    const id = `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    setDraft((d) => ({
      ...d,
      variantGroups: (d.variantGroups ?? []).map((group) =>
        group.id === groupId
          ? {
              ...group,
              defaultOptionId: group.defaultOptionId ?? id,
              options: [...group.options, { id, name: "Nuova opzione", price: 0 }],
            }
          : group,
      ),
    }));
  }

  function updateVariantOption(
    groupId: string,
    optionId: string,
    patch: Partial<MenuVariantGroup["options"][number]>,
  ) {
    setDraft((d) => ({
      ...d,
      variantGroups: (d.variantGroups ?? []).map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option,
              ),
            }
          : group,
      ),
    }));
  }

  function removeVariantOption(groupId: string, optionId: string) {
    setDraft((d) => ({
      ...d,
      variantGroups: (d.variantGroups ?? []).map((group) => {
        if (group.id !== groupId) return group;
        const options = group.options.filter((option) => option.id !== optionId);
        return {
          ...group,
          options,
          defaultOptionId:
            group.defaultOptionId === optionId
              ? options[0]?.id
              : group.defaultOptionId,
        };
      }),
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

  function readTranslationSource(preferredLang: string) {
    const orderedLangs = [
      preferredLang,
      "it",
      ...SUPPORTED_LANGS.map((lang) => lang.code),
    ].filter((code, index, all) => code && all.indexOf(code) === index);

    for (const lang of orderedLangs) {
      if (!SUPPORTED_LANGS.some((option) => option.code === lang)) continue;
      const value =
        lang === "it"
          ? {
              name: draft.name.trim(),
              description: (draft.description ?? "").trim(),
              ingredients: (draft.ingredients ?? []).map((ingredient) => ingredient.name).filter(Boolean),
            }
          : {
              name: translations[lang]?.name?.trim() ?? "",
              description: translations[lang]?.description?.trim() ?? "",
              ingredients: translations[lang]?.ingredients ?? [],
            };
      if (value.name || value.description || value.ingredients.length > 0) {
        return { lang, ...value };
      }
    }

    return null;
  }

  function isTranslationTargetEmpty(lang: string) {
    if (lang === "it") {
      return !draft.name.trim() || !(draft.description ?? "").trim();
    }
    const value = translations[lang];
    return !value?.name?.trim() || !value?.description?.trim();
  }

  async function aiTranslateAll() {
    const source = readTranslationSource(activeLang);
    if (!source) {
      setAiTranslateError("Inserisci almeno un nome o una descrizione in una lingua.");
      return;
    }

    setAiTranslating(true);
    setAiTranslateError("");
    try {
      const targets = SUPPORTED_LANGS
        .map((lang) => lang.code)
        .filter((lang) => lang !== source.lang && isTranslationTargetEmpty(lang));

      if (targets.length === 0) {
        setAiTranslateError("Tutti i campi disponibili sono già compilati.");
        return;
      }

      for (const toLang of targets) {
        const res = await fetch("/api/ai/menu-item", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "translate",
            tenantId,
            name: source.name,
            description: source.description,
            ingredients: source.ingredients,
            fromLang: source.lang,
            toLang,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "ai_error");

        if (toLang === "it") {
          setDraft((current) => ({
            ...current,
            name: current.name.trim() ? current.name : data.name ?? "",
            description: (current.description ?? "").trim()
              ? current.description
              : data.description ?? "",
          }));
        } else {
          setTranslations((current) => {
            const existing = current[toLang] ?? {};
            return {
              ...current,
              [toLang]: {
                ...existing,
                name: existing.name?.trim() ? existing.name : data.name ?? "",
                description: existing.description?.trim()
                  ? existing.description
                  : data.description ?? "",
                ingredients: existing.ingredients?.length ? existing.ingredients : data.ingredients ?? [],
              },
            };
          });
        }
      }
    } catch (e) {
      setAiTranslateError(e instanceof Error ? e.message : "Errore AI");
    } finally {
      setAiTranslating(false);
    }
  }

  // --- Bundle slot helpers ---

  function addBundleSlot() {
    const id = `slot-${Date.now().toString(36)}`;
    setDraft((d) => ({
      ...d,
      bundleSlots: [
        ...(d.bundleSlots ?? []),
        { id, label: "", sourceCategoryIds: [], sourceItemIds: [] },
      ],
    }));
  }

  function removeBundleSlot(slotId: string) {
    setDraft((d) => ({
      ...d,
      bundleSlots: (d.bundleSlots ?? []).filter((s) => s.id !== slotId),
    }));
  }

  function updateBundleSlot(slotId: string, patch: Partial<MenuBundleSlot>) {
    setDraft((d) => ({
      ...d,
      bundleSlots: (d.bundleSlots ?? []).map((s) =>
        s.id === slotId ? { ...s, ...patch } : s,
      ),
    }));
  }

  function moveBundleSlot(index: number, dir: -1 | 1) {
    setDraft((d) => {
      const slots = [...(d.bundleSlots ?? [])];
      const target = index + dir;
      if (target < 0 || target >= slots.length) return d;
      [slots[index], slots[target]] = [slots[target], slots[index]];
      return { ...d, bundleSlots: slots };
    });
  }

  function toggleBundleMode() {
    setDraft((d) => {
      if (d.bundleSlots && d.bundleSlots.length > 0) {
        return { ...d, bundleSlots: undefined };
      }
      return {
        ...d,
        bundleSlots: [{ id: `slot-${Date.now().toString(36)}`, label: "", sourceCategoryIds: [], sourceItemIds: [] }],
      };
    });
  }

  function toggleSlotCategory(slotId: string, catId: string) {
    setDraft((d) => ({
      ...d,
      bundleSlots: (d.bundleSlots ?? []).map((s) => {
        if (s.id !== slotId) return s;
        const has = s.sourceCategoryIds.includes(catId);
        return {
          ...s,
          sourceCategoryIds: has
            ? s.sourceCategoryIds.filter((c) => c !== catId)
            : [...s.sourceCategoryIds, catId],
        };
      }),
    }));
  }

  function toggleSlotItem(slotId: string, itemId: string) {
    setDraft((d) => ({
      ...d,
      bundleSlots: (d.bundleSlots ?? []).map((s) => {
        if (s.id !== slotId) return s;
        const cur = s.sourceItemIds ?? [];
        const has = cur.includes(itemId);
        return {
          ...s,
          sourceItemIds: has ? cur.filter((i) => i !== itemId) : [...cur, itemId],
        };
      }),
    }));
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

  return createPortal(
    <GestionePortalSurface
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
          {/* Traduzioni — solo se il tenant ha più di una lingua */}
          {SUPPORTED_LANGS.length > 1 && (
            <div className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-pork-ink/10">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Globe size={17} className="text-pork-red" />
                <span className="text-base font-black text-pork-ink">Traduzioni</span>
                <div className="ml-auto flex flex-wrap gap-1">
                  {SUPPORTED_LANGS.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setActiveLang(lang.code)}
                      className={
                        "rounded-full px-3 py-1 text-xs font-black transition-colors " +
                        (activeLang === lang.code
                          ? "bg-pork-ink text-pork-cream"
                          : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10")
                      }
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeLang === "it" ? (
                <p className="rounded-xl bg-pork-cream px-3 py-2 text-sm font-semibold leading-snug text-pork-ink/70">
                  I campi in italiano sono quelli principali nell&apos;editor qui sotto. Puoi anche lasciarli vuoti, compilare un&apos;altra lingua e usare l&apos;AI per riempire l&apos;italiano.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
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
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
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
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={aiTranslateAll}
                  disabled={aiTranslating || !hasSourceText}
                  className="inline-flex items-center gap-1 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-black text-pork-cream hover:bg-pork-red disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Sparkles size={13} />
                  {aiTranslating ? "Traducendo…" : "Traduci con AI i campi vuoti"}
                </button>
                <span className="text-sm font-semibold text-pork-ink/65">
                  Verifica sempre prima di pubblicare.
                </span>
                {aiTranslateError && (
                  <span className="text-sm font-semibold text-pork-red">{aiTranslateError}</span>
                )}
              </div>
              <p className="mt-3 rounded-xl bg-pork-mustard/20 px-3 py-2 text-sm font-semibold leading-snug text-pork-ink/75">
                Le traduzioni vengono salvate nel DB e usate dal menu online quando il cliente cambia lingua.
              </p>
            </div>
          )}

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

              <Field
                label="Scelte obbligatorie"
                help="Usale per alternative a scelta singola come il tipo di impasto. Non sono aggiunte multiple: il cliente ne sceglie una sola."
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] leading-snug text-pork-ink/55">
                    Esempio: Impasto con default Classico e sovrapprezzi per opzioni speciali.
                  </p>
                  <button
                    type="button"
                    onClick={addVariantGroup}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pork-ink px-3 py-1.5 text-[11px] font-black text-pork-cream hover:bg-pork-red"
                  >
                    <Plus size={12} />
                    Gruppo
                  </button>
                </div>
                {(draft.variantGroups ?? []).length > 0 ? (
                  <div className="space-y-3">
                    {(draft.variantGroups ?? []).map((group) => (
                      <div key={group.id} className="rounded-2xl bg-white p-3 ring-1 ring-pork-ink/10">
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => updateVariantGroup(group.id, { name: e.target.value })}
                            className="rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-pork-red"
                            placeholder="Nome gruppo"
                          />
                          <label className="inline-flex items-center gap-2 rounded-xl bg-pork-cream px-3 py-2 text-xs font-bold text-pork-ink/70">
                            <input
                              type="checkbox"
                              checked={group.required ?? false}
                              onChange={(e) => updateVariantGroup(group.id, { required: e.target.checked })}
                            />
                            Obbligatoria
                          </label>
                          <button
                            type="button"
                            onClick={() => removeVariantGroup(group.id)}
                            className="rounded-xl px-3 py-2 text-xs font-bold text-pork-red hover:bg-pork-red/10"
                          >
                            Rimuovi
                          </button>
                        </div>
                        <div className="mt-3 space-y-2">
                          {group.options.map((option) => (
                            <div key={option.id} className="grid gap-2 sm:grid-cols-[auto_1fr_5rem_auto] sm:items-center">
                              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-pork-ink/60">
                                <input
                                  type="radio"
                                  name={`default-${group.id}`}
                                  checked={(group.defaultOptionId ?? group.options[0]?.id) === option.id}
                                  onChange={() => updateVariantGroup(group.id, { defaultOptionId: option.id })}
                                />
                                Default
                              </label>
                              <input
                                type="text"
                                value={option.name}
                                onChange={(e) => updateVariantOption(group.id, option.id, { name: e.target.value })}
                                className="rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-pork-red"
                                placeholder="Nome opzione"
                              />
                              <input
                                type="text"
                                value={option.price ?? 0}
                                onChange={(e) => {
                                  const parsed = Number.parseFloat(e.target.value.replace(",", "."));
                                  updateVariantOption(group.id, option.id, {
                                    price: Number.isFinite(parsed) ? parsed : 0,
                                  });
                                }}
                                inputMode="decimal"
                                className="rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-pork-red"
                                aria-label="Sovrapprezzo"
                              />
                              <button
                                type="button"
                                onClick={() => removeVariantOption(group.id, option.id)}
                                disabled={group.options.length <= 1}
                                className="rounded-xl px-2 py-2 text-xs font-bold text-pork-ink/45 hover:bg-pork-red/10 hover:text-pork-red disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="Rimuovi opzione"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addVariantOption(group.id)}
                          className="mt-3 inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1.5 text-[11px] font-bold text-pork-ink/65 hover:bg-pork-mustard/25"
                        >
                          <Plus size={12} />
                          Aggiungi opzione
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-pork-ink/55 ring-1 ring-pork-ink/10">
                    Nessuna scelta configurata.
                  </p>
                )}
              </Field>

              <Field
                label="Etichette"
                help="Usale per evidenziare caratteristiche utili nel menu pubblico. Piccante: clic ripetuti aumentano il livello fino a piccantissimo, poi disattivano. Veg: primo clic vegetariano, secondo vegano, terzo disattiva."
              >
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
                      const label = isVegano ? "Vegano" : isVeg ? "Vegetariano" : "Veg";
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

          {/* Sezione bundle menu */}
          <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-pork-ink/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-black text-pork-ink">Menu composto</p>
                <p className="text-xs text-pork-ink/55">
                  Attiva se questo prodotto è un menu con scelte guidate (es. pizza + bibita).
                </p>
              </div>
              <button
                type="button"
                onClick={toggleBundleMode}
                className={
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none " +
                  (draft.bundleSlots?.length
                    ? "bg-pork-red"
                    : "bg-pork-ink/20")
                }
                aria-pressed={!!(draft.bundleSlots?.length)}
                aria-label="Attiva menu composto"
              >
                <span
                  className={
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform " +
                    (draft.bundleSlots?.length ? "translate-x-5" : "translate-x-0")
                  }
                />
              </button>
            </div>

            {draft.bundleSlots && draft.bundleSlots.length > 0 && (
              <div className="mt-4 space-y-4">
                {draft.bundleSlots.map((slot, idx) => (
                  <BundleSlotEditor
                    key={slot.id}
                    slot={slot}
                    index={idx}
                    total={draft.bundleSlots!.length}
                    categories={allCategories}
                    allItems={allItems.filter((it) => it.id !== draft.id)}
                    onUpdateLabel={(v) => updateBundleSlot(slot.id, { label: v })}
                    onUpdateHint={(v) => updateBundleSlot(slot.id, { hint: v || undefined })}
                    onToggleCategory={(cid) => toggleSlotCategory(slot.id, cid)}
                    onToggleItem={(iid) => toggleSlotItem(slot.id, iid)}
                    onMoveUp={() => moveBundleSlot(idx, -1)}
                    onMoveDown={() => moveBundleSlot(idx, 1)}
                    onRemove={() => removeBundleSlot(slot.id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={addBundleSlot}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-pork-ink/20 px-4 py-2 text-sm font-bold text-pork-ink/60 hover:border-pork-ink/40 hover:text-pork-ink"
                >
                  <Plus size={15} /> Aggiungi scelta
                </button>
              </div>
            )}
          </div>

        </div>

        <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-pork-ink/10 bg-white px-5 py-4 shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.15)]">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Archiviare "${draft.name}"? Potrai ripristinarlo dal box Archiviati della categoria.`)) {
                removeItem(draft.id);
                onClose();
              }
            }}
            className="text-sm font-semibold text-pork-red hover:underline"
          >
            Archivia piatto
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

        {showMissingTransDialog && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-pork-ink/40 p-4 backdrop-blur-sm"
            onClick={() => setShowMissingTransDialog(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="impact-title text-lg text-pork-ink">
                Traduzioni mancanti
              </h3>
              <p className="mt-2 text-sm text-pork-ink/70">
                Il piatto è visibile ma mancano le traduzioni per:{" "}
                <strong>{missingTransLangs.map((l) => l.toUpperCase()).join(", ")}</strong>.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={saveWithAutoTranslate}
                  className="btn-primary text-sm"
                >
                  <Sparkles size={15} /> Completa con AI e salva
                </button>
                <button
                  onClick={() => {
                    setShowMissingTransDialog(false);
                    persist();
                    persistTranslations();
                    onClose();
                  }}
                  className="rounded-xl border-2 border-pork-ink/20 bg-white px-3 py-2 text-sm font-bold text-pork-ink hover:border-pork-ink"
                >
                  Salva senza tradurre
                </button>
                <button
                  onClick={() => setShowMissingTransDialog(false)}
                  className="mt-1 text-xs text-pork-ink/50 hover:text-pork-ink"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

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
    </GestionePortalSurface>,
    document.body,
  );
}

function BundleSlotEditor({
  slot,
  index,
  total,
  categories,
  allItems,
  onUpdateLabel,
  onUpdateHint,
  onToggleCategory,
  onToggleItem,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  slot: MenuBundleSlot;
  index: number;
  total: number;
  categories: AdminMenuCategory[];
  allItems: import("@/lib/types").AdminMenuItem[];
  onUpdateLabel: (v: string) => void;
  onUpdateHint: (v: string) => void;
  onToggleCategory: (catId: string) => void;
  onToggleItem: (itemId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const [itemSearch, setItemSearch] = useState("");
  const [showItemPicker, setShowItemPicker] = useState(false);

  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase();
    return allItems
      .filter((it) => it.available && it.name.toLowerCase().includes(q))
      .slice(0, 30);
  }, [allItems, itemSearch]);

  const selectedItemNames = useMemo(
    () =>
      (slot.sourceItemIds ?? [])
        .map((id) => allItems.find((it) => it.id === id)?.name ?? id)
        .join(", "),
    [slot.sourceItemIds, allItems],
  );

  return (
    <div className="rounded-xl bg-pork-cream p-3 ring-1 ring-pork-ink/10">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded p-0.5 text-pork-ink/40 hover:text-pork-ink disabled:opacity-20"
            aria-label="Sposta su"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded p-0.5 text-pork-ink/40 hover:text-pork-ink disabled:opacity-20"
            aria-label="Sposta giù"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <GripVertical size={16} className="shrink-0 text-pork-ink/30" />
        <span className="text-xs font-black uppercase tracking-wide text-pork-ink/50">
          Scelta {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto rounded-full p-1 text-pork-ink/40 hover:bg-pork-red/10 hover:text-pork-red"
          aria-label="Rimuovi scelta"
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-pork-ink/50">
            Etichetta *
          </span>
          <input
            type="text"
            value={slot.label}
            onChange={(e) => onUpdateLabel(e.target.value)}
            placeholder="es. Scegli la pizza"
            className="w-full rounded-lg border-2 border-pork-ink/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-pork-red"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-pork-ink/50">
            Suggerimento (opzionale)
          </span>
          <input
            type="text"
            value={slot.hint ?? ""}
            onChange={(e) => onUpdateHint(e.target.value)}
            placeholder="es. Solo tra le classiche"
            className="w-full rounded-lg border-2 border-pork-ink/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-pork-red"
          />
        </label>
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-pork-ink/50">
          Categorie selezionabili
        </p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const active = slot.sourceCategoryIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onToggleCategory(cat.id)}
                className={
                  "rounded-full px-2.5 py-1 text-xs font-bold transition-colors " +
                  (active
                    ? "bg-pork-red text-white"
                    : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10")
                }
              >
                {cat.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-wide text-pork-ink/50">
            Prodotti specifici
            {(slot.sourceItemIds?.length ?? 0) > 0 && (
              <span className="ml-1 text-pork-red">({slot.sourceItemIds!.length})</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => setShowItemPicker((v) => !v)}
            className="text-[11px] font-bold text-pork-red hover:underline"
          >
            {showItemPicker ? "Chiudi" : "Seleziona prodotti"}
          </button>
        </div>

        {(slot.sourceItemIds?.length ?? 0) > 0 && !showItemPicker && (
          <p className="mt-1 text-xs text-pork-ink/60 leading-snug">{selectedItemNames}</p>
        )}

        {showItemPicker && (
          <div className="mt-2 rounded-xl border-2 border-pork-ink/10 bg-white p-2">
            <input
              type="text"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Cerca prodotto…"
              className="mb-2 w-full rounded-lg border border-pork-ink/10 bg-pork-cream px-3 py-1.5 text-sm outline-none focus:border-pork-red"
            />
            <div className="max-h-40 space-y-0.5 overflow-y-auto">
              {filteredItems.map((it) => {
                const checked = slot.sourceItemIds?.includes(it.id) ?? false;
                return (
                  <label
                    key={it.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-pork-cream"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleItem(it.id)}
                      className="accent-pork-red"
                    />
                    <span className="flex-1 text-sm font-semibold">{it.name}</span>
                    <span className="text-xs text-pork-ink/40">
                      {categories.find((c) => c.id === it.categoryId)?.title ?? it.categoryId}
                    </span>
                  </label>
                );
              })}
              {filteredItems.length === 0 && (
                <p className="px-2 py-2 text-xs text-pork-ink/40">Nessun prodotto trovato</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-pork-ink/60">
        {label}
        {help && <HelpHint text={help} size={12} />}
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
