"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import type { ExtraList, Extra } from "@/lib/types";
import { useMenuStore } from "@/store/menu-store";
import { formatEuro } from "@/lib/price-utils";

function genExtraId() {
  return `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function ExtraListsManager() {
  const [open, setOpen] = useState(true);
  const extraLists = useMenuStore((s) => s.extraLists);
  const addExtraList = useMenuStore((s) => s.addExtraList);
  const updateExtraList = useMenuStore((s) => s.updateExtraList);
  const removeExtraList = useMenuStore((s) => s.removeExtraList);
  const items = useMenuStore((s) => s.items);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [exName, setExName] = useState("");
  const [exPrice, setExPrice] = useState("");
  const [createdEmptyId, setCreatedEmptyId] = useState<string | null>(null);

  const editing = editingId
    ? extraLists.find((l) => l.id === editingId) ?? null
    : null;

  const usage = (id: string) => items.filter((i) => i.extraListId === id).length;

  function startCreate() {
    const id = addExtraList("Nuova lista");
    setEditingId(id);
    setNameInput("Nuova lista");
    setCreatedEmptyId(id);
  }

  function closeEditor() {
    const id = editingId;
    if (!id) {
      setEditingId(null);
      return;
    }
    const current = extraLists.find((l) => l.id === id);
    const isJustCreated = createdEmptyId === id;
    const trimmedName = nameInput.trim();
    if (
      isJustCreated &&
      (current?.extras?.length ?? 0) === 0 &&
      (trimmedName === "" || trimmedName === "Nuova lista")
    ) {
      removeExtraList(id);
    } else {
      saveEditing();
    }
    setEditingId(null);
    setCreatedEmptyId(null);
  }

  function startEdit(l: ExtraList) {
    setEditingId(l.id);
    setNameInput(l.name);
  }

  function saveEditing() {
    if (!editing) return;
    const next: ExtraList = {
      ...editing,
      name: nameInput.trim() || editing.name,
    };
    updateExtraList(editing.id, next);
  }

  function addRow() {
    if (!editing) return;
    const n = exName.trim();
    const p = parseFloat(exPrice.replace(",", "."));
    if (!n || !Number.isFinite(p) || p < 0) return;
    const row: Extra = { id: genExtraId(), name: n, price: p };
    const next: ExtraList = { ...editing, extras: [...editing.extras, row] };
    updateExtraList(editing.id, next);
    setExName("");
    setExPrice("");
  }

  function removeRow(rid: string) {
    if (!editing) return;
    const next: ExtraList = {
      ...editing,
      extras: editing.extras.filter((e) => e.id !== rid),
    };
    updateExtraList(editing.id, next);
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-pork-ink/10 bg-pork-ink/[0.03]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 p-4 text-left"
        >
          <div>
            <h2 className="impact-title text-sm text-pork-red">Liste aggiunte</h2>
            <p className="text-xs text-pork-ink/60">
              Una modifica si riflette su tutti i piatti collegati.
            </p>
          </div>
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {open && (
          <div className="space-y-3 border-t border-pork-ink/10 p-4 pt-0">
            <ul className="max-h-48 space-y-1.5 overflow-y-auto">
              {extraLists.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-pork-ink/5"
                >
                  <div className="min-w-0">
                    <p className="font-bold leading-tight">{l.name}</p>
                    <p className="text-[11px] text-pork-ink/50">
                      {l.extras.length} voci · in uso su {usage(l.id)} piatti
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(l)}
                      className="rounded-lg p-2 text-pork-ink hover:bg-pork-mustard/30"
                      title="Modifica"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const used = usage(l.id);
                        if (used > 0 && !confirm(`In uso su ${used} piatti. Rimuovo la lista da tutti?`)) return;
                        removeExtraList(l.id);
                      }}
                      className="rounded-lg p-2 text-pork-ink/40 hover:bg-pork-red/10 hover:text-pork-red"
                      title="Elimina lista"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={startCreate}
              className="inline-flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed border-pork-ink/20 py-2 text-sm font-bold text-pork-ink/70 hover:border-pork-red/40 hover:text-pork-red"
            >
              <Plus size={16} />
              Nuova lista
            </button>
          </div>
        )}
      </div>

      {editing && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-pork-ink/60 p-4 backdrop-blur-sm"
          onClick={closeEditor}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-pork-cream shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-pork-ink/10 px-4 py-3">
              <p className="text-xs font-bold text-pork-red">Modifica lista</p>
              <input
                className="mt-1 w-full border-0 border-b-2 border-pork-ink/20 bg-transparent py-1 text-lg font-bold outline-none focus:border-pork-red"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveEditing}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <p className="mb-2 text-xs text-pork-ink/50">
                Voci e prezzi condivise tra i piatti assegnati a questa lista.
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg border-2 border-pork-ink/10 px-2 py-1.5 text-sm"
                  value={exName}
                  onChange={(e) => setExName(e.target.value)}
                  placeholder="Aggiunta"
                />
                <input
                  className="w-20 rounded-lg border-2 border-pork-ink/10 px-2 py-1.5 text-sm"
                  value={exPrice}
                  onChange={(e) => setExPrice(e.target.value)}
                  placeholder="€"
                  inputMode="decimal"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRow();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addRow}
                  className="rounded-lg bg-pork-ink px-3 py-1.5 text-sm font-bold text-pork-cream"
                >
                  +
                </button>
              </div>
              <ul className="mt-3 space-y-1.5">
                {editing.extras.map((ex) => (
                  <li
                    key={ex.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-pork-ink/5"
                  >
                    <span className="font-semibold">{ex.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-pork-red">+{formatEuro(ex.price)}</span>
                      <button
                        type="button"
                        onClick={() => removeRow(ex.id)}
                        className="text-pork-ink/30 hover:text-pork-red"
                        title="Rimuovi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-pork-ink/10 p-3">
              <button
                type="button"
                onClick={() => {
                  if (
                    usage(editing.id) > 0 &&
                    !confirm(
                      `In uso su ${usage(editing.id)} piatti. Rimuovo la lista da tutti?`,
                    )
                  ) {
                    return;
                  }
                  removeExtraList(editing.id);
                  setEditingId(null);
                }}
                className="text-sm text-pork-red hover:underline"
              >
                Elimina lista
              </button>
              <button
                type="button"
                onClick={closeEditor}
                className="ml-auto btn-primary text-sm"
              >
                Fine
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
