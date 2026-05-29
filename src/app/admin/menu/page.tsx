"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  Eye,
  ListChecks,
  ListPlus,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  useMenuStore,
  selectCategoriesOrdered,
  selectItemsByCategory,
  selectMenuListsOrdered,
} from "@/store/menu-store";
import type { AdminMenuItem, AdminMenuList, MenuAvailability, MenuDay } from "@/lib/types";
import { formatEuro, minPrice } from "@/lib/price-utils";
import { ItemEditor } from "@/components/admin/item-editor";
import { ExtraListsManager } from "@/components/admin/extra-lists-manager";
import { MenuPhotoImporter } from "@/components/admin/menu-photo-importer";
import { useHydrated } from "@/components/core/providers";
import { useTenantOrNull } from "@/components/core/tenant-provider";
import { getModuleLabel } from "@/lib/vertical";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useSettingsStore } from "@/store/settings-store";
import { useSupabaseMenuSync } from "@/lib/menu-sync-client";

const DAY_OPTIONS: Array<{ value: MenuDay; label: string }> = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Gio" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" },
];

function formatMenuRules(menu: AdminMenuList): string {
  const rules: string[] = [];
  if (menu.visibility.startTime || menu.visibility.endTime) {
    rules.push(`${menu.visibility.startTime || "00:00"}-${menu.visibility.endTime || "23:59"}`);
  }
  if (menu.visibility.days?.length) {
    rules.push(
      menu.visibility.days
        .map((day) => DAY_OPTIONS.find((option) => option.value === day)?.label)
        .filter(Boolean)
        .join(", "),
    );
  }
  if (menu.visibility.tableIds?.length) {
    rules.push(`${menu.visibility.tableIds.length} tavoli/postazioni`);
  }
  return rules.length > 0 ? rules.join(" · ") : "Sempre visibile";
}

export default function AdminMenuPage() {
  const hydrated = useHydrated();
  const tenant = useTenantOrNull();
  const tenantId = tenant?.id ?? "bepork";
  const syncStatus = useSupabaseMenuSync(tenantId, true, true);
  const vertical = tenant?.vertical ?? "food";
  const isServices = vertical === "services";
  const listinoLabel = getModuleLabel("onlineMenu", vertical);
  const { allowTakeaway, allowTableOrders, orderKioskEnabled } = useEffectiveFeatures();
  const onlineOrderingActive = allowTakeaway || allowTableOrders || orderKioskEnabled;
  const showMenuPrices = useSettingsStore((s) => s.showMenuPrices);
  const setSettings = useSettingsStore((s) => s.set);
  const categoriesRaw = useMenuStore((s) => s.categories);
  const items = useMenuStore((s) => s.items);
  const menuListsRaw = useMenuStore((s) => s.menuLists);
  const tables = useMenuStore((s) => s.tables);
  const setAvailable = useMenuStore((s) => s.setAvailable);
  const updateCategory = useMenuStore((s) => s.updateCategory);
  const addItem = useMenuStore((s) => s.addItem);
  const addMenuList = useMenuStore((s) => s.addMenuList);
  const updateMenuList = useMenuStore((s) => s.updateMenuList);
  const removeMenuList = useMenuStore((s) => s.removeMenuList);
  const toggleMenuListItem = useMenuStore((s) => s.toggleMenuListItem);
  const extraLists = useMenuStore((s) => s.extraLists);
  const applyExtraListToItemIds = useMenuStore((s) => s.applyExtraListToItemIds);

  const [view, setView] = useState<"items" | "menus">("items");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "unavailable">(
    "all",
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkListId, setBulkListId] = useState("");

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function selectAllInList(all: AdminMenuItem[]) {
    setSelected((prev) => {
      const n = new Set(prev);
      for (const it of all) n.add(it.id);
      return n;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const categories = useMemo(
    () => selectCategoriesOrdered({ categories: categoriesRaw } as never),
    [categoriesRaw],
  );

  const menuLists = useMemo(
    () => selectMenuListsOrdered({ menuLists: menuListsRaw } as never),
    [menuListsRaw],
  );

  const editingMenu = editingMenuId
    ? menuLists.find((menu) => menu.id === editingMenuId) ?? null
    : null;

  const editing = editingId ? items.find((i) => i.id === editingId) ?? null : null;

  function filtered(all: AdminMenuItem[]): AdminMenuItem[] {
    let out = all;
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q),
      );
    }
    if (filter === "available") out = out.filter((i) => i.available);
    if (filter === "unavailable") out = out.filter((i) => !i.available);
    return out;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="headline text-4xl">{listinoLabel}</h1>
        <p className="text-pork-ink/60">
          {isServices
            ? "Gestisci servizi, prezzi, disponibilità, foto e listini pubblici con regole di visibilità."
            : "Lista completa dei piatti e menu pubblici composti con regole di visibilità."}
        </p>
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-pork-ink/45">
          {syncStatus === "saving"
            ? "Sincronizzazione Supabase..."
            : syncStatus === "error"
              ? "Errore sincronizzazione Supabase"
              : "Dati sincronizzati su Supabase"}
        </p>
      </header>

      <div className="inline-flex rounded-2xl bg-white p-1 ring-1 ring-pork-ink/10">
        {[
          { key: "items" as const, label: isServices ? "Servizi" : "Lista piatti" },
          { key: "menus" as const, label: isServices ? "Listini pubblici" : "Menu" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setView(option.key)}
            className={
              "rounded-xl px-4 py-2 text-sm font-black transition " +
              (view === option.key
                ? "bg-pork-ink text-pork-cream"
                : "text-pork-ink/55 hover:text-pork-ink")
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {hydrated && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-pork-ink/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-bold text-pork-ink">
                <Eye size={16} className="text-pork-red" />
                Mostra prezzi
              </p>
              <p className="mt-1 text-sm text-pork-ink/60">
                Se disattivata, il menu pubblico nasconde l&apos;elemento prezzo dalle schede dei piatti.
              </p>
              {onlineOrderingActive && (
                <p className="mt-2 rounded-xl bg-pork-mustard/25 px-3 py-2 text-xs font-bold text-pork-ink/70">
                  Opzione non disponibile con la modalita ordina online attiva: i prezzi restano visibili.
                </p>
              )}
            </div>
            <label
              className={
                "inline-flex shrink-0 items-center gap-3 rounded-full px-3 py-2 ring-1 " +
                (onlineOrderingActive
                  ? "cursor-not-allowed bg-pork-ink/5 text-pork-ink/35 ring-pork-ink/10"
                  : "cursor-pointer bg-pork-cream text-pork-ink ring-pork-ink/10")
              }
            >
              <input
                type="checkbox"
                checked={onlineOrderingActive || showMenuPrices}
                disabled={onlineOrderingActive}
                onChange={(event) => setSettings({ showMenuPrices: event.target.checked })}
                className="h-4 w-4 accent-pork-red disabled:cursor-not-allowed"
              />
              <span className="text-sm font-black">
                {onlineOrderingActive || showMenuPrices ? "Prezzi visibili" : "Prezzi nascosti"}
              </span>
            </label>
          </div>
        </section>
      )}

      {view === "items" && <MenuPhotoImporter categories={categories} isServices={isServices} />}

      {view === "items" && <ExtraListsManager />}

      {view === "items" && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-pork-mustard/50 bg-pork-mustard/10 p-3">
          <span className="text-sm font-bold text-pork-ink">
            {selected.size} selezionati
          </span>
          <select
            className="min-w-0 flex-1 rounded-lg border-2 border-pork-ink/10 bg-white px-2 py-1.5 text-sm sm:max-w-xs"
            value={bulkListId}
            onChange={(e) => setBulkListId(e.target.value)}
          >
            <option value="">Scegli lista…</option>
            {extraLists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!bulkListId}
            onClick={() => {
              if (!bulkListId) return;
              applyExtraListToItemIds(bulkListId, [...selected]);
              clearSelection();
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-pork-ink px-3 py-1.5 text-sm font-bold text-pork-cream disabled:opacity-40"
          >
            <ListPlus size={16} />
            Applica
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="text-sm font-semibold text-pork-ink/60 hover:underline"
          >
            Annulla
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-pork-ink/5">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-pork-cream px-3 py-2">
          <Search size={16} className="text-pork-ink/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isServices ? "Cerca servizio..." : "Cerca piatto..."}
            className="w-full bg-transparent outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-pork-cream p-1">
          {[
            { v: "all" as const, l: "Tutti" },
            { v: "available" as const, l: "Disponibili" },
            { v: "unavailable" as const, l: isServices ? "Non disponibili" : "Esauriti" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setFilter(o.v)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors " +
                (filter === o.v
                  ? "bg-pork-ink text-pork-cream"
                  : "text-pork-ink/60 hover:text-pork-ink")
              }
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {hydrated && view === "menus" && (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="impact-title text-xl text-pork-ink">
                {isServices ? "Listini pubblicati" : "Menu pubblicati"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  const id = addMenuList({
                    name: isServices ? "Nuovo listino" : "Nuovo menu",
                    description: isServices
                      ? "Selezione personalizzata di servizi."
                      : "Selezione personalizzata di piatti.",
                    itemIds: [],
                    visibility: {},
                  });
                  setEditingMenuId(id);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-pork-cream hover:bg-pork-red"
              >
                <Plus size={13} /> {isServices ? "Crea listino" : "Crea menu"}
              </button>
            </div>

            {menuLists.map((menu) => (
              <button
                key={menu.id}
                type="button"
                onClick={() => setEditingMenuId(menu.id)}
                className={
                  "w-full rounded-2xl bg-white p-4 text-left ring-1 transition " +
                  (editingMenuId === menu.id
                    ? "ring-pork-red"
                    : "ring-pork-ink/5 hover:ring-pork-red/30")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-pork-ink">{menu.name}</p>
                    <p className="mt-1 text-xs text-pork-ink/55">
                      {menu.itemIds.length} {isServices ? "servizi" : "piatti"} · {formatMenuRules(menu)}
                    </p>
                  </div>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[10px] font-black uppercase " +
                      (menu.enabled
                        ? "bg-pork-green text-white"
                        : "bg-pork-ink/10 text-pork-ink/45")
                    }
                  >
                    {menu.enabled ? "Visibile" : "Sospeso"}
                  </span>
                </div>
                {menu.description && (
                  <p className="mt-2 text-sm text-pork-ink/65">{menu.description}</p>
                )}
              </button>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
            {!editingMenu ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center text-pork-ink/45">
                <ListChecks size={34} />
                <p className="mt-3 text-sm font-bold">
                  {isServices ? "Seleziona o crea un listino." : "Seleziona o crea un menu."}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="impact-title text-xs text-pork-red">Composizione</p>
                    <h2 className="headline text-3xl">{editingMenu.name}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Eliminare "${editingMenu.name}"?`)) return;
                      removeMenuList(editingMenu.id);
                      setEditingMenuId(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-pork-red/30 px-3 py-1.5 text-xs font-bold text-pork-red hover:bg-pork-red hover:text-white"
                  >
                    <Trash2 size={13} /> Elimina
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                      {isServices ? "Nome listino" : "Nome menu"}
                    </span>
                    <input
                      value={editingMenu.name}
                      onChange={(e) =>
                        updateMenuList(editingMenu.id, { name: e.target.value })
                      }
                      className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                      Stato
                    </span>
                    <select
                      value={editingMenu.enabled ? "on" : "off"}
                      onChange={(e) =>
                        updateMenuList(editingMenu.id, {
                          enabled: e.target.value === "on",
                        })
                      }
                      className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
                    >
                      <option value="on">Visibile se le regole corrispondono</option>
                      <option value="off">Sospeso</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                    Descrizione
                  </span>
                  <textarea
                    rows={2}
                    value={editingMenu.description ?? ""}
                    onChange={(e) =>
                      updateMenuList(editingMenu.id, {
                        description: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
                  />
                </label>

                <div className="rounded-2xl bg-pork-cream p-4">
                  <div className="mb-3 flex items-center gap-2 font-bold text-pork-ink">
                    <Clock size={16} className="text-pork-red" />
                    Automazioni visibilità
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label>
                      <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                        Dalle
                      </span>
                      <input
                        type="time"
                        value={editingMenu.visibility.startTime ?? ""}
                        onChange={(e) =>
                          updateMenuList(editingMenu.id, {
                            visibility: {
                              ...editingMenu.visibility,
                              startTime: e.target.value || undefined,
                            },
                          })
                        }
                        className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                        Alle
                      </span>
                      <input
                        type="time"
                        value={editingMenu.visibility.endTime ?? ""}
                        onChange={(e) =>
                          updateMenuList(editingMenu.id, {
                            visibility: {
                              ...editingMenu.visibility,
                              endTime: e.target.value || undefined,
                            },
                          })
                        }
                        className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
                      />
                    </label>
                  </div>

                  <div className="mt-4">
                    <span className="mb-2 block text-xs font-bold uppercase text-pork-ink/50">
                      Giorni
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {DAY_OPTIONS.map((day) => {
                        const active = editingMenu.visibility.days?.includes(day.value) ?? false;
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              const current = editingMenu.visibility.days ?? [];
                              const next = active
                                ? current.filter((value) => value !== day.value)
                                : [...current, day.value];
                              updateMenuList(editingMenu.id, {
                                visibility: {
                                  ...editingMenu.visibility,
                                  days: next.length > 0 ? next : undefined,
                                },
                              });
                            }}
                            className={
                              "rounded-full px-3 py-1.5 text-xs font-black transition " +
                              (active
                                ? "bg-pork-red text-white"
                                : "bg-white text-pork-ink/55 ring-1 ring-pork-ink/10")
                            }
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                      Tavoli specifici
                    </span>
                    <select
                      multiple
                      value={editingMenu.visibility.tableIds ?? []}
                      onChange={(e) =>
                        updateMenuList(editingMenu.id, {
                          visibility: {
                            ...editingMenu.visibility,
                            tableIds:
                              Array.from(e.target.selectedOptions).map(
                                (option) => option.value,
                              ).length > 0
                                ? Array.from(e.target.selectedOptions).map(
                                    (option) => option.value,
                                  )
                                : undefined,
                          },
                        })
                      }
                      className="h-28 w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 text-sm outline-none focus:border-pork-red"
                    >
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.label}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-xs text-pork-ink/45">
                      Nessuna selezione = tutte le postazioni. Usa Cmd/Ctrl per selezioni multiple.
                    </span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="impact-title text-sm text-pork-ink/70">
                      {isServices ? "Servizi nel listino" : "Piatti nel menu"}
                    </h3>
                    <span className="text-xs font-bold text-pork-ink/45">
                      {editingMenu.itemIds.length} selezionati
                    </span>
                  </div>

                  {categories.map((cat) => {
                    const catItems = filtered(selectItemsByCategory(items, cat.id));
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat.id} className="space-y-2">
                        <p className="text-xs font-black uppercase text-pork-ink/45">
                          {cat.title}
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {catItems.map((item) => {
                            const included = editingMenu.itemIds.includes(item.id);
                            return (
                              <label
                                key={item.id}
                                className="flex cursor-pointer items-center gap-2 rounded-xl border border-pork-ink/10 bg-pork-cream/70 px-3 py-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={included}
                                  onChange={() =>
                                    toggleMenuListItem(editingMenu.id, item.id)
                                  }
                                  className="h-4 w-4 accent-pork-red"
                                />
                                <span className={included ? "font-bold" : ""}>
                                  {item.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {hydrated && view === "items" &&
        categories.map((cat) => {
          const catItems = filtered(selectItemsByCategory(items, cat.id));
          if (catItems.length === 0 && (query || filter !== "all")) return null;
          return (
            <section key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="impact-title text-xl text-pork-ink">
                  {cat.title}{" "}
                  <span className="ml-2 text-xs text-pork-ink/40">
                    {catItems.length}
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  {catItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => selectAllInList(catItems)}
                      className="rounded-full border border-pork-ink/15 bg-white px-2 py-1 text-[10px] font-bold uppercase text-pork-ink/60 hover:border-pork-red/40"
                    >
                      Seleziona categoria
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const id = addItem(cat.id, {
                        name: `Nuovo in ${cat.title}`,
                        price: { kind: "single", value: 0 },
                      });
                      setEditingId(id);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1 text-xs font-bold hover:bg-pork-ink hover:text-pork-cream"
                  >
                    <Plus size={12} /> Aggiungi
                  </button>
                </div>
              </div>
              <CategoryAvailabilityEditor
                value={cat.availability}
                onChange={(next) => updateCategory(cat.id, { availability: next })}
              />

              <ul className="grid gap-2 md:grid-cols-2">
                {catItems.length === 0 ? (
                  <li className="col-span-full rounded-xl bg-white p-4 text-sm text-pork-ink/40">
                    {isServices ? "Nessun servizio." : "Nessun piatto."}
                  </li>
                ) : (
                  catItems.map((it) => (
                    <li
                      key={it.id}
                      className="group flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-pork-ink/5"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-pork-red"
                        checked={selected.has(it.id)}
                        onChange={() => toggleSelect(it.id)}
                        aria-label={`Seleziona ${it.name}`}
                      />
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-pork-cream">
                        {it.image ? (
                          <Image
                            src={it.image}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-pork-ink/30">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={
                            "impact-title text-base leading-tight " +
                            (it.available ? "text-pork-ink" : "text-pork-ink/40")
                          }
                        >
                          {it.name}
                        </p>
                        <p className="text-xs text-pork-ink/60">
                          da {formatEuro(minPrice(it.price))}
                          {it.tags && it.tags.length > 0 && (
                            <span className="ml-1 text-pork-red">
                              · {it.tags.join(", ")}
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAvailable(it.id, !it.available)}
                        className={
                          "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors " +
                          (it.available
                            ? "bg-pork-green/10 text-pork-green hover:bg-pork-green hover:text-white"
                            : "bg-pork-ink/10 text-pork-ink/40 hover:bg-pork-red hover:text-white")
                        }
                        aria-label={
                          it.available
                            ? "Rendi non disponibile"
                            : "Rendi disponibile"
                        }
                        title={
                          it.available ? "Disponibile" : "Non disponibile"
                        }
                      >
                        {it.available ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <XCircle size={18} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingId(it.id)}
                        className="rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-pork-cream hover:bg-pork-red"
                      >
                        Modifica
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}

      {editing && (
        <ItemEditor item={editing} onClose={() => setEditingId(null)} />
      )}
    </div>
  );
}

function CategoryAvailabilityEditor({
  value,
  onChange,
}: {
  value: MenuAvailability | undefined;
  onChange: (next: MenuAvailability | undefined) => void;
}) {
  const enabled = !!value;
  const av = value ?? { label: "", from: "12:00", to: "15:00" };

  return (
    <div className="rounded-xl border border-pork-ink/10 bg-pork-cream/40 px-3 py-2 text-xs text-pork-ink/80">
      <label className="flex items-center gap-2 font-bold uppercase tracking-wider">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? { label: av.label || "Servita", from: av.from, to: av.to }
                : undefined,
            )
          }
          className="h-3.5 w-3.5 accent-pork-red"
        />
        Fascia oraria
        {enabled && (
          <span className="ml-2 font-normal normal-case text-pork-ink/55">
            ({av.label || "—"} {av.from}–{av.to})
          </span>
        )}
      </label>
      {enabled && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={av.label}
            onChange={(e) => onChange({ ...av, label: e.target.value })}
            placeholder="Es. Pranzo, Cena, Aperisushi"
            className="w-40 rounded-md border border-pork-ink/15 bg-white px-2 py-1 text-xs"
          />
          <span className="text-pork-ink/40">dalle</span>
          <input
            type="time"
            value={av.from}
            onChange={(e) => onChange({ ...av, from: e.target.value })}
            className="rounded-md border border-pork-ink/15 bg-white px-2 py-1 text-xs"
          />
          <span className="text-pork-ink/40">alle</span>
          <input
            type="time"
            value={av.to}
            onChange={(e) => onChange({ ...av, to: e.target.value })}
            className="rounded-md border border-pork-ink/15 bg-white px-2 py-1 text-xs"
          />
        </div>
      )}
    </div>
  );
}
