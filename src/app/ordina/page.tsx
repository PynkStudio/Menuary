"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, StickyNote, Package } from "lucide-react";
import { useCartStore, cartTotal } from "@/store/cart-store";
import { useMenuStore, selectItemById } from "@/store/menu-store";
import { formatRemovedForLine } from "@/lib/ingredients";
import { formatEuro } from "@/lib/price-utils";
import { useHydrated } from "@/components/core/providers";
import { LineMods } from "@/components/modules/shop/line-mods";
import { useEffectiveFeatures } from "@/lib/use-effective-features";

function nextSlots(count = 8, stepMin = 15): string[] {
  const out: string[] = [];
  const now = new Date();
  now.setMinutes(now.getMinutes() + 20);
  now.setSeconds(0);
  now.setMilliseconds(0);
  const m = now.getMinutes();
  const roundedUp = Math.ceil(m / stepMin) * stepMin;
  now.setMinutes(roundedUp);
  for (let i = 0; i < count; i++) {
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    out.push(`${hh}:${mm}`);
    now.setMinutes(now.getMinutes() + stepMin);
  }
  return out;
}

export default function OrdinaPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { allowTakeaway: takeawayOk } = useEffectiveFeatures();

  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const setContext = useCartStore((s) => s.setContext);
  const addOrder = useMenuStore((s) => s.addOrder);
  const items = useMenuStore((s) => s.items);

  const [name, setName] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slots] = useState(() => nextSlots());

  useEffect(() => {
    const c = useCartStore.getState().context;
    if (
      c.type === "asporto" &&
      c.sessionId == null &&
      c.tableId == null &&
      c.table == null &&
      c.clientId == null &&
      c.sessionCode == null &&
      (c.nickname == null || c.nickname === "")
    ) {
      return;
    }
    setContext({ type: "asporto" });
  }, [setContext]);

  const total = cartTotal(lines);
  const empty = hydrated && lines.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!takeawayOk || !name.trim() || !pickupTime || lines.length === 0) return;
    setSubmitting(true);
    const created = addOrder({
      type: "asporto",
      customerName: name.trim(),
      pickupTime,
      notes: notes.trim() || undefined,
      lines: lines.map((l) => ({
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
      })),
      total,
    });
    clear();
    router.replace(`/ordina/conferma?id=${created.id}`);
  }

  if (hydrated && !takeawayOk) {
    return (
      <div className="container-wide py-32 text-center">
        <p className="impact-title text-pork-red">Percorso non attivo</p>
        <h1 className="headline mt-2 text-4xl">Torna al menu</h1>
        <p className="mx-auto mt-3 max-w-md text-pork-ink/65">
          Da qui non si completa un ordine digitale. Il menu resta disponibile in
          home.
        </p>
        <Link href="/menu" className="btn-primary mt-8 inline-flex">
          Vai al menu
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="relative bg-pork-ink pt-32 pb-10 text-pork-cream md:pt-40">
        <div className="container-wide">
          <span className="chip-mustard">Asporto</span>
          <h1 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
            Scegli l&apos;orario, <br />
            <span className="text-pork-mustard">noi accendiamo i fuochi.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pork-cream/70">
            Ordina qui, ritira al bancone. Nessun pagamento online: paghi quando
            vieni a prendere.
          </p>
        </div>
      </section>

      <div className="bg-pork-cream pb-32 pt-10">
        <div className="container-wide">
          {empty ? (
            <EmptyCart />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/5 sm:p-8"
              >
                <h2 className="headline text-3xl">I tuoi dati</h2>

                <div className="mt-6 space-y-5">
                  <Field label="Nome" icon={<User size={16} />}>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Come ti chiamiamo al bancone"
                      className="w-full bg-transparent outline-none"
                    />
                  </Field>

                  <Field label="Orario di ritiro" icon={<Clock size={16} />}>
                    <select
                      required
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-transparent outline-none"
                    >
                      <option value="">Scegli un orario…</option>
                      {slots.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Note (opzionale)" icon={<StickyNote size={16} />}>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Allergie, preferenze, richieste particolari…"
                      className="w-full resize-none bg-transparent outline-none"
                    />
                  </Field>
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting || !name.trim() || !pickupTime || lines.length === 0
                  }
                  className="btn-primary mt-8 w-full text-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Package size={20} />
                  Invia ordine ({formatEuro(total)})
                </button>
                <p className="mt-2 text-center text-[11px] text-pork-ink/50">
                  L’ordine arriva in cucina; il pagamento avviene al ritiro al bancone, salvo
                  diverse indicazioni del locale.
                </p>
              </form>

              <aside className="rounded-3xl bg-pork-ink p-6 text-pork-cream ring-1 ring-pork-ink sm:p-8 lg:sticky lg:top-28 lg:self-start">
                <h3 className="headline text-2xl text-pork-mustard">Riepilogo</h3>
                <ul className="mt-4 space-y-3">
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
                    Totale
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

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-pork-ink/60">
        {icon}
        {label}
      </span>
      <div className="rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-4 py-3 transition-colors focus-within:border-pork-red">
        {children}
      </div>
    </label>
  );
}

function EmptyCart() {
  return (
    <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-pork-ink/5">
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-pork-cream text-3xl">
        🛒
      </div>
      <p className="impact-title text-2xl">Il tuo carrello è vuoto.</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-pork-ink/60">
        Prima si ordina, poi si paga. Scegli qualcosa dal menu.
      </p>
      <Link href="/menu" className="btn-primary mt-6 inline-flex">
        Vai al menu
      </Link>
    </div>
  );
}
