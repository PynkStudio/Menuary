"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Phone, MessageCircle, AlertCircle, ArrowRight, X, Plus } from "lucide-react";
import type { PublicCheckoutOrder } from "@/lib/orders/public-checkout";
import type { TenantVertical } from "@/lib/tenant";

const CANCEL_WINDOW_SEC = 120;   // 2 minuti
const UPSELL_WINDOW_SEC = 300;   // 5 minuti

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
    <div className="min-h-screen bg-pork-cream/40 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <header className="mb-6 text-center">
          <p className="impact-title text-xs text-pork-red">{tenantName}</p>
          <h1 className="headline mt-1 text-2xl">
            {alreadyPaid
              ? "Ordine confermato"
              : payOnSite
                ? "Riepilogo ordine"
                : "Riepilogo e pagamento"}
          </h1>
          <p className="mt-2 text-sm text-pork-ink/60">
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
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-pork-cream p-4 text-pork-ink">
              <CheckCircle2 size={22} className="text-pork-red" />
              <div className="text-sm">
                <div className="font-bold">
                  Pagamento {tenantVertical === "services" ? "all'appuntamento" : (order.dineOption === "delivery" ? "alla consegna" : "al ritiro")}
                </div>
                <div className="text-pork-ink/65">
                  Conferma e dettagli ti sono stati inviati. L&apos;ordine è confermato e verrà preparato.
                </div>
              </div>
            </div>
            {isAiSource && (
              <div className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-pork-ink/5 text-xs text-pork-ink/70">
                <div className="flex items-center gap-2 font-bold text-pork-ink">
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
            <section className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-pork-ink/5">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 text-pork-red" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-pork-ink">Vuoi pagare online?</div>
                  <p className="mt-1 text-xs leading-relaxed text-pork-ink/60">
                    Se il locale ha Stripe attivo puoi saldare subito l&apos;ordine e mantenere lo stesso riepilogo.
                  </p>
                  <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl bg-pork-cream/60 p-3 text-xs text-pork-ink hover:bg-pork-cream">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-pork-red"
                    />
                    <span>Accetto privacy e condizioni per procedere al pagamento online.</span>
                  </label>
                  <button
                    type="button"
                    onClick={startPayment}
                    disabled={!accepted || loading}
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-pork-red px-4 py-2.5 text-sm font-black text-white transition hover:bg-pork-red/90 disabled:cursor-not-allowed disabled:opacity-40"
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
                href={`/menu?back=${encodeURIComponent(`/checkout/${order.code}?t=${token}`)}`}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-pork-ink/15 bg-white px-3.5 py-1.5 text-xs font-bold hover:bg-pork-cream"
                title={`Puoi aggiungere altre voci entro ${formatRemaining(upsellRemaining)}`}
              >
                <Plus size={13} />
                {`Aggiungi altro · ${formatRemaining(upsellRemaining)}`}
              </a>
            )}
          </div>
        )}

        {!alreadyPaid && !orderCancelled && canUpsell && upsellSuggestions.length > 0 && (
          <section className="mb-4 rounded-2xl border border-pork-mustard/40 bg-pork-mustard/10 p-4 text-sm text-pork-ink">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-pork-red">Suggerimenti per completare</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {upsellSuggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </div>
              <a
                href={`/menu?back=${encodeURIComponent(`/checkout/${order.code}?t=${token}`)}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-pork-ink px-3 py-2 text-xs font-bold text-white hover:bg-pork-red"
              >
                <Plus size={13} />
                Aggiungi
              </a>
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-pork-ink/5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pork-ink/50">Riepilogo</h2>
          <ul className="mt-3 divide-y divide-pork-ink/5">
            {order.lines.map((line, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-pork-ink">
                    <span className="text-pork-red">{line.qty}×</span> {line.name}
                  </div>
                  {line.notes && (
                    <div className="text-xs text-pork-ink/55">{line.notes}</div>
                  )}
                </div>
                <div className="shrink-0 text-sm font-bold tabular-nums">
                  {eur(line.total)}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-baseline justify-between border-t border-pork-ink/10 pt-3">
            <span className="text-sm font-bold text-pork-ink">Totale</span>
            <span className="text-xl font-black tabular-nums text-pork-red">{eur(order.total)}</span>
          </div>

          <dl className="mt-4 space-y-1 text-xs text-pork-ink/60">
            {dineLabel(order.dineOption, tenantVertical) && (
              <div className="flex justify-between"><dt>Modalità</dt><dd className="font-bold text-pork-ink">{dineLabel(order.dineOption, tenantVertical)}</dd></div>
            )}
            {order.pickupTime && (
              <div className="flex justify-between"><dt>Orario</dt><dd className="font-bold text-pork-ink">{order.pickupTime}</dd></div>
            )}
            {order.customerName && (
              <div className="flex justify-between"><dt>Cliente</dt><dd className="font-bold text-pork-ink">{order.customerName}</dd></div>
            )}
            {order.notes && (
              <div className="mt-2 rounded-lg bg-pork-cream p-2.5 text-pork-ink/70"><span className="font-bold">Note:</span> {order.notes}</div>
            )}
          </dl>
        </section>

        {!alreadyPaid && !orderCancelled && !payOnSite && (
          <>
            <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-pork-ink/5">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pork-ink/50">
                <ShieldCheck size={14} /> Privacy e condizioni
              </h2>

              {isAiSource && (
                <div className="mt-3 rounded-2xl bg-pork-cream p-4 text-xs text-pork-ink/75">
                  <div className="flex items-center gap-2 font-bold text-pork-ink">
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

              <ul className="mt-3 space-y-2 text-xs text-pork-ink/65 leading-relaxed">
                <li>• Pagando confermi l&apos;ordine sopra riportato. La conferma definitiva sarà visibile al locale solo a pagamento avvenuto.</li>
                <li>• Pagamento elaborato in modo sicuro tramite <strong>Stripe</strong>: i dati della carta non transitano dai server di Menuary né del locale.</li>
                <li>• Ricevuta e dati di fatturazione: ricevi automaticamente la ricevuta Stripe via email; per fattura intestata contatta direttamente {tenantName}.</li>
                <li>• Rimborsi e contestazioni vanno gestiti direttamente con {tenantName}, titolare dell&apos;incasso.</li>
              </ul>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-pork-cream/60 p-3 text-sm text-pork-ink hover:bg-pork-cream">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-pork-red"
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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-pork-red px-6 py-4 text-base font-black text-white shadow-lg transition hover:bg-pork-red/90 disabled:cursor-not-allowed disabled:opacity-40"
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

        <footer className="mt-8 text-center text-[10px] text-pork-ink/40">
          Powered by Menuary · Pagamenti sicuri Stripe
        </footer>
      </div>
    </div>
  );
}
