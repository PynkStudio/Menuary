"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link2, Move, Plus, QrCode, Receipt, Trash2, Unlink, Users } from "lucide-react";
import {
  type RoomTable,
  type RoomTableStatus,
  useRestaurantServicesStore,
} from "@/store/restaurant-services-store";

const statuses: RoomTableStatus[] = [
  "libero",
  "prenotato",
  "occupato",
  "pagamento",
  "pulizia",
];

type RenderNode = {
  kind: "single" | "group";
  tables: RoomTable[];
};

function statusClass(status: RoomTableStatus) {
  if (status === "libero") return "border-pork-green bg-pork-green text-white";
  if (status === "prenotato") return "border-pork-mustard bg-pork-mustard text-pork-ink";
  if (status === "occupato") return "border-pork-red bg-pork-red text-white";
  if (status === "pagamento") return "border-pork-ink bg-pork-ink text-pork-cream";
  return "border-pork-ink/30 bg-white text-pork-ink";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function mergeLabel(tables: RoomTable[], table: RoomTable) {
  if (!table.mergeGroupId) return table.label;
  const group = tables.filter((item) => item.mergeGroupId === table.mergeGroupId);
  const seats = group.reduce((sum, item) => sum + item.seats, 0);
  return `${group.map((item) => item.label).join("+")} · ${seats}`;
}

function tableBounds(tables: RoomTable[]) {
  const left = Math.min(...tables.map((table) => table.x));
  const top = Math.min(...tables.map((table) => table.y));
  const right = Math.max(...tables.map((table) => table.x + table.width));
  const bottom = Math.max(...tables.map((table) => table.y + table.height));
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

export function FloorPlanEditor({
  getTableSession,
  onOpenTable,
  onCloseTable,
  onShowQR,
}: {
  getTableSession?: (table: RoomTable) => {
    active: boolean;
    total: number;
    ordersCount: number;
  };
  onOpenTable?: (table: RoomTable) => void;
  onCloseTable?: (table: RoomTable) => void;
  onShowQR?: (table: RoomTable) => void;
}) {
  const roomTables = useRestaurantServicesStore((state) => state.roomTables);
  const addRoomTable = useRestaurantServicesStore((state) => state.addRoomTable);
  const updateRoomTable = useRestaurantServicesStore((state) => state.updateRoomTable);
  const updateRoomTableStatus = useRestaurantServicesStore(
    (state) => state.updateRoomTableStatus,
  );
  const removeRoomTable = useRestaurantServicesStore((state) => state.removeRoomTable);
  const mergeRoomTables = useRestaurantServicesStore((state) => state.mergeRoomTables);
  const unmergeRoomTable = useRestaurantServicesStore((state) => state.unmergeRoomTable);

  const areas = useMemo(
    () => Array.from(new Set(roomTables.map((table) => table.area))).sort(),
    [roomTables],
  );
  const [activeArea, setActiveArea] = useState(areas[0] ?? "Sala ristorante");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!areas.includes(activeArea) && areas[0]) setActiveArea(areas[0]);
  }, [activeArea, areas]);

  const visibleTables = useMemo(
    () => roomTables.filter((table) => table.area === activeArea),
    [activeArea, roomTables],
  );

  const renderNodes = useMemo<RenderNode[]>(() => {
    const seen = new Set<string>();
    const nodes: RenderNode[] = [];
    for (const table of visibleTables) {
      if (!table.mergeGroupId) {
        nodes.push({ kind: "single", tables: [table] });
        continue;
      }
      if (seen.has(table.mergeGroupId)) continue;
      seen.add(table.mergeGroupId);
      const group = visibleTables.filter((item) => item.mergeGroupId === table.mergeGroupId);
      nodes.push({ kind: "group", tables: group });
    }
    return nodes;
  }, [visibleTables]);

  const selectedTable = roomTables.find((table) => table.id === selectedIds[0]);
  const selectedSession = selectedTable ? getTableSession?.(selectedTable) : undefined;
  const selectedTables = roomTables.filter((table) => selectedIds.includes(table.id));
  const selectedBounds = selectedTables.length > 0 ? tableBounds(selectedTables) : null;

  function dragTables(tablesToMove: RoomTable[], event: React.PointerEvent<HTMLButtonElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = canvas.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originals = tablesToMove.map((table) => ({
      id: table.id,
      x: table.x,
      y: table.y,
      width: table.width,
      height: table.height,
    }));
    const bounds = tableBounds(tablesToMove);

    function move(moveEvent: PointerEvent) {
      const dx = ((moveEvent.clientX - startX) / rect.width) * 100;
      const dy = ((moveEvent.clientY - startY) / rect.height) * 100;
      const clampedDx = clamp(bounds.x + dx, 0, 100 - bounds.width) - bounds.x;
      const clampedDy = clamp(bounds.y + dy, 0, 100 - bounds.height) - bounds.y;
      originals.forEach((original) => {
        updateRoomTable(original.id, {
          x: clamp(original.x + clampedDx, 0, 100 - original.width),
          y: clamp(original.y + clampedDy, 0, 100 - original.height),
        });
      });
    }

    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function createTable() {
    addRoomTable({
      label: `T${visibleTables.length + 1}`,
      area: activeArea,
      seats: 2,
      status: "libero",
      x: 8,
      y: 8,
      width: 13,
      height: 16,
    });
  }

  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Piantina locale</p>
          <h2 className="headline text-3xl">Sale e tavoli</h2>
          <p className="mt-1 max-w-2xl text-sm text-pork-ink/60">
            Trascina i tavoli nella piantina. Seleziona piu tavoli e usa accorpa quando li unisci
            fisicamente in sala.
          </p>
        </div>
        <button
          type="button"
          onClick={createTable}
          className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-4 py-2 text-sm font-bold text-pork-cream hover:bg-pork-red"
        >
          <Plus size={16} />
          Tavolo
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {areas.map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => {
              setActiveArea(area);
              setSelectedIds([]);
            }}
            className={
              "rounded-full px-4 py-2 text-sm font-black transition " +
              (activeArea === area
                ? "bg-pork-red text-white"
                : "bg-pork-cream text-pork-ink/65 hover:text-pork-ink")
            }
          >
            {area}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div
          ref={canvasRef}
          className="relative aspect-[16/9] min-h-[360px] overflow-hidden rounded-3xl border-2 border-dashed border-pork-ink/15 bg-pork-cream"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(20,16,16,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(20,16,16,0.055)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase text-pork-ink/45 ring-1 ring-pork-ink/10">
            {activeArea}
          </div>
          {renderNodes.map((node) => {
            const primary = node.tables[0];
            if (!primary) return null;
            const bounds = tableBounds(node.tables);
            const selected = node.tables.some((table) => selectedIds.includes(table.id));
            const grouped = node.kind === "group";
            const session = getTableSession?.(primary);
            return (
              <button
                key={grouped ? primary.mergeGroupId : primary.id}
                type="button"
                onPointerDown={(event) => {
                  const ids = node.tables.map((table) => table.id);
                  if (event.shiftKey || event.metaKey || event.ctrlKey) {
                    setSelectedIds((prev) =>
                      ids.every((id) => prev.includes(id))
                        ? prev.filter((id) => !ids.includes(id))
                        : Array.from(new Set([...prev, ...ids])),
                    );
                  } else {
                    setSelectedIds(ids);
                  }
                  dragTables(node.tables, event);
                }}
                className={
                  "absolute flex touch-none select-none flex-col items-center justify-center rounded-2xl border-2 p-2 text-center text-xs font-black shadow-sm transition " +
                  statusClass(primary.status) +
                  (selected ? " ring-4 ring-pork-ink/25" : "") +
                  (grouped ? " outline outline-2 outline-offset-2 outline-pork-ink/25" : "")
                }
                style={{
                  left: `${bounds.x}%`,
                  top: `${bounds.y}%`,
                  width: `${bounds.width}%`,
                  height: `${bounds.height}%`,
                }}
                title="Trascina per spostare. Shift/Cmd click per selezione multipla."
              >
                {grouped &&
                  node.tables.map((table) => (
                    <span
                      key={table.id}
                      className="pointer-events-none absolute rounded-xl border border-dashed border-current opacity-45"
                      style={{
                        left: `${((table.x - bounds.x) / bounds.width) * 100}%`,
                        top: `${((table.y - bounds.y) / bounds.height) * 100}%`,
                        width: `${(table.width / bounds.width) * 100}%`,
                        height: `${(table.height / bounds.height) * 100}%`,
                      }}
                    />
                  ))}
                <Move size={13} className="mb-1 opacity-70" />
                <span className="relative max-w-full truncate">
                  {grouped ? mergeLabel(roomTables, primary) : primary.label}
                </span>
                <span className="mt-0.5 flex items-center gap-1 opacity-75">
                  <Users size={11} />
                  {node.tables.reduce((sum, table) => sum + table.seats, 0)}
                </span>
                {session?.active && (
                  <span className="mt-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px]">
                    aperto
                  </span>
                )}
              </button>
            );
          })}

          {selectedTable && (
            <div
              className="absolute z-20 w-[min(92%,23rem)] rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-pork-ink/10"
              style={{
                left: `${clamp((selectedBounds?.x ?? selectedTable.x) + (selectedBounds?.width ?? selectedTable.width) + 2, 2, 66)}%`,
                top: `${clamp(selectedBounds?.y ?? selectedTable.y, 2, 58)}%`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="impact-title text-xs text-pork-red">
                    {selectedIds.length > 1 ? "Tavoli selezionati" : "Tavolo"}
                  </p>
                  <h3 className="font-black text-pork-ink">
                    {selectedIds.length > 1
                      ? `${selectedIds.length} tavoli`
                      : selectedTable.label}
                  </h3>
                  {selectedSession?.active && (
                    <p className="mt-1 text-xs font-bold text-pork-ink/55">
                      {selectedSession.ordersCount} ordini · {selectedSession.total.toFixed(2)} EUR
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="rounded-full bg-pork-cream px-2 py-1 text-xs font-bold text-pork-ink/55"
                >
                  Chiudi
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={selectedSession?.active}
                  onClick={() => selectedTable && onOpenTable?.(selectedTable)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-pork-green px-3 py-2 text-xs font-black text-white disabled:opacity-40"
                >
                  <Users size={14} />
                  Apri
                </button>
                <button
                  type="button"
                  disabled={!selectedSession?.active}
                  onClick={() => selectedTable && onCloseTable?.(selectedTable)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-pork-red px-3 py-2 text-xs font-black text-white disabled:opacity-40"
                >
                  <Receipt size={14} />
                  Chiudi
                </button>
                <button
                  type="button"
                  onClick={() => selectedTable && onShowQR?.(selectedTable)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-pork-ink px-3 py-2 text-xs font-black text-pork-cream"
                >
                  <QrCode size={14} />
                  QR
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length < 2}
                  onClick={() => mergeRoomTables(selectedIds)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-pork-ink/10 px-3 py-2 text-xs font-black text-pork-ink/65 disabled:opacity-35"
                >
                  <Link2 size={14} />
                  Accorpa
                </button>
                <button
                  type="button"
                  disabled={!selectedTable.mergeGroupId}
                  onClick={() => unmergeRoomTable(selectedTable.id)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-pork-ink/10 px-3 py-2 text-xs font-black text-pork-ink/65 disabled:opacity-35"
                >
                  <Unlink size={14} />
                  Separa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(`Eliminare ${selectedTable.label} dalla piantina?`)) return;
                    removeRoomTable(selectedTable.id);
                    setSelectedIds([]);
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-pork-red/30 px-3 py-2 text-xs font-black text-pork-red hover:bg-pork-red hover:text-white"
                >
                  <Trash2 size={14} />
                  Elimina
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label>
                  <span className="mb-1 block text-[10px] font-bold uppercase text-pork-ink/45">
                    Nome
                  </span>
                  <input
                    value={selectedTable.label}
                    onChange={(event) =>
                      updateRoomTable(selectedTable.id, { label: event.target.value })
                    }
                    className="w-full rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-2 py-1.5 text-sm outline-none focus:border-pork-red"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[10px] font-bold uppercase text-pork-ink/45">
                    Coperti
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={selectedTable.seats}
                    onChange={(event) =>
                      updateRoomTable(selectedTable.id, {
                        seats: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                    className="w-full rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-2 py-1.5 text-sm outline-none focus:border-pork-red"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[10px] font-bold uppercase text-pork-ink/45">
                    Stato
                  </span>
                  <select
                    value={selectedTable.status}
                    onChange={(event) =>
                      updateRoomTableStatus(
                        selectedTable.id,
                        event.target.value as RoomTableStatus,
                      )
                    }
                    className="w-full rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-2 py-1.5 text-sm outline-none focus:border-pork-red"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-[10px] font-bold uppercase text-pork-ink/45">
                    Sala
                  </span>
                  <select
                    value={selectedTable.area}
                    onChange={(event) => {
                      const nextArea = event.target.value;
                      const idsToMove = selectedTable.mergeGroupId
                        ? roomTables
                            .filter((table) => table.mergeGroupId === selectedTable.mergeGroupId)
                            .map((table) => table.id)
                        : [selectedTable.id];
                      idsToMove.forEach((id) => updateRoomTable(id, { area: nextArea }));
                    }}
                    className="w-full rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-2 py-1.5 text-sm outline-none focus:border-pork-red"
                  >
                    {areas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
