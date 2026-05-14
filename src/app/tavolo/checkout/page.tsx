"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Send } from "lucide-react";
import { useCartStore, cartTotal } from "@/store/cart-store";
import { useMenuStore, selectItemById } from "@/store/menu-store";
import { formatRemovedForLine } from "@/lib/ingredients";
import { formatEuro } from "@/lib/price-utils";
import {
  COPERTO_DISPLAY_NAME,
  COPERTO_UNIT_PRICE_EUR,
  createCopertoOrderLine,
  dinerAlreadyHasCopertoOrder,
} from "@/lib/coperto";
import { useHydrated } from "@/components/core/providers";
import { LineMods } from "@/components/modules/shop/line-mods";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { MenuaryAuthHintGate } from "@/components/modules/menu/menuary-auth-hint-gate";

function CheckoutTavoloBody() {
  const hydrated = useHydrated();
  const router = useRouter();

  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const context = useCartStore((s) => s.context);
  const addOrder = useMenuStore((s) => s.addOrder);
  const items = useMenuStore((s) => s.items);
  const sessions = useMenuStore((s) => s.sessions);
  const orders = useMenuStore((s) => s.orders);
  const { dinerSeparationAtTables: dinerSeparation } = useEffectiveFeatures();
  const oneBill = !dinerSeparation;

  const sessionStillOpen = context.sessionId
    ? sessions.some(
        (s) => s.id === context.sessionId && s.status === "aperta",
      )
    : true;

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addCopertoThisSubmit = useMemo(() => {
    if (!context.sessionId) return false;
    return !dinerAlreadyHasCopertoOrder(
      orders,
      context.sessionId,
      context.clientId,
      context.nickname,
      { oneBillPerSession: oneBill },
    );
  }, [orders, context.sessionId, context.clientId, context.nickname, oneBill]);

  const foodTotal = cartTotal(lines);
  const copertoExtra = addCopertoThisSubmit ? COPERTO_UNIT_PRICE_EUR : 0;
  const total = foodTotal + copertoExtra;
  const empty = hydrated && lines.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!context.tableId || lines.length === 0 || !sessionStillOpen) return;
    setSubmitting(true);
    const menuLines = lines.map((l) => ({
      itemId: l.itemId,
      categoryId: l.categoryId,
      name: l.name + (l.variantLabel ? ` (${l.variantLabel})` : ""),
      qty: l.qty,
      variantLabel: l.variantLabel,
      unitPrice: l.unitPrice,
      lineTotal: l.unitPrice * l.qty,
      removedIngredients: l.removedIngredients,
      addedExtras: l.addedExtras,
      note: l.note,
      bundlePicks: l.bundlePicks,
    }));
    const withCoperto =
      context.sessionId &&
      !dinerAlreadyHasCopertoOrder(
        orders,
        context.sessionId,
        context.clientId,
        context.nickname,
        { oneBillPerSession: oneBill },
      )
        ? [createCopertoOrderLine(), ...menuLines]
        : menuLines;
    const orderTotal = withCoperto.reduce((a, l) => a + l.lineTotal, 0);
    const created = addOrder({
      type: "tavolo",
      tableLabel: context.tableLabel,
      sessionId: context.sessionId,
      sessionCode: context.sessionCode,
      dinerClientId: dinerSeparation ? context.clientId : undefined,
      dinerNickname: dinerSeparation ? context.nickname : undefined,
      notes: notes.trim() || undefined,
      lines: withCoperto,
      total: orderTotal,
    });
    clear();
    router.replace(`/ordina/conferma?id=${created.id}`);
  }

  if (!hydrated) return null;

  if (!context.tableId) {
    return (
      <div className="container-wide py-32 text-center">
        <p className="impact-title text-pork-red">Nessun tavolo attivo.</p>
        <p className="mt-2 text-pork-ink/60">
          Apri la pagina del tavolo scansionando il QR code o inserendo il codice.
        </p>
        <Link href="/tavolo" className="btn-primary mt-6 inline-flex">
          Entra al tavolo
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="relative bg-pork-ink pt-32 pb-10 text-pork-cream md:pt-40">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip-mustard">
              {context.tableLabel ?? "Tavolo"}
            </span>
            {context.sessionCode && (
              <span className="chip bg-pork-cream/10 text-pork-cream/70">
                Codice {context.sessionCode}
              </span>
            )}
            {context.nickname && (
              <span className="chip bg-pork-red text-white">
                {context.nickname}
              </span>
            )}
          </div>
          <h1 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl">
            Invia in <span className="text-pork-mustard">cucina.</span>
          </h1>
        </div>
      </section>

      <div className="bg-pork-cream pb-32 pt-10">
        <div className="container-wide">
          {!sessionStillOpen ? (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-pork-ink/5">
              <p className="impact-title text-2xl text-pork-red">
                Conto chiuso.
              </p>
              <p className="mt-2 text-pork-ink/60">
                Per un nuovo ordine scansiona di nuovo il QR o chiedi al bancone.
              </p>
              <button
                type="button"
                onClick={() => {
                  clear();
                }}
                className="btn-primary mt-6 inline-flex"
              >
                Ok, svuota carrello
              </button>
            </div>
          ) : empty ? (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-pork-ink/5">
              <p className="impact-title text-2xl">Il carrello è vuoto.</p>
              <Link
                href={`/tavolo?t=${context.tableId}`}
                className="btn-primary mt-6 inline-flex"
              >
                Torna al menu
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/5 sm:p-8"
              >
                <h2 className="headline text-3xl">Note per la cucina</h2>
                <p className="mt-2 text-sm text-pork-ink/60">
                  Allergie, tempi di cottura o altre richieste.
                </p>

                <label className="mt-5 block">
                  <span className="mb-1.5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-pork-ink/60">
                    <StickyNote size={16} />
                    Note (opzionale)
                  </span>
                  <div className="rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-4 py-3 transition-colors focus-within:border-pork-red">
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Es. senza cipolla, ben cotta, due piatti separati…"
                      className="w-full resize-none bg-transparent outline-none"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting || lines.length === 0}
                  className="btn-primary mt-8 w-full text-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={20} />
                  Invia in cucina ({formatEuro(total)})
                </button>
                <p className="mt-2 text-center text-[11px] text-pork-ink/50">
                  Paghi al bancone a fine serata, sul conto unico del tavolo.
                </p>
              </form>

              <aside className="rounded-3xl bg-pork-ink p-6 text-pork-cream ring-1 ring-pork-ink sm:p-8 lg:sticky lg:top-28 lg:self-start">
                <h3 className="headline text-2xl text-pork-mustard">
                  {context.tableLabel ?? "Tavolo"}
                </h3>
                {context.nickname && (
                  <p className="text-sm text-pork-cream/70">
                    Ordine di {context.nickname}
                  </p>
                )}
                <ul className="mt-4 space-y-3">
                  {addCopertoThisSubmit && (
                    <li className="flex items-start justify-between gap-3 border-b border-pork-cream/10 pb-3">
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">
                          1 × {COPERTO_DISPLAY_NAME}
                        </p>
                      </div>
                      <span className="shrink-0 font-impact text-lg">
                        {formatEuro(COPERTO_UNIT_PRICE_EUR)}
                      </span>
                    </li>
                  )}
                  {lines.map((l) => (
                    <li
                      key={l.lineId}
                      className="flex items-start justify-between gap-3 border-b border-pork-cream/10 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">
                          {l.qty} × {l.name}
                        </p>
                        {l.variantLabel && (
                          <p className="text-xs text-pork-mustard">
                            {l.variantLabel}
                          </p>
                        )}
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
                          tone="light"
                        />
                      </div>
                      <span className="shrink-0 font-impact text-lg">
                        {formatEuro(l.unitPrice * l.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-baseline justify-between border-t border-pork-cream/20 pt-4">
                  <span className="impact-title text-sm text-pork-cream/70">
                    Il tuo totale
                  </span>
                  <span className="headline text-3xl text-pork-mustard">
                    {formatEuro(total)}
                  </span>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <>
      <MenuaryAuthHintGate />
      <Suspense fallback={null}>
        <CheckoutTavoloBody />
      </Suspense>
    </>
  );
}
