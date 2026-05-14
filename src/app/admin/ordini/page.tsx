"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Trash2, XCircle } from "lucide-react";
import { useMenuStore, selectItemById } from "@/store/menu-store";
import { formatRemovedForLine } from "@/lib/ingredients";
import { useHydrated } from "@/components/core/providers";
import type { OrderStatus } from "@/lib/types";
import {
  STATUS_COLOR,
  STATUS_FLOW,
  STATUS_LABEL,
  elapsedMinutes,
  formatTime,
} from "@/lib/orders-ui";
import { formatEuro } from "@/lib/price-utils";
import { LineMods } from "@/components/modules/shop/line-mods";
import { useSettingsStore } from "@/store/settings-store";

const FILTERS: Array<{ value: "open" | "all" | OrderStatus; label: string }> = [
  { value: "open", label: "Aperti" },
  { value: "all", label: "Tutti" },
  { value: "nuovo", label: "Nuovi" },
  { value: "in_preparazione", label: "In preparazione" },
  { value: "pronto", label: "Pronti" },
  { value: "consegnato", label: "Consegnati" },
  { value: "annullato", label: "Annullati" },
];

export default function AdminOrdersPage() {
  const hydrated = useHydrated();
  const dinerSeparation = useSettingsStore((s) => s.dinerSeparationAtTables);
  const orders = useMenuStore((s) => s.orders);
  const items = useMenuStore((s) => s.items);
  const updateStatus = useMenuStore((s) => s.updateOrderStatus);
  const removeOrder = useMenuStore((s) => s.removeOrder);
  const clearDone = useMenuStore((s) => s.clearCompletedOrders);

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("open");

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "open")
      return orders.filter(
        (o) => o.status === "nuovo" || o.status === "in_preparazione" || o.status === "pronto",
      );
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="headline text-4xl">Ordini</h1>
          <p className="text-pork-ink/60">
            Tutti gli ordini ricevuti dal sito e dai tavoli.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("Cancellare gli ordini consegnati/annullati?")) clearDone();
          }}
          className="inline-flex items-center gap-2 rounded-full bg-pork-ink/5 px-4 py-2 text-sm font-semibold hover:bg-pork-ink/10"
        >
          <Trash2 size={14} /> Pulisci chiusi
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide " +
              (filter === f.value
                ? "bg-pork-ink text-pork-cream"
                : "bg-white text-pork-ink/60 ring-1 ring-pork-ink/10 hover:bg-pork-ink/5")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {hydrated && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-pork-ink/5">
              <p className="impact-title text-xl text-pork-ink/50">
                Nessun ordine in questa vista.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {filtered.map((o) => {
                const next = STATUS_FLOW[o.status];
                const minutes = elapsedMinutes(o.createdAt);
                return (
                  <li
                    key={o.id}
                    className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="impact-title text-sm text-pork-red">
                            {o.code}
                          </span>
                          <span
                            className={
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide " +
                              STATUS_COLOR[o.status]
                            }
                          >
                            {STATUS_LABEL[o.status]}
                          </span>
                          <span className="text-xs text-pork-ink/50">
                            {formatTime(o.createdAt)} · {minutes}′ fa
                          </span>
                        </div>
                        <p className="headline mt-1 text-2xl">
                          {o.type === "tavolo"
                            ? o.tableLabel ?? `Tavolo ${o.table ?? ""}`
                            : o.customerName ?? "Asporto"}
                        </p>
                        <p className="text-xs text-pork-ink/60">
                          {o.type === "tavolo" ? (
                            <>
                              Al tavolo
                              {o.sessionCode && (
                                <span> · cod. {o.sessionCode}</span>
                              )}
                              {dinerSeparation && o.dinerNickname && (
                                <span> · {o.dinerNickname}</span>
                              )}
                            </>
                          ) : (
                            `Asporto · ritiro ${o.pickupTime ?? "—"}`
                          )}
                        </p>
                      </div>
                      <span className="font-impact text-2xl text-pork-red">
                        {formatEuro(o.total)}
                      </span>
                    </div>

                    <ul className="mt-3 space-y-2 text-sm">
                      {o.lines.map((l, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <div className="min-w-0 flex-1 text-pork-ink/80">
                            <span>
                              {l.qty} × {l.name}
                            </span>
                            <LineMods
                              removed={l.removedIngredients}
                              removedDisplay={formatRemovedForLine(
                                l.itemId,
                                selectItemById(items, l.itemId)?.ingredients,
                                l.removedIngredients,
                              )}
                              extras={l.addedExtras}
                              note={l.note}
                              bundlePicks={l.bundlePicks}
                              withPrices
                            />
                          </div>
                          <span className="tabular-nums text-pork-ink/60">
                            {formatEuro(l.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {o.notes && (
                      <p className="mt-3 rounded-xl bg-pork-cream p-2 text-xs italic text-pork-ink/70">
                        Note: {o.notes}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {next && (
                        <button
                          onClick={() => updateStatus(o.id, next)}
                          className="btn-primary text-xs"
                        >
                          <ArrowRight size={14} />
                          {STATUS_LABEL[next]}
                        </button>
                      )}
                      {o.status !== "annullato" && o.status !== "consegnato" && (
                        <button
                          onClick={() => {
                            if (confirm(`Annullare ordine ${o.code}?`))
                              updateStatus(o.id, "annullato");
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1.5 text-xs font-bold hover:bg-pork-red hover:text-white"
                        >
                          <XCircle size={14} /> Annulla
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Eliminare questo ordine?")) removeOrder(o.id);
                        }}
                        className="ml-auto text-xs text-pork-ink/40 hover:text-pork-red"
                      >
                        Elimina
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
