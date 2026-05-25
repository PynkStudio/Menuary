"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, StickyNote, Package, Mail, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useCartStore, cartTotal } from "@/store/cart-store";
import { useMenuStore, selectItemById } from "@/store/menu-store";
import { formatRemovedForLine } from "@/lib/ingredients";
import { formatEuro } from "@/lib/price-utils";
import { useHydrated } from "@/components/core/providers";
import { LineMods } from "@/components/modules/shop/line-mods";
import { MenuaryAuthHintGate } from "@/components/modules/menu/menuary-auth-hint-gate";
import { useTenant } from "@/components/core/tenant-provider";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import type { OrderDineOption } from "@/lib/types";

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
  const tenant = useTenant();
  const { allowTakeaway: takeawayOk, allowTableOrders } = useEffectiveFeatures();

  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const setContext = useCartStore((s) => s.setContext);
  const addOrder = useMenuStore((s) => s.addOrder);
  const items = useMenuStore((s) => s.items);

  // Se il locale NON usa tavoli numerati, esponiamo la scelta dine_in/takeaway
  // qui (vassoio vs sacchetto). Default takeaway.
  const showDineOption = !allowTableOrders;
  const [dineOption, setDineOption] = useState<OrderDineOption>("takeaway");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

    // Mirror locale (UX/demo) — utile a /ordina/conferma quando l'API è offline.
    const local = addOrder({
      type: "asporto",
      customerName: name.trim(),
      customerEmail: email.trim() || undefined,
      pickupTime,
      notes: notes.trim() || undefined,
      dineOption: showDineOption ? dineOption : undefined,
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

    // Persistenza server-side: decide auto-accept / pending in base alle settings.
    let serverId: string | null = null;
    let autoAccepted = false;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          type: "asporto",
          customerName: name.trim(),
          customerEmail: email.trim() || undefined,
          pickupTime,
          notes: notes.trim() || undefined,
          dineOption: showDineOption ? dineOption : undefined,
          lines,
          total,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        serverId = data.id ?? null;
        autoAccepted = Boolean(data.autoAccepted);
      }
    } catch {
      // fallback al local id
    }

    void fetch("/api/personalization/establish", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: tenant.id,
        source: "order",
        orderId: serverId,
      }),
    }).catch(() => {});

    clear();
    const id = serverId ?? local.id;
    router.replace(autoAccepted ? `/ordina/conferma?id=${id}` : `/ordina/attesa/${id}`);
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
      <MenuaryAuthHintGate />
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
                  {showDineOption && (
                    <DineOptionToggle value={dineOption} onChange={setDineOption} />
                  )}

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

                  <Field label="Email (per conferma)" icon={<Mail size={16} />}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="opzionale — ti scriviamo a conferma"
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

function DineOptionToggle({
  value,
  onChange,
}: {
  value: OrderDineOption;
  onChange: (v: OrderDineOption) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-pork-ink/60">
        Dove lo consumi?
      </span>
      <div className="grid grid-cols-2 gap-2">
        <DineOptionButton
          active={value === "dine_in"}
          onClick={() => onChange("dine_in")}
          icon={<UtensilsCrossed size={18} />}
          label="Mangia qui"
          hint="su vassoio"
        />
        <DineOptionButton
          active={value === "takeaway"}
          onClick={() => onChange("takeaway")}
          icon={<ShoppingBag size={18} />}
          label="Asporto"
          hint="nel sacchetto"
        />
      </div>
    </div>
  );
}

function DineOptionButton({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 transition-colors " +
        (active
          ? "border-pork-red bg-pork-red text-pork-cream"
          : "border-pork-ink/10 bg-pork-cream text-pork-ink hover:border-pork-red/40")
      }
      aria-pressed={active}
    >
      {icon}
      <span className="text-sm font-bold leading-none">{label}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-70">{hint}</span>
    </button>
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
