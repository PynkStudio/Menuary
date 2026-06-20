"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Clock, User, StickyNote, Package, Mail, ShoppingBag, UtensilsCrossed,
  Bike, MapPin, Phone, DoorOpen, Building2, Send,
} from "lucide-react";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const {
    allowTakeaway: takeawayOk,
    allowTableOrders,
    dinerSeparationAtTables: dinerSeparation,
  } = useEffectiveFeatures();

  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const setContext = useCartStore((s) => s.setContext);
  const context = useCartStore((s) => s.context);
  const addOrder = useMenuStore((s) => s.addOrder);
  const items = useMenuStore((s) => s.items);
  const sessions = useMenuStore((s) => s.sessions);
  const orders = useMenuStore((s) => s.orders);

  const isTavolo = context.type === "tavolo";
  const oneBill = !dinerSeparation;

  const showDineOption = !isTavolo && !allowTableOrders;
  const [dineOption, setDineOption] = useState<OrderDineOption>("takeaway");
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDoorbell, setDeliveryDoorbell] = useState("");
  const [deliveryFloor, setDeliveryFloor] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slots] = useState(() => nextSlots());

  const sessionStillOpen = isTavolo && context.sessionId
    ? sessions.some((s) => s.id === context.sessionId && s.status === "aperta")
    : true;

  const addCopertoThisSubmit = useMemo(() => {
    if (!isTavolo || !context.sessionId) return false;
    return !dinerAlreadyHasCopertoOrder(
      orders,
      context.sessionId,
      context.clientId,
      context.nickname,
      { oneBillPerSession: oneBill },
    );
  }, [isTavolo, orders, context.sessionId, context.clientId, context.nickname, oneBill]);

  useEffect(() => {
    if (isTavolo) return;
    if (!deliveryEnabled) {
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch(`/api/orders/public-settings?tenantId=${tenant.id}`, {
            cache: "no-store",
          });
          if (!res.ok || cancelled) return;
          const data = await res.json();
          if (!cancelled) setDeliveryEnabled(Boolean(data.deliveryEnabled));
        } catch { /* niente delivery in UI è il default sicuro */ }
      })();
      return () => { cancelled = true; };
    }
  }, [tenant.id, isTavolo, deliveryEnabled]);

  useEffect(() => {
    if (isTavolo) return;
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
  }, [isTavolo, setContext]);

  const foodTotal = cartTotal(lines);
  const copertoExtra = addCopertoThisSubmit ? COPERTO_UNIT_PRICE_EUR : 0;
  const total = foodTotal + copertoExtra;
  const empty = hydrated && lines.length === 0;

  const previewPrefix =
    tenant.previewSlug && pathname?.startsWith(`/${tenant.previewSlug}`)
      ? `/${tenant.previewSlug}`
      : "";

  const backParam = searchParams.get("back");
  const checkoutBack = (() => {
    if (!backParam) return null;
    try {
      const parsed = new URL(backParam, "https://menuary.local");
      const match = parsed.pathname.match(/^\/checkout\/([^/]+)$/);
      const token = parsed.searchParams.get("t");
      if (!match?.[1] || !token) return null;
      return { href: `${parsed.pathname}${parsed.search}`, code: decodeURIComponent(match[1]), token };
    } catch {
      return null;
    }
  })();

  // ── Submit asporto / delivery ──────────────────────────────────────────────
  async function handleAsportoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!takeawayOk || !name.trim() || !phone.trim() || !pickupTime || lines.length === 0) return;
    const isDelivery = showDineOption && dineOption === "delivery";
    if (isDelivery && !deliveryAddress.trim()) return;
    setSubmitting(true);

    if (checkoutBack) {
      try {
        const res = await fetch(`/api/checkout/${encodeURIComponent(checkoutBack.code)}/append`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId: tenant.id, token: checkoutBack.token, lines }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "upsell_failed");
        }
        clear();
        router.replace(checkoutBack.href);
      } catch {
        setSubmitting(false);
      }
      return;
    }

    const local = addOrder({
      type: "asporto",
      customerName: name.trim(),
      customerEmail: email.trim() || undefined,
      pickupTime,
      notes: notes.trim() || undefined,
      dineOption: showDineOption ? dineOption : undefined,
      ...(isDelivery && { deliveryAddress: deliveryAddress.trim() }),
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
      total: foodTotal,
    });

    let serverId: string | null = null;
    let serverCode: string | null = null;
    let publicToken: string | null = null;
    let autoAccepted = false;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          type: "asporto",
          customerName: name.trim(),
          customerPhone: phone.trim() || undefined,
          customerEmail: email.trim() || undefined,
          pickupTime,
          notes: notes.trim() || undefined,
          dineOption: showDineOption ? dineOption : undefined,
          ...(isDelivery && {
            deliveryAddress: deliveryAddress.trim(),
            deliveryDoorbell: deliveryDoorbell.trim() || undefined,
            deliveryFloor: deliveryFloor.trim() || undefined,
            deliveryNotes: deliveryNotes.trim() || undefined,
          }),
          lines,
          total: foodTotal,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        serverId = data.id ?? null;
        serverCode = typeof data.code === "string" ? data.code : null;
        publicToken = typeof data.publicToken === "string" ? data.publicToken : null;
        autoAccepted = Boolean(data.autoAccepted);
      }
    } catch { /* fallback al local id */ }

    void fetch("/api/personalization/establish", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: tenant.id, source: "order", orderId: serverId }),
    }).catch(() => {});

    clear();
    if (serverCode && publicToken) {
      router.replace(
        `${previewPrefix}/checkout/${encodeURIComponent(serverCode)}?t=${encodeURIComponent(publicToken)}`,
      );
      return;
    }

    const id = serverId ?? local.id;
    router.replace(autoAccepted ? `${previewPrefix}/ordina/conferma?id=${id}` : `${previewPrefix}/ordina/attesa/${id}`);
  }

  // ── Submit tavolo (invio in cucina, niente checkout immediato) ──────────────
  async function handleTavoloSubmit(e: React.FormEvent) {
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
    router.replace(`${previewPrefix}/ordina/conferma?id=${created.id}`);
  }

  if (!hydrated) return null;

  // ── Guardie ────────────────────────────────────────────────────────────────
  if (isTavolo && !context.tableId) {
    return (
      <div className="container-wide py-32 text-center">
        <p className="impact-title text-pork-red">Nessun tavolo attivo.</p>
        <p className="mt-2 text-pork-ink/60">
          Apri la pagina del tavolo scansionando il QR code o inserendo il codice.
        </p>
        <Link href={`${previewPrefix}/tavolo`} className="btn-primary mt-6 inline-flex">
          Entra al tavolo
        </Link>
      </div>
    );
  }

  if (!isTavolo && !takeawayOk) {
    return (
      <div className="container-wide py-32 text-center">
        <p className="impact-title text-pork-red">Percorso non attivo</p>
        <h1 className="headline mt-2 text-4xl">Torna al menu</h1>
        <p className="mx-auto mt-3 max-w-md text-pork-ink/65">
          Da qui non si completa un ordine digitale. Il menu resta disponibile in
          home.
        </p>
        <Link href={`${previewPrefix}/menu`} className="btn-primary mt-8 inline-flex">
          Vai al menu
        </Link>
      </div>
    );
  }

  // ── Tavolo: conto chiuso ───────────────────────────────────────────────────
  if (isTavolo && !sessionStillOpen) {
    return (
      <>
        <MenuaryAuthHintGate />
        <div className="bg-pork-cream pb-32 pt-32 md:pt-40">
          <div className="container-wide">
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-pork-ink/5">
              <p className="impact-title text-2xl text-pork-red">Conto chiuso.</p>
              <p className="mt-2 text-pork-ink/60">
                Per un nuovo ordine scansiona di nuovo il QR o chiedi al bancone.
              </p>
              <button
                type="button"
                onClick={() => clear()}
                className="btn-primary mt-6 inline-flex"
              >
                Ok, svuota carrello
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MenuaryAuthHintGate />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-pork-ink pt-32 pb-10 text-pork-cream md:pt-40">
        <div className="container-wide">
          {isTavolo ? (
            <>
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
            </>
          ) : (
            <>
              <span className="chip-mustard">Asporto</span>
              <h1 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
                Scegli l&apos;orario, <br />
                <span className="text-pork-mustard">noi accendiamo i fuochi.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-pork-cream/70">
                Ordina qui, ritira al bancone. Nessun pagamento online: paghi quando
                vieni a prendere.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="bg-pork-cream pb-32 pt-10">
        <div className="container-wide">
          {empty ? (
            <EmptyCart previewPrefix={previewPrefix} isTavolo={isTavolo} tableId={context.tableId} />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* ── Form ───────────────────────────────────────────────── */}
              <form
                onSubmit={isTavolo ? handleTavoloSubmit : handleAsportoSubmit}
                className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/5 sm:p-8"
              >
                <h2 className="headline text-3xl">
                  {isTavolo ? "Note per la cucina" : "I tuoi dati"}
                </h2>
                {isTavolo && (
                  <p className="mt-2 text-sm text-pork-ink/60">
                    Allergie, tempi di cottura o altre richieste.
                  </p>
                )}

                <div className="mt-6 space-y-5">
                  {!isTavolo && showDineOption && (
                    <DineOptionToggle
                      value={dineOption}
                      onChange={setDineOption}
                      showDelivery={deliveryEnabled}
                    />
                  )}

                  {!isTavolo && (
                    <>
                      <Field label="Nome" icon={<User size={16} />}>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={dineOption === "delivery" ? "Nome e cognome" : "Come ti chiamiamo al bancone"}
                          className="w-full bg-transparent outline-none"
                        />
                      </Field>

                      <Field label="Telefono" icon={<Phone size={16} />}>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Per aggiornamenti sull'ordine"
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

                      {showDineOption && dineOption === "delivery" && (
                        <>
                          <Field label="Indirizzo di consegna" icon={<MapPin size={16} />}>
                            <input
                              type="text"
                              required
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              placeholder="Via, numero civico, città"
                              className="w-full bg-transparent outline-none"
                            />
                          </Field>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Citofono" icon={<DoorOpen size={16} />}>
                              <input
                                type="text"
                                value={deliveryDoorbell}
                                onChange={(e) => setDeliveryDoorbell(e.target.value)}
                                placeholder="es. Rossi"
                                className="w-full bg-transparent outline-none"
                              />
                            </Field>
                            <Field label="Piano" icon={<Building2 size={16} />}>
                              <input
                                type="text"
                                value={deliveryFloor}
                                onChange={(e) => setDeliveryFloor(e.target.value)}
                                placeholder="es. 3"
                                className="w-full bg-transparent outline-none"
                              />
                            </Field>
                          </div>
                        </>
                      )}

                      <Field label={dineOption === "delivery" ? "Orario di consegna" : "Orario di ritiro"} icon={<Clock size={16} />}>
                        <select
                          required
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full bg-transparent outline-none"
                        >
                          <option value="">Scegli un orario…</option>
                          {slots.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                    </>
                  )}

                  <Field label="Note (opzionale)" icon={<StickyNote size={16} />}>
                    <textarea
                      rows={isTavolo ? 4 : 3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        isTavolo
                          ? "Es. senza cipolla, ben cotta, due piatti separati…"
                          : "Allergie, preferenze, richieste particolari…"
                      }
                      className="w-full resize-none bg-transparent outline-none"
                    />
                  </Field>

                  {!isTavolo && showDineOption && dineOption === "delivery" && (
                    <Field label="Note consegna (opzionale)" icon={<Bike size={16} />}>
                      <textarea
                        rows={2}
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Istruzioni per il rider: cancello, scala B, ecc."
                        className="w-full resize-none bg-transparent outline-none"
                      />
                    </Field>
                  )}
                </div>

                {isTavolo ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={
                        submitting || !name.trim() || !phone.trim() || !pickupTime || lines.length === 0
                        || (showDineOption && dineOption === "delivery" && !deliveryAddress.trim())
                      }
                      className="btn-primary mt-8 w-full text-lg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Package size={20} />
                      Invia ordine ({formatEuro(total)})
                    </button>
                    <p className="mt-2 text-center text-[11px] text-pork-ink/50">
                      {dineOption === "delivery"
                        ? "L'ordine arriva in cucina; il pagamento avviene alla consegna, salvo diverse indicazioni del locale."
                        : "L'ordine arriva in cucina; il pagamento avviene al ritiro al bancone, salvo diverse indicazioni del locale."}
                    </p>
                  </>
                )}
              </form>

              {/* ── Sidebar riepilogo ──────────────────────────────────── */}
              <aside className="rounded-3xl bg-pork-ink p-6 text-pork-cream ring-1 ring-pork-ink sm:p-8 lg:sticky lg:top-28 lg:self-start">
                <h3 className="headline text-2xl text-pork-mustard">
                  {isTavolo ? (context.tableLabel ?? "Tavolo") : "Riepilogo"}
                </h3>
                {isTavolo && context.nickname && (
                  <p className="text-sm text-pork-cream/70">
                    Ordine di {context.nickname}
                  </p>
                )}
                <ul className="mt-4 space-y-3">
                  {isTavolo && addCopertoThisSubmit && (
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
                    {isTavolo ? "Il tuo totale" : "Totale"}
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
  showDelivery,
}: {
  value: OrderDineOption;
  onChange: (v: OrderDineOption) => void;
  showDelivery: boolean;
}) {
  return (
    <div>
      <span className="mb-1.5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-pork-ink/60">
        Come lo vuoi?
      </span>
      <div className={`grid gap-2 ${showDelivery ? "grid-cols-3" : "grid-cols-2"}`}>
        <DineOptionButton
          active={value === "dine_in"}
          onClick={() => onChange("dine_in")}
          icon={<UtensilsCrossed size={18} />}
          label="Mangio al locale"
          hint="su vassoio"
        />
        <DineOptionButton
          active={value === "takeaway"}
          onClick={() => onChange("takeaway")}
          icon={<ShoppingBag size={18} />}
          label="Porto via"
          hint="nel sacchetto"
        />
        {showDelivery && (
          <DineOptionButton
            active={value === "delivery"}
            onClick={() => onChange("delivery")}
            icon={<Bike size={18} />}
            label="Delivery"
            hint="a casa"
          />
        )}
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

function EmptyCart({
  previewPrefix,
  isTavolo,
  tableId,
}: {
  previewPrefix: string;
  isTavolo: boolean;
  tableId?: string | null;
}) {
  return (
    <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-pork-ink/5">
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-pork-cream text-3xl">
        🛒
      </div>
      <p className="impact-title text-2xl">Il tuo carrello è vuoto.</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-pork-ink/60">
        {isTavolo
          ? "Scegli qualcosa dal menu del tavolo."
          : "Prima si ordina, poi si paga. Scegli qualcosa dal menu."}
      </p>
      <Link
        href={isTavolo && tableId ? `${previewPrefix}/tavolo?t=${tableId}` : `${previewPrefix}/menu`}
        className="btn-primary mt-6 inline-flex"
      >
        {isTavolo ? "Torna al menu" : "Vai al menu"}
      </Link>
    </div>
  );
}
