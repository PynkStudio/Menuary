"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Phone, MessageCircle, AlertCircle, ArrowRight, X, Plus, Pencil, Check, Clock, ChefHat, Bike } from "lucide-react";
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

// ─── Mancia overlay ───────────────────────────────────────────────────────────

function ManciaOverlay({
  orderCode,
  tenantId,
  token,
  isStripePaid,
  tipState,
  setTipState,
  onClose,
}: {
  orderCode: string;
  tenantId: string;
  token: string;
  isStripePaid: boolean;
  tipState: "idle" | "loading" | "done" | "error";
  setTipState: (s: "idle" | "loading" | "done" | "error") => void;
  onClose: () => void;
}) {
  function markDone() {
    if (typeof window !== "undefined") {
      localStorage.setItem(`mancia-done-${orderCode}`, "1");
    }
  }

  async function handleTip(amountCents: number) {
    setTipState("loading");
    markDone();
    try {
      if (isStripePaid) {
        // Pre-autorizzazione: aggiunge la mancia e cattura
        const res = await fetch(`/api/checkout/${encodeURIComponent(orderCode)}/capture`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId, token, tipCents: amountCents }),
        });
        if (!res.ok) throw new Error("capture_failed");
        setTipState("done");
      } else {
        // Cash: nuova sessione Stripe per la sola mancia
        const res = await fetch(`/api/checkout/${encodeURIComponent(orderCode)}/tip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId, token, tipCents: amountCents }),
        });
        const json = (await res.json()) as { url?: string };
        if (json.url) {
          window.location.href = json.url;
          return; // navigazione in corso
        }
        setTipState("done");
      }
    } catch {
      setTipState("error");
    }
  }

  async function handleSkip() {
    markDone();
    if (isStripePaid) {
      // Cattura l'importo originale senza mancia (fire-and-forget)
      void fetch(`/api/checkout/${encodeURIComponent(orderCode)}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, token, tipCents: 0 }),
      });
    }
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget && tipState === "idle") void handleSkip(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "32px 24px 40px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.8rem", lineHeight: 1, marginBottom: 12 }}>🛵</div>

        {tipState === "done" || tipState === "error" ? (
          <>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "rgb(var(--tenant-ink))", marginBottom: 8 }}>
              {tipState === "done" ? "Grazie mille!" : "Prossima volta!"}
            </div>
            <p style={{ fontSize: "0.9rem", color: "rgb(var(--tenant-ink) / 0.6)", marginBottom: 24 }}>
              {tipState === "done"
                ? "La tua generosità fa la differenza per il rider."
                : "Non è stato possibile processare la mancia. Puoi sempre lasciarne una in contanti."}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "12px 32px", borderRadius: 100, border: "none", background: "rgb(var(--tenant-red))", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}
            >
              Chiudi
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "rgb(var(--tenant-ink))", marginBottom: 6 }}>
              Ordine consegnato!
            </div>
            <p style={{ fontSize: "0.9rem", color: "rgb(var(--tenant-ink) / 0.6)", marginBottom: 8 }}>
              Speriamo ti sia piaciuto.
            </p>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgb(var(--tenant-ink) / 0.5)", marginBottom: 24 }}>
              {isStripePaid
                ? "Vuoi aggiungere una mancia? Verrà addebitata sulla stessa carta."
                : "Vuoi lasciare una mancia al rider tramite carta?"}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
              {[100, 200, 500].map((cents) => (
                <button
                  key={cents}
                  type="button"
                  onClick={() => void handleTip(cents)}
                  disabled={tipState === "loading"}
                  style={{
                    padding: "14px 20px",
                    borderRadius: 14,
                    border: "2px solid rgb(var(--tenant-red) / 0.2)",
                    background: "rgb(var(--tenant-red) / 0.06)",
                    color: "rgb(var(--tenant-red))",
                    fontWeight: 800,
                    fontSize: "1rem",
                    cursor: tipState === "loading" ? "not-allowed" : "pointer",
                    minWidth: 72,
                    opacity: tipState === "loading" ? 0.5 : 1,
                  }}
                >
                  {tipState === "loading" ? "…" : `€${cents / 100}`}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void handleSkip()}
              disabled={tipState === "loading"}
              style={{ background: "none", border: "none", color: "rgb(var(--tenant-ink) / 0.45)", fontSize: "0.85rem", cursor: "pointer", padding: "8px 16px" }}
            >
              No, grazie
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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

type CheckoutStatusPayload = {
  status?: string;
  paymentStatus?: string;
  updatedAt?: string;
  confirmationExpiresAt?: string | null;
};

const ORDER_STATUS_COPY: Record<string, { label: string; description: string }> = {
  pending_confirmation: {
    label: "In attesa di conferma",
    description: "Stiamo controllando l'ordine e ti confermiamo tutto a breve.",
  },
  nuovo: {
    label: "Accettato",
    description: "Abbiamo preso in carico il tuo ordine.",
  },
  in_preparazione: {
    label: "In preparazione",
    description: "La cucina sta preparando il tuo ordine.",
  },
  pronto: {
    label: "Pronto",
    description: "Il tuo ordine è pronto per il ritiro o la consegna.",
  },
  in_consegna: {
    label: "In consegna",
    description: "Il rider sta arrivando con il tuo ordine.",
  },
  consegnato: {
    label: "Completato",
    description: "Ordine consegnato o ritirato. Grazie per aver ordinato da noi.",
  },
  annullato: {
    label: "Annullato",
    description: "L'ordine è stato annullato e non verrà preparato.",
  },
  expired: {
    label: "Scaduto",
    description: "Non siamo riusciti a confermare l'ordine in tempo.",
  },
};

const TRACKING_STEPS = ["pending_confirmation", "nuovo", "in_preparazione", "pronto", "in_consegna", "consegnato"];

function liveStatusCopy(status: string, paymentStatus: string) {
  if (paymentStatus === "pending") {
    return {
      label: "In attesa pagamento",
      description: "Completa il pagamento online: appena arriva, confermiamo l'ordine.",
    };
  }
  if (paymentStatus === "failed") {
    return {
      label: "Pagamento non riuscito",
      description: "Puoi riprovare il pagamento o contattarci.",
    };
  }
  if (paymentStatus === "expired") {
    return {
      label: "Pagamento scaduto",
      description: "Il link di pagamento non è più valido.",
    };
  }
  return ORDER_STATUS_COPY[status] ?? {
    label: "Aggiornamento ordine",
    description: "Abbiamo aggiornato lo stato del tuo ordine.",
  };
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
  stripeEnabled,
}: {
  tenantId: string;
  tenantName: string;
  tenantVertical: TenantVertical;
  order: PublicCheckoutOrder;
  token: string;
  paymentStatus: string | null;
  isAiSource: boolean;
  upsellSuggestions: string[];
  stripeEnabled: boolean;
}) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(order.paymentStatus);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState(order.updatedAt);
  const [confirmationExpiresAt, setConfirmationExpiresAt] = useState(order.confirmationExpiresAt);

  // Valori modificabili entro la finestra di 5 minuti
  const [pickupTime, setPickupTime] = useState(order.pickupTime ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState(order.deliveryAddress ?? "");
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showManciaOverlay, setShowManciaOverlay] = useState(false);
  const [tipState, setTipState] = useState<"idle" | "loading" | "done" | "error">("idle");

  // Timer "ticking" per aggiornare i countdown in tempo reale.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const params = new URLSearchParams({ tenantId, t: token });
        const res = await fetch(`/api/checkout/${encodeURIComponent(order.code)}/status?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as CheckoutStatusPayload;
        if (!active) return;
        if (json.status) setCurrentStatus(json.status);
        if (json.paymentStatus) setCurrentPaymentStatus(json.paymentStatus);
        if (json.updatedAt) setStatusUpdatedAt(json.updatedAt);
        if ("confirmationExpiresAt" in json) setConfirmationExpiresAt(json.confirmationExpiresAt ?? null);
      } catch {
        // Il tracking resta leggibile anche se un refresh puntuale fallisce.
      }
    }

    void loadStatus();
    const id = window.setInterval(loadStatus, 5000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [tenantId, token, order.code]);

  const alreadyPaid = currentPaymentStatus === "paid";
  const wasCancelled = paymentStatus === "cancel" || currentStatus === "annullato";
  // Quando l'agente AI (o il cliente che ha scelto "pagamento al ritiro") ha
  // marcato l'ordine come not_required, mostriamo solo il riepilogo, niente Stripe.
  const payOnSite = currentPaymentStatus === "not_required";

  useEffect(() => {
    if (currentStatus === "consegnato" && order.dineOption === "delivery") {
      const alreadyActed = typeof window !== "undefined"
        && Boolean(localStorage.getItem(`mancia-done-${order.code}`));
      const canShowMancia = alreadyPaid || (stripeEnabled && payOnSite);
      if (!alreadyActed && canShowMancia) {
        setShowManciaOverlay(true);
      }
    }
  }, [currentStatus, order.dineOption, order.code, alreadyPaid, stripeEnabled, payOnSite]);

  const elapsedSec = Math.max(0, (now - new Date(order.createdAt).getTime()) / 1000);
  const cancelRemaining = Math.max(0, CANCEL_WINDOW_SEC - elapsedSec);
  const upsellRemaining = Math.max(0, UPSELL_WINDOW_SEC - elapsedSec);
  const canCancel = cancelRemaining > 0;
  const canUpsell = upsellRemaining > 0;
  const statusCopy = liveStatusCopy(currentStatus, currentPaymentStatus);
  const isTerminalNegative = currentStatus === "annullato" || currentStatus === "expired" || currentPaymentStatus === "failed" || currentPaymentStatus === "expired";
  const activeStepIndex = TRACKING_STEPS.includes(currentStatus) ? TRACKING_STEPS.indexOf(currentStatus) : -1;
  const confirmationSecondsLeft =
    currentStatus === "pending_confirmation" && confirmationExpiresAt
      ? Math.max(0, Math.floor((new Date(confirmationExpiresAt).getTime() - now) / 1000))
      : null;

  // Link al menu/checkout preservando il prefisso slug in preview (es. /kimos/...).
  const basePath = typeof window !== "undefined" ? window.location.pathname.replace(/\/checkout\/.*$/, "") : "";
  const menuHref = `${basePath}/menu?back=${encodeURIComponent(`${basePath}/checkout/${order.code}?t=${token}`)}`;
  const fulfillmentLabel = dineLabel(order.dineOption, tenantVertical);
  const mainTitle = alreadyPaid
    ? "Ordine confermato"
    : payOnSite
      ? "Il tuo ordine è registrato"
      : "Conferma e paga l'ordine";
  const showQuickActions = !alreadyPaid && currentStatus !== "annullato" && (canCancel || canUpsell);
  const statusIcon = currentStatus === "in_preparazione"
    ? <ChefHat size={22} />
    : currentStatus === "pronto" || currentStatus === "in_consegna"
      ? <Bike size={22} />
      : currentStatus === "annullato" || currentStatus === "expired"
        ? <AlertCircle size={22} />
        : <Clock size={22} />;

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
      setCurrentStatus("annullato");
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
    <div
      className="min-h-screen px-4 py-6 sm:py-10"
      style={{
        backgroundColor: c.bgSoft,
        backgroundImage: `
          radial-gradient(circle at 18% 0%, rgb(var(--tenant-red) / 0.14), transparent 34rem),
          radial-gradient(circle at 92% 10%, rgb(var(--tenant-mustard) / 0.18), transparent 30rem),
          linear-gradient(180deg, rgb(var(--tenant-cream) / 0.82), rgb(var(--tenant-cream) / 0.38))
        `,
      }}
    >
      <div className="mx-auto max-w-3xl">
        <header
          className="relative overflow-hidden rounded-[2rem] p-5 shadow-sm sm:p-7"
          style={{
            backgroundColor: c.surface,
            boxShadow: `0 24px 70px rgb(var(--tenant-ink) / 0.10), 0 0 0 1px ${c.ring}`,
          }}
        >
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full"
            style={{ backgroundColor: c.accentSoft }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 left-1/2 h-44 w-44 rounded-full"
            style={{ backgroundColor: c.mustardSoft }}
          />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: c.accent }}>
                  {tenantName}
                </p>
                <h1 className="mt-2 max-w-xl text-3xl font-black leading-[1.02] sm:text-4xl" style={{ color: c.ink }}>
                  {mainTitle}
                </h1>
              </div>
              <div className="rounded-2xl px-4 py-3 text-right" style={{ backgroundColor: c.bgSoft }}>
                <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: c.inkFaint }}>
                  Totale
                </div>
                <div className="mt-1 text-2xl font-black tabular-nums" style={{ color: c.accent }}>
                  {eur(order.total)}
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold" style={{ color: c.inkMuted }}>
              <span className="rounded-full px-3 py-1.5" style={{ backgroundColor: c.bg }}>
                Ordine <span className="font-mono">{order.code}</span>
              </span>
              {fulfillmentLabel && (
                <span className="rounded-full px-3 py-1.5" style={{ backgroundColor: c.bg }}>
                  {fulfillmentLabel}
                </span>
              )}
              {pickupTime && (
                <span className="rounded-full px-3 py-1.5" style={{ backgroundColor: c.bg }}>
                  {pickupTime}
                </span>
              )}
            </div>
          </div>
        </header>

        <section
          className="relative z-10 -mt-3 rounded-[1.75rem] p-5 shadow-sm sm:p-6"
          style={{
            backgroundColor: c.ink,
            color: "#fff",
            boxShadow: `0 18px 45px rgb(var(--tenant-ink) / 0.18)`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: isTerminalNegative ? "#fff1f2" : "rgb(255 255 255 / 0.12)",
                color: isTerminalNegative ? "#be123c" : "#fff",
              }}
            >
              {statusIcon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "rgb(255 255 255 / 0.58)" }}>
                Stato ordine
              </p>
              <h2 className="mt-1 text-2xl font-black leading-tight">{statusCopy.label}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: "rgb(255 255 255 / 0.72)" }}>
                {statusCopy.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold" style={{ color: "rgb(255 255 255 / 0.68)" }}>
                {statusUpdatedAt && (
                  <span className="rounded-full px-3 py-1.5" style={{ backgroundColor: "rgb(255 255 255 / 0.09)" }}>
                    Aggiornato alle {new Date(statusUpdatedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {confirmationSecondsLeft !== null && (
                  <span className="rounded-full px-3 py-1.5" style={{ backgroundColor: c.mustard, color: c.ink }}>
                    Ti confermiamo entro {formatRemaining(confirmationSecondsLeft)}
                  </span>
                )}
              </div>
            </div>
          </div>
          {!isTerminalNegative && (
            <div className="mt-6 grid grid-cols-5 gap-2">
              {TRACKING_STEPS.map((step, index) => {
                const done = activeStepIndex >= index;
                return (
                  <div
                    key={step}
                    className="h-2 rounded-full transition-colors"
                    style={{ backgroundColor: done ? c.mustard : "rgb(255 255 255 / 0.16)" }}
                  />
                );
              })}
            </div>
          )}
        </section>

        {alreadyPaid && (
          <div className="mt-4 flex items-center gap-3 rounded-3xl bg-emerald-50 p-4 text-emerald-900 shadow-sm">
            <CheckCircle2 size={24} />
            <div className="text-sm">
              <div className="font-black">Pagamento ricevuto</div>
              <div className="text-emerald-800/80">Grazie, abbiamo ricevuto il pagamento e prepariamo il tuo ordine.</div>
            </div>
          </div>
        )}

        {payOnSite && !alreadyPaid && currentStatus !== "annullato" && (
          <>
            <div className="mt-4 flex items-center gap-3 rounded-3xl p-4 shadow-sm" style={{ backgroundColor: c.bg, color: c.ink }}>
              <CheckCircle2 size={24} style={{ color: c.accent }} />
              <div className="text-sm">
                <div className="font-black">
                  Pagamento {tenantVertical === "services" ? "all'appuntamento" : (order.dineOption === "delivery" ? "alla consegna" : "al ritiro")}
                </div>
                <div style={{ color: c.inkMuted }}>
                  {currentStatus === "pending_confirmation"
                    ? "Abbiamo registrato il riepilogo: ti confermiamo l'ordine prima di iniziare la preparazione."
                    : "Ti abbiamo inviato conferma e dettagli. L'ordine è confermato e verrà preparato."}
                </div>
              </div>
            </div>
            {isAiSource && (
              <div className="mt-4 rounded-3xl p-4 text-xs shadow-sm" style={{ backgroundColor: c.surface, boxShadow: `0 0 0 1px ${c.ring}`, color: c.inkMuted }}>
                <div className="flex items-center gap-2 font-bold" style={{ color: c.ink }}>
                  <ShieldCheck size={14} />
                  {order.source === "retell" ? "Informativa chiamata registrata" : "Informativa conversazione WhatsApp"}
                </div>
                <p className="mt-2 leading-relaxed">
                  {order.source === "retell"
                    ? `Hai ordinato tramite l'assistente vocale di ${tenantName}. La chiamata è stata registrata e trascritta per gestire l'ordine, assisterti e rispettare gli obblighi contabili.`
                    : `Hai ordinato tramite l'assistente WhatsApp di ${tenantName}. Trattiamo i messaggi per gestire l'ordine, assisterti e rispettare gli obblighi contabili.`}
                  {" "}Titolare del trattamento: <strong>{tenantName}</strong>. Per esercitare i diritti GDPR puoi contattarci direttamente.
                </p>
              </div>
            )}
            {stripeEnabled && (
            <section className="mt-4 rounded-3xl p-4 shadow-sm" style={{ backgroundColor: c.surface, boxShadow: `0 0 0 1px ${c.ring}` }}>
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
            )}
          </>
        )}

        {wasCancelled && !alreadyPaid && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
            <AlertCircle size={22} />
            <div className="text-sm">
              <div className="font-bold">
                {currentStatus === "annullato" ? "Ordine annullato" : "Pagamento annullato"}
              </div>
              <div className="text-amber-700/80">
                {currentStatus === "annullato"
                  ? "L'ordine è stato annullato e non verrà preparato."
                  : "Puoi riprovare quando vuoi."}
              </div>
            </div>
          </div>
        )}

        {showQuickActions && (
          <div className="mt-4 rounded-3xl p-3 shadow-sm" style={{ backgroundColor: "rgb(255 255 255 / 0.72)", boxShadow: `0 0 0 1px ${c.ring}` }}>
            <div className="flex flex-wrap gap-2">
            {canCancel && (
              <button
                type="button"
                onClick={cancelOrder}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                title={`Puoi annullare entro ${formatRemaining(cancelRemaining)}`}
              >
                <X size={13} />
                {cancelling ? "Annullamento…" : `Annulla ordine · ${formatRemaining(cancelRemaining)}`}
              </button>
            )}
            {canUpsell && (
              <a
                href={menuHref}
                className="inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-3.5 py-2 text-xs font-bold transition hover:-translate-y-0.5"
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
                className="inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-3.5 py-2 text-xs font-bold transition hover:-translate-y-0.5"
                style={{ borderColor: c.divider, color: c.ink }}
                title={`Puoi modificare indirizzo e orario entro ${formatRemaining(upsellRemaining)}`}
              >
                <Pencil size={13} />
                {editingDelivery ? "Chiudi" : "Modifica orario/indirizzo"}
              </button>
            )}
            </div>
          </div>
        )}

        {!alreadyPaid && currentStatus !== "annullato" && canUpsell && editingDelivery && (
          <section className="mt-4 rounded-3xl p-4 shadow-sm" style={{ backgroundColor: c.surface, boxShadow: `0 0 0 1px ${c.ring}` }}>
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

        {!alreadyPaid && currentStatus !== "annullato" && canUpsell && upsellSuggestions.length > 0 && (
          <section className="mt-4 rounded-3xl border p-4 text-sm shadow-sm" style={{ borderColor: `rgb(var(--tenant-mustard) / 0.4)`, backgroundColor: c.mustardSoft, color: c.ink }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: c.accent }}>Ci sta bene insieme</p>
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

        <section className="mt-4 rounded-[1.75rem] p-5 shadow-sm" style={{ backgroundColor: c.surface, boxShadow: `0 18px 50px rgb(var(--tenant-ink) / 0.08), 0 0 0 1px ${c.ring}` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: c.inkFaint }}>Il tuo ordine</p>
              <h2 className="mt-1 text-xl font-black" style={{ color: c.ink }}>Riepilogo cucina</h2>
            </div>
            <div className="rounded-2xl px-3 py-2 text-right" style={{ backgroundColor: c.accentSoft }}>
              <div className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: c.inkFaint }}>Totale</div>
              <div className="text-lg font-black tabular-nums" style={{ color: c.accent }}>{eur(order.total)}</div>
            </div>
          </div>
          <ul className="mt-3 divide-y" style={{ borderColor: c.divider }}>
            {order.lines.map((line, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-3" style={{ borderColor: c.divider }}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black" style={{ color: c.ink }}>
                    <span className="mr-2 inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: c.bg, color: c.accent }}>{line.qty}×</span>
                    {line.name}
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

          <div className="mt-4 flex items-baseline justify-between border-t pt-4" style={{ borderColor: c.divider }}>
            <span className="text-sm font-bold" style={{ color: c.ink }}>Totale</span>
            <span className="text-xl font-black tabular-nums" style={{ color: c.accent }}>{eur(order.total)}</span>
          </div>

          <dl className="mt-4 space-y-1 text-xs" style={{ color: c.inkMuted }}>
            {dineLabel(order.dineOption, tenantVertical) && (
              <div className="flex justify-between"><dt>Modalità</dt><dd className="font-bold" style={{ color: c.ink }}>{fulfillmentLabel}</dd></div>
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

        {!alreadyPaid && currentStatus !== "annullato" && !payOnSite && (
          <>
            <section className="mt-5 rounded-[1.75rem] p-5 shadow-sm" style={{ backgroundColor: c.surface, boxShadow: `0 18px 50px rgb(var(--tenant-ink) / 0.08), 0 0 0 1px ${c.ring}` }}>
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
                      ? `Hai ordinato tramite l'assistente vocale di ${tenantName}. La chiamata è stata registrata e trascritta per gestire l'ordine, assisterti e rispettare gli obblighi contabili. La registrazione viene conservata per il tempo strettamente necessario.`
                      : `Hai ordinato tramite l'assistente WhatsApp di ${tenantName}. Trattiamo messaggi e dati condivisi per gestire l'ordine, assisterti e rispettare gli obblighi contabili.`}
                  </p>
                  <p className="mt-2 leading-relaxed">
                    Titolare del trattamento: <strong>{tenantName}</strong>. Puoi chiederci accesso, rettifica, cancellazione o opposizione ai sensi degli artt. 15-22 GDPR.
                  </p>
                </div>
              )}

              <ul className="mt-3 space-y-2 text-xs leading-relaxed" style={{ color: c.inkMuted }}>
                <li>• Pagando confermi l&apos;ordine sopra riportato. Appena il pagamento va a buon fine, lo vediamo in cucina.</li>
                <li>• Il pagamento è gestito in modo sicuro da <strong>Stripe</strong>: non vediamo né conserviamo i dati della tua carta.</li>
                <li>• Ricevi automaticamente la ricevuta Stripe via email; per una fattura intestata puoi contattarci.</li>
                <li>• Per rimborsi o contestazioni, scrivici indicando il codice ordine <strong>{order.code}</strong>.</li>
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
                  ? "I pagamenti online non sono disponibili in questo momento. Riprova più tardi o contattaci."
                  : error}
              </p>
            )}
          </>
        )}

        {error && payOnSite && !alreadyPaid && currentStatus !== "annullato" && (
          <p className="mt-3 rounded-lg bg-rose-50 p-3 text-center text-xs text-rose-700">
            {error === "tenant_stripe_not_connected" || error === "tenant_stripe_charges_disabled"
              ? "I pagamenti online non sono disponibili in questo momento. Puoi comunque pagare al ritiro o alla consegna."
              : error}
          </p>
        )}

        <footer className="mt-8 text-center text-[10px]" style={{ color: c.inkFaint }}>
          Pagamento sicuro con Stripe
        </footer>
      </div>

      {showManciaOverlay && (
        <ManciaOverlay
          orderCode={order.code}
          tenantId={tenantId}
          token={token}
          isStripePaid={alreadyPaid}
          tipState={tipState}
          setTipState={setTipState}
          onClose={() => setShowManciaOverlay(false)}
        />
      )}
    </div>
  );
}
