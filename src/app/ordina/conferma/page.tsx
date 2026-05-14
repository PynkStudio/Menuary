"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Package } from "lucide-react";
import { useMenuStore, selectItemById } from "@/store/menu-store";
import { formatRemovedForLine } from "@/lib/ingredients";
import { formatEuro } from "@/lib/price-utils";
import { useHydrated } from "@/components/core/providers";
import { LineMods } from "@/components/modules/shop/line-mods";

function ConfermaContent() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const id = params.get("id");
  const orders = useMenuStore((s) => s.orders);
  const items = useMenuStore((s) => s.items);
  const order = hydrated ? orders.find((o) => o.id === id) : undefined;

  if (!hydrated) return null;

  if (!order) {
    return (
      <div className="container-wide py-32 text-center">
        <p className="impact-title text-pork-red">Ordine non trovato.</p>
        <Link href="/menu" className="btn-primary mt-6 inline-flex">
          Torna al menu
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="relative bg-pork-ink pt-32 pb-12 text-pork-cream md:pt-40 md:pb-16">
        <div className="container-wide text-center">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-pork-mustard text-pork-ink">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="headline mt-6 text-5xl sm:text-6xl lg:text-7xl">
            Ordine ricevuto!
          </h1>
          <p className="mt-4 text-lg text-pork-cream/70">
            Codice{" "}
            <span className="font-impact text-2xl text-pork-mustard">
              {order.code}
            </span>
          </p>
        </div>
      </section>

      <div className="bg-pork-cream pb-32 pt-10">
        <div className="container-wide max-w-2xl">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/5 sm:p-8">
            <div className="mb-5 grid grid-cols-2 gap-4 text-sm">
              {order.type === "asporto" ? (
                <>
                  <Info label="Nome" value={order.customerName ?? "—"} />
                  <Info
                    label="Ritiro"
                    value={order.pickupTime ?? "—"}
                    icon={<Clock size={14} />}
                  />
                </>
              ) : (
                <Info
                  label="Tavolo"
                  value={order.tableLabel ?? (order.table != null ? `N. ${order.table}` : "—")}
                />
              )}
              <Info
                label="Servizio"
                value={order.type === "asporto" ? "Asporto" : "In sala"}
                icon={<Package size={14} />}
              />
              <Info label="Stato ordine" value="In preparazione" tone="red" />
            </div>

            {order.notes && (
              <div className="mb-5 rounded-xl bg-pork-cream p-3 text-sm italic text-pork-ink/70">
                &ldquo;{order.notes}&rdquo;
              </div>
            )}

            <ul className="divide-y divide-pork-ink/10">
              {order.lines.map((l, i) => (
                <li key={i} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">
                      {l.qty} × {l.name}
                    </p>
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
                    />
                  </div>
                  <span className="font-impact text-lg text-pork-red">
                    {formatEuro(l.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-baseline justify-between border-t-2 border-pork-ink/10 pt-4">
              <span className="impact-title text-sm text-pork-ink/60">Totale</span>
              <span className="headline text-3xl text-pork-red">
                {formatEuro(order.total)}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/menu" className="btn-ghost">
              Ordina altro
            </Link>
            <Link href="/" className="btn-primary">
              Torna alla home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function Info({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "red";
}) {
  return (
    <div>
      <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-pork-ink/50">
        {icon}
        {label}
      </p>
      <p
        className={
          "impact-title text-lg " +
          (tone === "red" ? "text-pork-red" : "text-pork-ink")
        }
      >
        {value}
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConfermaContent />
    </Suspense>
  );
}
