"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, CheckCircle2, Clock, Utensils } from "lucide-react";
import { useMenuStore } from "@/store/menu-store";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useTenant } from "@/components/core/tenant-provider";
import { useHydrated } from "@/components/core/providers";
import type { Order, OrderStatus } from "@/lib/types";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  elapsedMinutes,
  formatTime,
} from "@/lib/orders-ui";
import { cn } from "@/lib/utils";
import { COPERTO_ITEM_ID } from "@/lib/coperto";
import {
  advanceKitchenGroup,
  groupKitchenOrderLines,
  kitchenGroupsForColumn,
} from "@/lib/kitchen-merge";
import { selectItemById } from "@/store/menu-store";
import { formatRemovedForLine } from "@/lib/ingredients";

const COLUMNS: Array<{ key: OrderStatus; title: string; accent: string }> = [
  { key: "nuovo", title: "Nuovi", accent: "bg-pork-red text-white" },
  {
    key: "in_preparazione",
    title: "In preparazione",
    accent: "bg-pork-mustard text-pork-ink",
  },
  { key: "pronto", title: "Pronti", accent: "bg-pork-green text-white" },
];

export default function KitchenDisplay() {
  const tenant = useTenant();
  const hydrated = useHydrated();
  const orders = useMenuStore((s) => s.orders);
  const updateStatus = useMenuStore((s) => s.updateOrderStatus);
  const {
    kitchenDisplayEnabled: kitchenOn,
    dinerSeparationAtTables: dinerSeparation,
  } = useEffectiveFeatures();

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const grouped = useMemo(() => {
    const g: Record<OrderStatus, Order[]> = {
      nuovo: [],
      in_preparazione: [],
      pronto: [],
      consegnato: [],
      annullato: [],
    };
    orders.forEach((o) => g[o.status].push(o));
    return g;
  }, [orders]);

  const columnGroups = useMemo(() => {
    const out: Record<OrderStatus, Array<{ ids: string[]; display: Order }>> = {
      nuovo: [],
      in_preparazione: [],
      pronto: [],
      consegnato: [],
      annullato: [],
    };
    for (const col of COLUMNS) {
      out[col.key] = kitchenGroupsForColumn(
        grouped[col.key],
        dinerSeparation,
      );
    }
    return out;
  }, [grouped, dinerSeparation]);

  const activeCount = useMemo(() => {
    let n = 0;
    (["nuovo", "in_preparazione"] as const).forEach((st) => {
      n += columnGroups[st].length;
    });
    return n;
  }, [columnGroups]);

  if (!kitchenOn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-pork-ink px-6 text-center text-pork-cream">
        <Flame size={40} className="text-pork-mustard" />
        <h1 className="headline mt-4 text-4xl">Schermo cucina non attivo</h1>
        <p className="mt-3 max-w-md text-pork-cream/70">
          Riattiva il modulo dalla gestione, sezione Impostazioni, per mostrare di nuovo la coda
          ordini qui.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pork-ink text-pork-cream">
      <header className="flex items-center justify-between border-b border-pork-cream/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pork-mustard text-pork-ink">
            <Flame size={20} />
          </div>
          <div>
            <p className="impact-title text-xs text-pork-mustard">
              {tenant.name} · cucina
            </p>
            <h1 className="headline text-2xl">Schermo cucina</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="impact-title text-xs text-pork-cream/50">
            Ordini in lavorazione
          </p>
          <p className="headline text-4xl text-pork-mustard">{activeCount}</p>
        </div>
      </header>

      {hydrated && (
        <main className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <section
              key={col.key}
              className="flex max-h-[calc(100vh-120px)] flex-col rounded-3xl bg-pork-brick/40 ring-1 ring-pork-cream/10"
            >
              <header className="flex items-center justify-between gap-3 border-b border-pork-cream/10 px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wide",
                    col.accent,
                  )}
                >
                  {col.title}
                </span>
                <span className="impact-title text-pork-cream/70">
                  {columnGroups[col.key].length}
                </span>
              </header>
              <div className="flex-1 overflow-y-auto p-3">
                {columnGroups[col.key].length === 0 ? (
                  <p className="py-8 text-center text-sm text-pork-cream/40">
                    Tutto calmo.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {columnGroups[col.key].map((g) => (
                      <KitchenCard
                        key={g.ids.join("-")}
                        order={g.display}
                        onAdvance={(next) =>
                          advanceKitchenGroup(g.ids, next, updateStatus)
                        }
                      />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </main>
      )}
    </div>
  );
}

function KitchenCard({
  order,
  onAdvance,
}: {
  order: Order;
  onAdvance: (s: OrderStatus) => void;
}) {
  const categories = useMenuStore((s) => s.categories);
  const items = useMenuStore((s) => s.items);
  const lineSections = useMemo(
    () =>
      groupKitchenOrderLines(
        order.lines.filter((l) => l.itemId !== COPERTO_ITEM_ID),
        categories,
        items,
      ),
    [order.lines, categories, items],
  );

  const minutes = elapsedMinutes(order.createdAt);
  const hot = minutes >= 15;

  return (
    <li
      className={cn(
        "rounded-2xl bg-pork-cream p-4 text-pork-ink shadow-lg transition-transform",
        hot && order.status !== "pronto" && "ring-4 ring-pork-red",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="impact-title text-pork-red">{order.code}</span>
            <span
              className={
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide " +
                STATUS_COLOR[order.status]
              }
            >
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <p className="headline text-xl leading-tight">
            {order.type === "tavolo"
              ? order.tableLabel ?? `Tavolo ${order.table ?? ""}`
              : order.customerName ?? "Asporto"}
          </p>
          {order.type === "tavolo" &&
            order.sessionCode &&
            order.dinerNickname && (
              <p className="text-[11px] text-pork-ink/60">
                <span>cod. {order.sessionCode}</span>
                <span> · {order.dinerNickname}</span>
              </p>
            )}
          {order.type === "tavolo" && order.sessionCode && !order.dinerNickname && (
            <p className="text-[11px] text-pork-ink/60">cod. {order.sessionCode}</p>
          )}
        </div>
        <div className="text-right">
          <p className="inline-flex items-center gap-1 text-xs text-pork-ink/60">
            <Clock size={12} /> {formatTime(order.createdAt)}
          </p>
          <p
            className={cn(
              "font-impact text-2xl",
              hot ? "text-pork-red" : "text-pork-ink/60",
            )}
          >
            {minutes}′
          </p>
        </div>
      </div>

      {order.type === "asporto" && order.pickupTime && (
        <p className="mt-1 text-xs text-pork-ink/60">
          Ritiro alle {order.pickupTime}
        </p>
      )}

      <ul className="mt-3 space-y-4 text-sm">
        {lineSections.map((sec) => (
          <li key={sec.title} className="list-none">
            <p className="text-[11px] font-black uppercase tracking-widest text-pork-ink/45">
              {sec.title}
            </p>
            <ul className="mt-1.5 space-y-2">
              {sec.lines.map((l, i) => (
                <li
                  key={`${sec.title}-${i}-${l.name}`}
                  className="rounded-lg bg-pork-cream/60 px-2 py-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 text-base">
                      <span className="font-bold">{l.qty}×</span> {l.name}
                    </span>
                  </div>
                  {l.removedIngredients && l.removedIngredients.length > 0 && (
                    <p className="mt-0.5 text-[13px] font-bold uppercase tracking-wide text-pork-red">
                      – senza{" "}
                      {formatRemovedForLine(
                        l.itemId,
                        selectItemById(items, l.itemId)?.ingredients,
                        l.removedIngredients,
                      )}
                    </p>
                  )}
                  {l.addedExtras && l.addedExtras.length > 0 && (
                    <ul className="text-[13px] font-bold uppercase tracking-wide text-pork-green">
                      {l.addedExtras.map((x) => (
                        <li key={x.id}>+ {x.name}</li>
                      ))}
                    </ul>
                  )}
                  {l.note && (
                    <p className="mt-0.5 text-[12px] italic text-pork-ink/70">
                      &ldquo;{l.note}&rdquo;
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mt-2 rounded-lg bg-pork-mustard/30 px-2 py-1 text-xs italic text-pork-ink/80">
          Note: {order.notes}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {order.status === "nuovo" && (
          <button
            onClick={() => onAdvance("in_preparazione")}
            className="flex-1 rounded-full bg-pork-mustard py-2 text-sm font-bold text-pork-ink hover:bg-pork-mustard-soft"
          >
            <Utensils size={14} className="mr-1 inline" />
            Prendi in carico
          </button>
        )}
        {order.status === "in_preparazione" && (
          <button
            onClick={() => onAdvance("pronto")}
            className="flex-1 rounded-full bg-pork-green py-2 text-sm font-bold text-white hover:opacity-90"
          >
            <CheckCircle2 size={14} className="mr-1 inline" />
            Pronto
          </button>
        )}
        {order.status === "pronto" && (
          <button
            onClick={() => onAdvance("consegnato")}
            className="flex-1 rounded-full bg-pork-ink py-2 text-sm font-bold text-pork-cream hover:bg-pork-red"
          >
            Consegnato
          </button>
        )}
      </div>
    </li>
  );
}
