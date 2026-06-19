"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { CheckCircle2, ShieldCheck, Phone, MessageCircle, AlertCircle, ArrowRight, X, Plus, Pencil, Check, Clock, ChefHat, Bike, Loader2, Home, ShoppingBag, RotateCcw, type LucideIcon } from "lucide-react";
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
  green: "rgb(var(--tenant-green))",
  greenSoft: "rgb(var(--tenant-green) / 0.12)",
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

// ─── Edit‑line overlay ───────────────────────────────────────────────────────

type ItemOptions = {
  ingredients: Array<{ code: string; name: string }>;
  extras: Array<{ id: string; code: string; name: string; price: number }>;
};

type OrderLine = PublicCheckoutOrder["lines"][number];

function EditLineOverlay({
  orderCode,
  tenantId,
  token,
  line,
  onSaved,
  onClose,
}: {
  orderCode: string;
  tenantId: string;
  token: string;
  line: OrderLine;
  onSaved: (result: {
    lineId: string;
    unitPrice: number;
    lineTotal: number;
    total: number;
    addedExtras: Array<{ id: string; name: string; price: number }>;
    removedIngredients: string[];
    note: string | null;
    newStatus?: string;
  }) => void;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<ItemOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [selectedExtras, setSelectedExtras] = useState<Array<{ id: string; name: string; price: number }>>(line.addedExtras);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>(line.removedIngredients);
  const [note, setNote] = useState(line.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams({ tenantId, t: token, itemId: line.itemId });
        const res = await fetch(`/api/checkout/${encodeURIComponent(orderCode)}/item-options?${params.toString()}`);
        if (!res.ok) throw new Error("fetch_failed");
        const json = (await res.json()) as ItemOptions;
        if (active) setOptions(json);
      } catch {
        if (active) setOptions({ ingredients: [], extras: [] });
      } finally {
        if (active) setLoadingOptions(false);
      }
    })();
    return () => { active = false; };
  }, [orderCode, tenantId, token, line.itemId]);

  const toggleExtra = useCallback((extra: { id: string; name: string; price: number }) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      return exists ? prev.filter((e) => e.id !== extra.id) : [...prev, extra];
    });
  }, []);

  const toggleIngredient = useCallback((ingredientName: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ingredientName) ? prev.filter((n) => n !== ingredientName) : [...prev, ingredientName],
    );
  }, []);

  const hasChanges =
    JSON.stringify(selectedExtras.map((e) => e.id).sort()) !== JSON.stringify(line.addedExtras.map((e) => e.id).sort()) ||
    JSON.stringify([...removedIngredients].sort()) !== JSON.stringify([...line.removedIngredients].sort()) ||
    (note.trim() || "") !== (line.notes || "");

  const handleSave = async () => {
    if (!hasChanges) { onClose(); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/checkout/${encodeURIComponent(orderCode)}/edit-line`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          token,
          lineId: line.id,
          addedExtras: selectedExtras,
          removedIngredients,
          note: note.trim() || null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; lineId?: string; unitPrice?: number; lineTotal?: number; total?: number; needsApproval?: boolean; newStatus?: string };
      if (!res.ok) throw new Error(json.error ?? "edit_failed");
      onSaved({
        lineId: json.lineId!,
        unitPrice: json.unitPrice!,
        lineTotal: json.lineTotal!,
        total: json.total!,
        addedExtras: selectedExtras,
        removedIngredients,
        note: note.trim() || null,
        newStatus: json.newStatus,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "errore");
    } finally {
      setSaving(false);
    }
  };

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
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "28px 20px 36px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.16em", color: c.inkFaint }}>
              Modifica piatto
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 900, color: c.ink, marginTop: 4 }}>
              {line.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: c.inkMuted }}
          >
            <X size={20} />
          </button>
        </div>

        {loadingOptions ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0", color: c.inkMuted }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : (
          <>
            {/* Ingredienti */}
            {options && options.ingredients.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: c.inkFaint, marginBottom: 10 }}>
                  Ingredienti
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {options.ingredients.map((ing) => {
                    const isRemoved = removedIngredients.includes(ing.name);
                    return (
                      <button
                        key={ing.code}
                        type="button"
                        onClick={() => toggleIngredient(ing.name)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 100,
                          border: `2px solid ${isRemoved ? "rgb(var(--tenant-ink) / 0.12)" : c.accent}`,
                          background: isRemoved ? "transparent" : c.accentSoft,
                          color: isRemoved ? c.inkMuted : c.accent,
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          textDecoration: isRemoved ? "line-through" : "none",
                          opacity: isRemoved ? 0.6 : 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {ing.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extra */}
            {options && options.extras.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: c.inkFaint, marginBottom: 10 }}>
                  Extra
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {options.extras.map((extra) => {
                    const isSelected = selectedExtras.some((e) => e.id === extra.id);
                    return (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => toggleExtra({ id: extra.id, name: extra.name, price: extra.price })}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 14,
                          border: `2px solid ${isSelected ? c.accent : "rgb(var(--tenant-ink) / 0.10)"}`,
                          background: isSelected ? c.accentSoft : "transparent",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: "0.85rem", color: isSelected ? c.accent : c.ink }}>
                          {extra.name}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: "0.8rem", color: isSelected ? c.accent : c.inkMuted }}>
                          {extra.price > 0 ? `+${eur(extra.price)}` : "Gratis"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Note */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: c.inkFaint, marginBottom: 8 }}>
                Note
              </div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="es. ben cotto, senza cipolla…"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: `1.5px solid ${c.divider}`,
                  fontSize: "0.85rem",
                  color: c.ink,
                  backgroundColor: c.bgSoft,
                  outline: "none",
                }}
              />
            </div>
          </>
        )}

        {error && (
          <p style={{ fontSize: "0.78rem", color: "#be123c", marginBottom: 12 }}>
            {error === "edit_window_expired" ? "Finestra di modifica scaduta." : error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loadingOptions || !hasChanges}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 24px",
            borderRadius: 100,
            border: "none",
            background: hasChanges ? c.accent : c.divider,
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.95rem",
            cursor: saving || loadingOptions || !hasChanges ? "not-allowed" : "pointer",
            opacity: saving || loadingOptions ? 0.6 : 1,
            transition: "all 0.15s ease",
          }}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Salvataggio…
            </>
          ) : hasChanges ? (
            <>
              <Check size={16} />
              Salva modifiche
            </>
          ) : (
            "Nessuna modifica"
          )}
        </button>
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

type TrackerNode = { label: string; Icon: LucideIcon; state: "done" | "active" | "todo" };

// Tappe visibili del tracker (4 nodi) mappate sugli stati interni. La soglia `t`
// è l'indice in TRACKING_STEPS a partire dal quale il nodo è completato; il primo
// nodo non completato diventa quello "attivo".
function buildTrackerNodes(status: string, dineOption: string | null): TrackerNode[] {
  const idx = TRACKING_STEPS.indexOf(status);
  const defs =
    dineOption === "delivery"
      ? [
          { label: "Ricevuto", Icon: Check, t: 1 },
          { label: "In cucina", Icon: ChefHat, t: 2 },
          { label: "In consegna", Icon: Bike, t: 4 },
          { label: "Consegnato", Icon: Home, t: 5 },
        ]
      : [
          { label: "Ricevuto", Icon: Check, t: 1 },
          { label: "In cucina", Icon: ChefHat, t: 2 },
          { label: "Pronto", Icon: ShoppingBag, t: 3 },
          { label: "Ritirato", Icon: Check, t: 5 },
        ];
  let activeUsed = false;
  return defs.map((d) => {
    let state: TrackerNode["state"];
    if (idx >= d.t) state = "done";
    else if (!activeUsed) { state = "active"; activeUsed = true; }
    else state = "todo";
    return { label: d.label, Icon: d.Icon, state };
  });
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
  const [editingLine, setEditingLine] = useState<OrderLine | null>(null);
  const [liveLines, setLiveLines] = useState(order.lines);
  const [liveTotal, setLiveTotal] = useState(order.total);

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
  const confirmationSecondsLeft =
    currentStatus === "pending_confirmation" && confirmationExpiresAt
      ? Math.max(0, Math.floor((new Date(confirmationExpiresAt).getTime() - now) / 1000))
      : null;

  // Link al menu/checkout preservando il prefisso slug in preview (es. /kimos/...).
  const basePath = typeof window !== "undefined" ? window.location.pathname.replace(/\/checkout\/.*$/, "") : "";
  const menuHref = `${basePath}/menu?back=${encodeURIComponent(`${basePath}/checkout/${order.code}?t=${token}`)}`;
  const privacyHref = `${basePath}/privacy`;
  const fulfillmentLabel = dineLabel(order.dineOption, tenantVertical);
  const showQuickActions = !alreadyPaid && currentStatus !== "annullato" && (canCancel || canUpsell);

  // Wordmark del tenant (iniziali) — niente logo terzo, solo identità del locale.
  const initials = tenantName.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  // Tracker solo per ordini "in viaggio" (delivery/asporto) ancora vivi e solo nel
  // verticale food: tappe come cucina/consegna non hanno senso altrove.
  const showTracker = !isTerminalNegative && tenantVertical !== "services" && (order.dineOption === "delivery" || order.dineOption === "takeaway");
  const trackerNodes = showTracker ? buildTrackerNodes(currentStatus, order.dineOption) : [];

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
      <div className="mx-auto max-w-xl">
        <header
          className="relative overflow-hidden rounded-[2rem] p-5 shadow-sm sm:p-6"
          style={{
            backgroundColor: c.surface,
            boxShadow: `0 24px 70px rgb(var(--tenant-ink) / 0.10), 0 0 0 1px ${c.ring}`,
          }}
        >
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full"
            style={{ backgroundColor: c.accentSoft }}
          />
          <div className="relative flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black"
              style={{ backgroundColor: c.accent, color: "#fff", letterSpacing: "0.04em" }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-black leading-tight" style={{ color: c.ink }}>
                {tenantName}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-bold" style={{ color: c.inkMuted }}>
                <span>Ordine <span className="font-mono">{order.code}</span></span>
                {fulfillmentLabel && (<><span style={{ opacity: 0.4 }}>·</span><span>{fulfillmentLabel}</span></>)}
                {pickupTime && (<><span style={{ opacity: 0.4 }}>·</span><span>{pickupTime}</span></>)}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: c.inkFaint }}>
                Totale
              </div>
              <div className="text-2xl font-black tabular-nums" style={{ color: c.ink }}>
                {eur(liveTotal)}
              </div>
            </div>
          </div>
        </header>

        <section
          className="relative z-10 -mt-4 rounded-[1.75rem] p-5 shadow-sm sm:p-6"
          style={{
            backgroundColor: c.ink,
            color: "#fff",
            boxShadow: `0 18px 45px rgb(var(--tenant-ink) / 0.22)`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: isTerminalNegative ? "rgb(var(--tenant-red))" : c.green,
                boxShadow: isTerminalNegative
                  ? "0 0 0 4px rgb(var(--tenant-red) / 0.18)"
                  : "0 0 0 4px rgb(var(--tenant-green) / 0.22)",
              }}
            />
            <span className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "rgb(255 255 255 / 0.55)" }}>
              Stato ordine
            </span>
            {statusUpdatedAt && (
              <span className="ml-auto text-[11px] font-bold" style={{ color: "rgb(255 255 255 / 0.5)" }}>
                agg. {new Date(statusUpdatedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          <h1 className="mt-2 text-[1.7rem] font-black leading-tight">{statusCopy.label}</h1>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "rgb(255 255 255 / 0.68)" }}>
            {statusCopy.description}
          </p>

          {confirmationSecondsLeft !== null && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: c.mustard, color: c.ink }}>
              <Clock size={12} /> Ti confermiamo entro {formatRemaining(confirmationSecondsLeft)}
            </span>
          )}

          {showTracker && (
            <div className="mt-5 flex items-start">
              {trackerNodes.map((node, i) => (
                <Fragment key={node.label}>
                  {i > 0 && (
                    <div
                      className="h-0.5 flex-1 rounded-full"
                      style={{ marginTop: 13, backgroundColor: node.state === "todo" ? "rgb(255 255 255 / 0.16)" : c.mustard }}
                    />
                  )}
                  <div className="flex flex-col items-center" style={{ width: 56 }}>
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: node.state === "done" ? c.mustard : node.state === "active" ? "rgb(var(--tenant-mustard) / 0.16)" : "rgb(255 255 255 / 0.08)",
                        color: node.state === "done" ? c.ink : node.state === "active" ? c.mustard : "rgb(255 255 255 / 0.5)",
                        border: node.state === "active" ? `1.5px solid ${c.mustard}` : "1.5px solid transparent",
                      }}
                    >
                      <node.Icon size={14} />
                    </div>
                    <div
                      className="mt-1.5 text-center text-[9.5px] font-bold leading-tight"
                      style={{ color: node.state === "todo" ? "rgb(255 255 255 / 0.45)" : "rgb(255 255 255 / 0.8)" }}
                    >
                      {node.label}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          )}

          {isTerminalNegative && (
            <div className="mt-4 flex flex-col gap-2.5 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between" style={{ backgroundColor: "rgb(255 255 255 / 0.06)" }}>
              <span className="text-xs font-bold" style={{ color: "rgb(255 255 255 / 0.7)" }}>
                Nessun importo è stato addebitato.
              </span>
              <a
                href={menuHref}
                className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-black"
                style={{ backgroundColor: c.mustard, color: c.ink }}
              >
                <RotateCcw size={13} /> Fai un nuovo ordine
              </a>
            </div>
          )}
        </section>

        {alreadyPaid && (
          <div className="mt-4 flex items-center gap-3 rounded-3xl p-4 shadow-sm" style={{ backgroundColor: c.greenSoft, color: c.ink }}>
            <CheckCircle2 size={24} style={{ color: c.green }} />
            <div className="text-sm">
              <div className="font-black">Pagamento ricevuto</div>
              <div style={{ color: c.inkMuted }}>Grazie, abbiamo ricevuto il pagamento e prepariamo il tuo ordine.</div>
            </div>
          </div>
        )}

        {payOnSite && !alreadyPaid && !isTerminalNegative && (
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
                    : "Il tuo ordine è confermato: lo prepariamo a breve."}
                </div>
              </div>
            </div>
            {isAiSource && (
              <div className="mt-4 rounded-3xl p-4 text-xs shadow-sm" style={{ backgroundColor: c.surface, boxShadow: `0 0 0 1px ${c.ring}`, color: c.inkMuted }}>
                <div className="flex items-center gap-2 font-bold" style={{ color: c.ink }}>
                  <ShieldCheck size={14} />
                  {order.source === "retell" ? "Chiamata registrata" : "Conversazione WhatsApp"}
                </div>
                <p className="mt-2 leading-relaxed">
                  {order.source === "retell"
                    ? "La telefonata è stata registrata e trascritta per gestire l'ordine."
                    : "I messaggi sono trattati per gestire l'ordine."}
                  {" "}
                  <a href={privacyHref} className="font-bold underline" style={{ color: c.accent }}>Informativa privacy</a>.
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
                    {loading ? "Apertura pagamento…" : `Paga online ${eur(liveTotal)}`}
                    {!loading && <ArrowRight size={15} />}
                  </button>
                </div>
              </div>
            </section>
            )}
          </>
        )}

        {paymentStatus === "cancel" && !isTerminalNegative && !alreadyPaid && (
          <div className="mt-4 flex items-center gap-3 rounded-3xl p-4 shadow-sm" style={{ backgroundColor: c.mustardSoft, color: c.ink }}>
            <AlertCircle size={22} style={{ color: c.accent }} />
            <div className="text-sm">
              <div className="font-black">Pagamento annullato</div>
              <div style={{ color: c.inkMuted }}>Nessun addebito effettuato. Puoi riprovare quando vuoi.</div>
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
              <div className="text-lg font-black tabular-nums" style={{ color: c.accent }}>{eur(liveTotal)}</div>
            </div>
          </div>
          <ul className="mt-3 divide-y" style={{ borderColor: c.divider }}>
            {liveLines.map((line, i) => (
              <li key={line.id ?? i} className="flex items-start justify-between gap-4 py-3" style={{ borderColor: c.divider }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-black" style={{ color: c.ink }}>
                    <span className="mr-1 inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: c.bg, color: c.accent }}>{line.qty}×</span>
                    {line.name}
                    {canUpsell && !alreadyPaid && currentStatus !== "annullato" && (
                      <button
                        type="button"
                        onClick={() => setEditingLine(line)}
                        className="ml-1 inline-flex items-center justify-center rounded-full p-1 transition hover:scale-110"
                        style={{ color: c.inkMuted, background: c.bgSoft }}
                        title="Modifica piatto"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
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
                    <div className="mt-0.5 text-xs italic" style={{ color: c.inkMuted }}>{`“${line.notes}”`}</div>
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
            <span className="text-xl font-black tabular-nums" style={{ color: c.accent }}>{eur(liveTotal)}</span>
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
            {(order.customerName || order.customerPhone) && (
              <div className="flex justify-between gap-4"><dt>Cliente</dt><dd className="text-right font-bold" style={{ color: c.ink }}>{[order.customerName, order.customerPhone].filter(Boolean).join(" · ")}</dd></div>
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
                    {order.source === "retell" ? "Chiamata registrata" : "Conversazione WhatsApp"}
                  </div>
                  <p className="mt-2 leading-relaxed">
                    {order.source === "retell"
                      ? "La telefonata è stata registrata e trascritta per gestire l'ordine."
                      : "I messaggi sono trattati per gestire l'ordine."}
                    {" "}
                    Dettagli e diritti GDPR nell&apos;
                    <a href={privacyHref} className="font-bold underline" style={{ color: c.accent }}>informativa privacy</a>.
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
              {loading ? "Apertura pagamento…" : `Paga ${eur(liveTotal)}`}
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

        {(alreadyPaid || !payOnSite) && (
          <footer className="mt-8 text-center text-[10px]" style={{ color: c.inkFaint }}>
            Pagamento sicuro con Stripe
          </footer>
        )}
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

      {editingLine && (
        <EditLineOverlay
          orderCode={order.code}
          tenantId={tenantId}
          token={token}
          line={editingLine}
          onClose={() => setEditingLine(null)}
          onSaved={(result) => {
            setLiveLines((prev) =>
              prev.map((l) =>
                l.id === result.lineId
                  ? { ...l, unitPrice: result.unitPrice, total: result.lineTotal, addedExtras: result.addedExtras, removedIngredients: result.removedIngredients, notes: result.note }
                  : l,
              ),
            );
            setLiveTotal(result.total);
            if (result.newStatus) setCurrentStatus(result.newStatus);
            setEditingLine(null);
          }}
        />
      )}
    </div>
  );
}
