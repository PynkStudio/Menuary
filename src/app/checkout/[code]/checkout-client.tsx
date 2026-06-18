"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Phone, MessageCircle, AlertCircle, ArrowRight, X, Plus, Pencil, Check } from "lucide-react";
import type { PublicCheckoutOrder } from "@/lib/orders/public-checkout";
import type { TenantVertical } from "@/lib/tenant";

const CANCEL_WINDOW_SEC = 120;   // 2 minuti
const UPSELL_WINDOW_SEC = 300;   // 5 minuti

// Palette derivata dalle variabili tema del tenant (--tenant-*), iniettate dalla
// route che avvolge questa pagina. NESSUN colore hardcoded di un tenant specifico:
// il checkout è condiviso e deve riflettere l'identità del tenant corrente.
const c = {
  bg: "rgb(var(--tenant-cream))",
  bgSoft: "rgb(var(--tenant-cream) / 0.45)",
  surface: "#ffffff",
  ink: "rgb(var(--tenant-ink))",
  inkMuted: "rgb(var(--tenant-ink) / 0.62)",
  inkFaint: "rgb(var(--tenant-ink) / 0.45)",
  accent: "rgb(var(--tenant-red))",
  accentHover: "rgb(var(--tenant-red-dark))",
  accentSoft: "rgb(var(--tenant-red) / 0.10)",
  mustard: "rgb(var(--tenant-mustard))",
  mustardSoft: "rgb(var(--tenant-mustard) / 0.12)",
  ring: "rgb(var(--tenant-ink) / 0.06)",
  divider: "rgb(var(--tenant-ink) / 0.08)",
};

function formatRemaining(sec: number): string {
  if (sec <= 0) return "scaduto";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

function eur(amount: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amount);
}

function dineLabel(value: string | null, vertical: TenantVertical): string | null {
  if (!value) return null;
  if (vertical === "services") {
    return value === "dine_in" ? "In sede" : value === "delivery" ? "Domicilio" : "Asporto";
  }
  return value === "dine_in" ? "Al tavolo" : value === "delivery" ? "Consegna" : "Asporto";
}

export function CheckoutClient({
  tenantId,
  tenantName,
  tenantVertical,
  order,
  token,
  paymentStatus,
  isAiSource,
  upsellSuggestions,
}: {
  tenantId: string;
  tenantName: string;
  tenantVertical: TenantVertical;
  order: PublicCheckoutOrder;
  token: string;
  paymentStatus: string | null;
  isAiSource: boolean;
  upsellSuggestions: string[];
}) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [orderCancelled, setOrderCancelled] = useState(order.status === "annullato");

  // Valori modificabili entro la finestra di 5 minuti
  const [pickupTime, setPickupTime] = useState(order.pickupTime ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState(order.deliveryAddress ?? "");
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Timer "ticking" per aggiornare i countdown in tempo reale.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsedSec = Math.max(0, (now - new Date(order.createdAt).getTime()) / 1000);
  const cancelRemaining = Math.max(0, CANCEL_WINDOW_SEC - elapsedSec);
  const upsellRemaining = Math.max(0, UPSELL_WINDOW_SEC - elapsedSec);
  const canCancel = cancelRemaining > 0;
  const canUpsell = upsellRemaining > 0;

  const alreadyPaid = order.paymentStatus === "paid";
  const wasCancelled = paymentStatus === "cancel" || orderCancelled;
  // Quando l'agente AI (o il cliente che ha scelto "pagamento al ritiro") ha
  // marcato l'ordine come not_required, mostriamo solo il riepilogo, niente Stripe.
  const payOnSite = order.paymentStatus === "not_required";

  // Link al menu/checkout preservando il prefisso slug in preview (es. /kimos/...).
  const basePath = typeof window !== "undefined" ? window.location.pathname.replace(/\/checkout\/.*$/, "") : "";
  const menuHref = `${basePath}/menu?back=${encodeURIComponent(`${basePath}/checkout/${order.code}?t=${token}`)}`;

  const cancelOrder = async () => {
    if (!canCancel) return;
    if (!confirm("Annullare definitivamente l'ordine? Operazione non reversibile.")) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/checkout/${encodeURIComponent(order.code)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, token }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "cancel_failed");
      setOrderCancelled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "errore");
    } finally {
      setCancelling(false);
    }
  };

  const saveDeliveryEdit = async () => {
    setSavingEdit(true);
    setEditError(null);
    try {
      const body: Record<string, unknown> = { tenantId, token };
      if (order.dineOption === "delivery") body.deliveryAddress = deliveryAddress.trim() || null;
      body.pickupTime = pickupTime.trim() || null;
      const res = await fetch(`/api/checkout/${encodeURIComponent(order.code)}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "update_failed");
      setEditingDelivery(false);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "errore");
    } finally {
      setSavingEdit(false);
    }
  };

  const startPayment = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/${encodeURIComponent(order.code)}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, token }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "checkout_failed");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "errore");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: c.bgSoft }}>
      <div className="mx-auto max-w-xl">
        <header className="mb-6 text-center">
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: c.accent }}>{tenantName}</p>
          <h1 className="mt-1 text-2xl font-black" style={{ color: c.ink }}>
            {alreadyPaid
              ? "Ordine confermato"
              : payOnSite
                ? "Riepilogo ordine"
                : "Riepilogo e pagamento"}
          </h1>
          <p className="mt-2 text-sm" style={{ color: c.inkMuted }}>
            Ordine <span className="font-mono font-bold">{order.code}</span>
          </p>
        </header>

        {alreadyPaid && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
            <CheckCircle2 size={22} />
            <div className="text-sm">
              <div className="font-bold">Pagamento ricevuto</div>
              <div className="text-emerald-700/80">Il locale prenderà in carico l&apos;ordine a breve.</div>
            </div>
          </div>
        )}

        {payOnSite && !alreadyPaid && !orderCancelled && (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-2xl p-4" style={{ backgroundColor: c.bg, color: c.ink }}>
              <CheckCircle2 size={22} style={{ color: c.accent }} />
              <div className="text-sm">
                <div className="font-bold">
                  Pagamento {tenantVertical === "services" ? "all'appuntamento" : (order.dineOption === "delivery" ? "alla consegna" : "al ritiro")}
                </div>
                <div style={{ color: c.inkMuted }}>
                  Conferma e dettagli ti sono stati inviati. L&apos;ordine è confermato e verrà preparato.
                </div>
              </div>
            </div>
            {isAiSource && (
              <div className="mb-4 rounded-2xl p-4 text-xs" style={{ backgroundColor: c.surface, boxShadow: `0 0 0 1px ${c.ring}`, color: c.inkMuted }}>
                <div className="flex items-center gap-2 font-bold" style={{ color: c.ink }}>
                  <ShieldCheck size={14} />
                  {order.source === "retell" ? "Informativa chiamata registrata" : "Informativa conversazione WhatsApp"}
                </div>
                <p className="mt-2 leading-relaxed">
                  {order.source === "retell"
                    ? `La chiamata effettuata al locale è stata gestita da un assistente vocale automatico per conto di ${tenantName} ed è stata registrata e trascritta per finalità di assistenza, evasione dell'ordine, qualità del servizio e adempimenti contabili.`
                    : `Questa conversazione WhatsApp è stata gestita da un assistente automatico per conto di ${tenantName}. I messaggi vengono trattati per evadere l'ordine, fornire assistenza e adempiere agli obblighi contabili.`}
                  {" "}Titolare del trattamento: <strong>{tenantName}</strong>. Diritti GDPR (artt. 15-22): contatta il locale.
                </p>
              </div>
            )}
            <section className="mb-4 rounded-2xl p-4" style={{ backgroundColor: c.surface, boxShadow: `0 0 0 1px ${c.ring}` }}>
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5" style={{ color: c.accent }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold" style={{ color: c.ink }}>Vuoi pagare online?</div>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: c.inkMuted }}>
                    Puoi saldare subito l&apos;ordine e mantenere lo stesso riepilogo.
                  </p>
                  <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl p-3 text-xs" style={{ backgroundColor: c.bgSoft, color: c.ink }}>
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4"
                      style={{ accentColor: c.accent }}
                    />
                    <span>Accetto privacy e condizioni per procedere al pagamento online.</span>
                  </label>
                  <button
                    type="button"
                    onClick={startPayment}
                    disabled={!accepted || loading}
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: c.accent }}
                  >
                    {loading ? "Apertura pagamento…" : `Paga online ${eur(order.total)}`}
                    {!loading && <ArrowRight size={15} />}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {wasCancelled && !alreadyPaid && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
            <AlertCircle size={22} />
            <div className="text-sm">
              <div className="font-bold">
                {orderCancelled ? "Ordine annullato" : "Pagamento annullato"}
              </div>
              <div className="text-amber-700/80">
                {orderCancelled
                  ? "L'ordine è stato annullato e non verrà preparato."
                  : "Puoi riprovare quando vuoi."}
              </div>
            </div>
          </div>
        )}

        {!alreadyPaid && !orderCancelled && (canCancel || canUpsell) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {canCancel && (
              <button
                type="button"
                onClick={cancelOrder}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                title={`Puoi annullare entro ${formatRemaining(cancelRemaining)}`}
              >
                <X size={13} />
                {cancelling ? "Annullamento…" : `Annulla ordine · ${formatRemaining(cancelRemaining)}`}
              </button>
            )}
            {canUpsell && (
              <a
                href={menuHref}
                className="inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-3.5 py-1.5 text-xs font-bold"
                style={{ borderColor: c.divider, color: c.ink }}
                title={`Puoi aggiungere altre voci entro ${formatRemaining(upsellRemaining)}`}
              >
                <Plus size={13} />
                {`Aggiungi altro · ${formatRemaining(upsellRemaining)}`}
              </a>
            )}
            {canUpsell && (order.dineOption === "delivery" || order.pickupTime) && (
              <button
                type="button"
                onClick={() => setEditingDelivery((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-3.5 py-1.5 text-xs font-bold"
                style={{ borderColor: c.divider, color: c.ink }}
                title={`Puoi modificare indirizzo e orario entro ${formatRemaining(upsellRemaining)}`}
              >
                <Pencil size={13} />
                {editingDelivery ? "Chiudi" : "Modifica orario/indirizzo"}
              </button>
            )}
          </div>
        )}

        {!alreadyPaid && !orderCancelled && canUpsell && editingDelivery && (
          <section className="mb-4 rounded-2xl p-4" style={{ backgroundColor: c.surface, boxShadow: `0 0 0 1px ${c.ring}` }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: c.inkFaint }}>
              Modifica orario / indirizzo · {formatRemaining(upsellRemaining)}
            </p>
            <div className="space-y-3">
              {order.pickupTime !== undefined && (
                <label className="block">
                  <span className="mb-1 block text-xs font-bold" style={{ color: c.inkMuted }}>
                    {order.dineOption === "delivery" ? "Orario di consegna" : "Orario di ritiro"}
                  </span>
                  <input
                    type="text"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    placeholder="es. 19:30"
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: c.divider, color: c.ink, backgroundColor: c.bgSoft }}
                  />
                </label>
              )}
              {order.dineOption === "delivery" && (
                <label className="block">
                  <span className="mb-1 block text-xs font-bold" style={{ color: c.inkMuted }}>Indirizzo di consegna</span>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Via, numero civico, città"
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: c.divider, color: c.ink, backgroundColor: c.bgSoft }}
                  />
                </label>
              )}
            </div>
            {editError && (
              <p className="mt-2 text-xs text-rose-600">
                {editError === "update_window_expired" ? "Finestra di modifica scaduta." : editError}
              </p>
            )}
            <button
              type="button"
              onClick={saveDeliveryEdit}
              disabled={savingEdit}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black text-white disabled:opacity-50"
              style={{ backgroundColor: c.accent }}
            >
              <Check size={13} />
              {savingEdit ? "Salvataggio…" : "Salva modifiche"}
            </button>
          </section>
        )}

        {!alreadyPaid && !orderCancelled && canUpsell && upsellSuggestions.length > 0 && (
          <section className="mb-4 rounded-2xl border p-4 text-sm" style={{ borderColor: `rgb(var(--tenant-mustard) / 0.4)`, backgroundColor: c.mustardSoft, color: c.ink }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase" style={{ color: c.accent }}>Suggerimenti per completare</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {upsellSuggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </div>
              <a
                href={menuHref}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white"
                style={{ backgroundColor: c.ink }}
              >
                <Plus size={13} />
                Aggiungi
              </a>
            </div>
          </section>
        )}

        <section className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: c.surface, boxShadow: `0 1px 2px rgb(0 0 0 / 0.05), 0 0 0 1px ${c.ring}` }}>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: c.inkFaint }}>Riepilogo</h2>
          <ul className="mt-3 divide-y" style={{ borderColor: c.divider }}>
            {order.lines.map((line, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-2.5" style={{ borderColor: c.divider }}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold" style={{ color: c.ink }}>
                    <span style={{ color: c.accent }}>{line.qty}×</span> {line.name}
                  </div>
                  {line.addedExtras.length > 0 && (
                    <ul className="mt-0.5 space-y-0.5">
                      {line.addedExtras.map((extra, j) => (
                        <li key={j} className="text-xs" style={{ color: c.inkMuted }}>
                          + {extra.name}{extra.price > 0 ? ` (${eur(extra.price)})` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                  {line.removedIngredients.length > 0 && (
                    <div className="mt-0.5 text-xs" style={{ color: c.inkMuted }}>
                      − Senza {line.removedIngredients.join(", ")}
                    </div>
                  )}
                  {line.notes && (
                    <div className="mt-0.5 text-xs italic" style={{ color: c.inkMuted }}>“{line.notes}”</div>
                  )}
                </div>
                <div className="shrink-0 text-sm font-bold tabular-nums" style={{ color: c.ink }}>
                  {eur(line.total)}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-baseline justify-between border-t pt-3" style={{ borderColor: c.divider }}>
            <span className="text-sm font-bold" style={{ color: c.ink }}>Totale</span>
            <span className="text-xl font-black tabular-nums" style={{ color: c.accent }}>{eur(order.total)}</span>
          </div>

          <dl className="mt-4 space-y-1 text-xs" style={{ color: c.inkMuted }}>
            {dineLabel(order.dineOption, tenantVertical) && (
              <div className="flex justify-between"><dt>Modalità</dt><dd className="font-bold" style={{ color: c.ink }}>{dineLabel(order.dineOption, tenantVertical)}</dd></div>
            )}
            {pickupTime && (
              <div className="flex justify-between"><dt>Orario</dt><dd className="font-bold" style={{ color: c.ink }}>{pickupTime}</dd></div>
            )}
            {deliveryAddress && (
              <div className="flex justify-between gap-4"><dt>Indirizzo</dt><dd className="text-right font-bold" style={{ color: c.ink }}>{deliveryAddress}</dd></div>
            )}
            {order.customerName && (
              <div className="flex justify-between"><dt>Cliente</dt><dd className="font-bold" style={{ color: c.ink }}>{order.customerName}</dd></div>
            )}
            {order.notes && (
              <div className="mt-2 rounded-lg p-2.5" style={{ backgroundColor: c.bg, color: c.inkMuted }}><span className="font-bold">Note:</span> {order.notes}</div>
            )}
          </dl>
        </section>

        {!alreadyPaid && !orderCancelled && !payOnSite && (
          <>
            <section className="mt-5 rounded-3xl p-5 shadow-sm" style={{ backgroundColor: c.surface, boxShadow: `0 1px 2px rgb(0 0 0 / 0.05), 0 0 0 1px ${c.ring}` }}>
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: c.inkFaint }}>
                <ShieldCheck size={14} /> Privacy e condizioni
              </h2>

              {isAiSource && (
                <div className="mt-3 rounded-2xl p-4 text-xs" style={{ backgroundColor: c.bg, color: c.inkMuted }}>
                  <div className="flex items-center gap-2 font-bold" style={{ color: c.ink }}>
                    {order.source === "retell" ? <Phone size={14} /> : <MessageCircle size={14} />}
                    {order.source === "retell" ? "Informativa chiamata registrata" : "Informativa conversazione WhatsApp"}
                  </div>
                  <p className="mt-2 leading-relaxed">
                    {order.source === "retell"
                      ? `La chiamata effettuata al locale è stata gestita da un assistente vocale automatico per conto di ${tenantName} ed è stata registrata e trascritta per finalità di assistenza, evasione dell'ordine, qualità del servizio e adempimenti contabili. La registrazione viene conservata per il tempo strettamente necessario.`
                      : `Questa conversazione WhatsApp è stata gestita da un assistente automatico per conto di ${tenantName}. I messaggi e i dati condivisi vengono trattati per evadere l'ordine, fornire assistenza, garantire la qualità del servizio e adempiere agli obblighi contabili.`}
                  </p>
                  <p className="mt-2 leading-relaxed">
                    Titolare del trattamento: <strong>{tenantName}</strong>. Responsabile del trattamento tecnico: Menuary. Hai diritto di accesso, rettifica, cancellazione e opposizione ai sensi degli artt. 15-22 GDPR scrivendo al locale.
                  </p>
                </div>
              )}

              <ul className="mt-3 space-y-2 text-xs leading-relaxed" style={{ color: c.inkMuted }}>
                <li>• Pagando confermi l&apos;ordine sopra riportato. La conferma definitiva sarà visibile al locale solo a pagamento avvenuto.</li>
                <li>• Pagamento elaborato in modo sicuro tramite <strong>Stripe</strong>: i dati della carta non transitano dai server di Menuary né del locale.</li>
                <li>• Ricevuta e dati di fatturazione: ricevi automaticamente la ricevuta Stripe via email; per fattura intestata contatta direttamente {tenantName}.</li>
                <li>• Rimborsi e contestazioni vanno gestiti direttamente con {tenantName}, titolare dell&apos;incasso.</li>
              </ul>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl p-3 text-sm" style={{ backgroundColor: c.bgSoft, color: c.ink }}>
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                  style={{ accentColor: c.accent }}
                />
                <span>
                  Ho letto e accetto l&apos;informativa sulla privacy e le condizioni di servizio.
                </span>
              </label>
            </section>

            <button
              type="button"
              onClick={startPayment}
              disabled={!accepted || loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: c.accent }}
            >
              {loading ? "Apertura pagamento…" : `Paga ${eur(order.total)}`}
              {!loading && <ArrowRight size={18} />}
            </button>

            {error && (
              <p className="mt-3 rounded-lg bg-rose-50 p-3 text-center text-xs text-rose-700">
                {error === "tenant_stripe_not_connected" || error === "tenant_stripe_charges_disabled"
                  ? "Il locale non ha ancora attivato i pagamenti online. Riprova più tardi o contatta il locale."
                  : error}
              </p>
            )}
          </>
        )}

        {error && payOnSite && !alreadyPaid && !orderCancelled && (
          <p className="mt-3 rounded-lg bg-rose-50 p-3 text-center text-xs text-rose-700">
            {error === "tenant_stripe_not_connected" || error === "tenant_stripe_charges_disabled"
              ? "Il locale non ha ancora attivato i pagamenti online. Puoi comunque pagare al ritiro o alla consegna."
              : error}
          </p>
        )}

        <footer className="mt-8 text-center text-[10px]" style={{ color: c.inkFaint }}>
          Powered by Menuary · Pagamenti sicuri Stripe
        </footer>
      </div>
    </div>
  );
}
