"use client";

import { useRef, useState } from "react";
import { Camera, Check, Loader2, Trash2, UploadCloud, WandSparkles } from "lucide-react";
import { ADMIN_TOKEN_HEADER, getAdminPassword } from "@/lib/admin-auth";
import type { AdminMenuCategory, MenuTag } from "@/lib/types";
import { priceToMenuFormat, type ExtractedMenuPhotoItem } from "@/lib/menu-photo-import";
import { useMenuStore } from "@/store/menu-store";
import { formatEuro } from "@/lib/price-utils";
import { ImageUpload } from "./image-upload";

type DraftImportItem = ExtractedMenuPhotoItem & {
  id: string;
  categoryId: string;
  image?: string;
  selected: boolean;
};

type ImportResponse = {
  ok?: boolean;
  items?: ExtractedMenuPhotoItem[];
  warnings?: string[];
  rawText?: string;
  error?: string;
};

function bestCategoryId(categories: AdminMenuCategory[], categoryName: string): string {
  const normalized = categoryName.trim().toLowerCase();
  return (
    categories.find((category) => category.title.trim().toLowerCase() === normalized)?.id ??
    categories.find((category) => normalized.includes(category.title.trim().toLowerCase()))?.id ??
    categories[0]?.id ??
    ""
  );
}

function toMenuTags(tags: string[]): MenuTag[] {
  const normalized = new Set(tags.map((tag) => tag.toLowerCase()));
  const out: MenuTag[] = [];
  if (normalized.has("firma") || normalized.has("speciale") || normalized.has("signature")) out.push("firma");
  if (normalized.has("piccante") || normalized.has("spicy")) out.push("piccante");
  if (normalized.has("veg") || normalized.has("vegetariano") || normalized.has("vegetarian")) out.push("veg");
  if (normalized.has("novita") || normalized.has("novità") || normalized.has("new")) out.push("novita");
  return out;
}

export function MenuPhotoImporter({
  categories,
  isServices,
  tenantId,
}: {
  categories: AdminMenuCategory[];
  isServices: boolean;
  tenantId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addItems = useMenuStore((s) => s.addItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<DraftImportItem[]>([]);

  async function importPhoto(file: File) {
    setBusy(true);
    setError(null);
    setWarnings([]);
    setSourceName(file.name);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("locale", "it");
      form.append("context", isServices ? "Listino servizi" : "Menu ristorante");
      const response = await fetch(`/api/ai/menu-photo-import?tenantId=${encodeURIComponent(tenantId)}`, {
        method: "POST",
        headers: { [ADMIN_TOKEN_HEADER]: getAdminPassword() },
        body: form,
      });
      const payload = (await response.json().catch(() => ({}))) as ImportResponse;
      if (!response.ok) throw new Error(payload.error ?? "Import non riuscito");
      const items = payload.items ?? [];
      setWarnings(payload.warnings ?? []);
      setDrafts(
        items.map((item, index) => ({
          ...item,
          id: `import-${Date.now().toString(36)}-${index}`,
          categoryId: bestCategoryId(categories, item.categoryName),
          selected: true,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import non riuscito");
    } finally {
      setBusy(false);
    }
  }

  function patchDraft(id: string, patch: Partial<DraftImportItem>) {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }

  function approve() {
    const selected = drafts.filter((draft) => draft.selected && draft.categoryId && draft.name.trim());
    if (selected.length === 0) return;
    addItems(
      selected.map((draft) => ({
        categoryId: draft.categoryId,
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        price: priceToMenuFormat(draft.price),
        image: draft.image,
        tags: toMenuTags(draft.tags),
      })),
    );
    setDrafts([]);
    setWarnings([]);
    setSourceName("");
  }

  const selectedCount = drafts.filter((draft) => draft.selected).length;

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-pork-ink/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-bold text-pork-ink">
            <Camera size={16} className="text-pork-red" />
            Importa da foto
          </p>
          <p className="mt-1 text-sm text-pork-ink/60">
            Carica una foto del vecchio menu o di appunti: l&apos;IA riconosce piu voci e prepara una bozza da approvare.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-4 py-2 text-sm font-black text-pork-cream hover:bg-pork-red disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            {busy ? "Analizzo..." : "Carica foto"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importPhoto(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {sourceName && (
        <p className="mt-3 text-xs font-bold text-pork-ink/45">
          Sorgente: {sourceName}
        </p>
      )}
      {error && <p className="mt-3 rounded-xl bg-pork-red/10 px-3 py-2 text-sm font-bold text-pork-red">{error}</p>}
      {warnings.length > 0 && (
        <div className="mt-3 rounded-xl bg-pork-mustard/20 px-3 py-2 text-xs font-semibold text-pork-ink/70">
          {warnings.join(" ")}
        </div>
      )}

      {drafts.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-black text-pork-ink">
              <WandSparkles size={15} className="text-pork-red" />
              Anteprima importazione
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-pork-ink/45">
                {selectedCount} di {drafts.length} selezionati
              </span>
              <button
                type="button"
                onClick={approve}
                disabled={selectedCount === 0}
                className="inline-flex items-center gap-1 rounded-full bg-pork-red px-3 py-1.5 text-xs font-black text-white disabled:opacity-40"
              >
                <Check size={14} />
                Approva e carica
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className={
                  "grid gap-3 rounded-2xl border p-3 md:grid-cols-[auto_minmax(0,1fr)_180px] " +
                  (draft.selected ? "border-pork-ink/10 bg-pork-cream/55" : "border-pork-ink/5 bg-pork-ink/[0.03] opacity-65")
                }
              >
                <label className="flex items-start gap-2 pt-2 text-xs font-bold text-pork-ink/60">
                  <input
                    type="checkbox"
                    checked={draft.selected}
                    onChange={(event) => patchDraft(draft.id, { selected: event.target.checked })}
                    className="mt-0.5 h-4 w-4 accent-pork-red"
                  />
                  Usa
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-[10px] font-black uppercase text-pork-ink/45">Nome</span>
                    <input
                      value={draft.name}
                      onChange={(event) => patchDraft(draft.id, { name: event.target.value })}
                      className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-pork-red"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase text-pork-ink/45">Categoria</span>
                    <select
                      value={draft.categoryId}
                      onChange={(event) => patchDraft(draft.id, { categoryId: event.target.value })}
                      className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-pork-red"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase text-pork-ink/45">Prezzo</span>
                    <input
                      value={draft.price == null ? "" : String(draft.price).replace(".", ",")}
                      onChange={(event) => {
                        const parsed = Number.parseFloat(event.target.value.replace(",", "."));
                        patchDraft(draft.id, { price: Number.isFinite(parsed) ? parsed : null });
                      }}
                      placeholder="Da verificare"
                      inputMode="decimal"
                      className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-pork-red"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-[10px] font-black uppercase text-pork-ink/45">Descrizione</span>
                    <textarea
                      rows={2}
                      value={draft.description}
                      onChange={(event) => patchDraft(draft.id, { description: event.target.value })}
                      className="w-full resize-none rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-pork-red"
                    />
                  </label>
                  <p className="sm:col-span-2 text-[11px] font-semibold text-pork-ink/50">
                    Confidenza {Math.round(draft.confidence * 100)}%
                    {draft.price != null ? ` · ${formatEuro(draft.price)}` : " · prezzo da verificare"}
                    {draft.needsPhoto ? " · foto consigliata" : " · foto opzionale"}
                  </p>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-pork-ink/45">Foto articolo</span>
                    {draft.image && (
                      <button
                        type="button"
                        onClick={() => patchDraft(draft.id, { image: undefined })}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-pork-red"
                      >
                        <Trash2 size={11} />
                        Rimuovi
                      </button>
                    )}
                  </div>
                  <ImageUpload
                    value={draft.image}
                    tenantId={tenantId}
                    onChange={(image) => patchDraft(draft.id, { image })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
