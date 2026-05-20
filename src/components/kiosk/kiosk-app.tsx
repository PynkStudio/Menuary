"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus, Minus, ShoppingBag, X, ArrowRight, ArrowLeft,
  UtensilsCrossed, ShoppingCart, Banknote, QrCode, CreditCard, Smartphone, Check,
} from "lucide-react";

type Category = {
  id: string;
  code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  position: number;
};

type Item = {
  id: string;
  category_id: string;
  code: string;
  name: string;
  description: string | null;
  price: unknown;
  price_kind: "single" | "sized" | "persone" | "volume";
  image: string | null;
  position: number;
  available: boolean;
  tags: string[];
  allergens: string[];
};

type KioskConfig = {
  steps?: {
    language_picker?: boolean;
    dine_in_takeaway?: boolean;
    table_number?: boolean;
    customer_name?: boolean;
  };
  payments?: {
    cash?: boolean;
    stripe_qr?: boolean;
    satispay?: boolean;
    pos?: boolean;
  };
};

type MenuPayload = {
  device: { id: string; name: string; config: KioskConfig };
  categories: Category[];
  items: Item[];
};

type CartLine = { itemId: string; name: string; unit: number; qty: number };
type OrderType = "tavolo" | "asporto";
type PaymentMethod = "cash" | "stripe_qr" | "pos" | "satispay";

type Phase =
  | "pairing"
  | "attract"
  | "menu"
  | "choose"
  | "table"
  | "name"
  | "pay"
  | "paying"
  | "success"
  | "error";

const STORAGE_KEY = "kiosk_session_v1";

type StoredSession = { code: string; deviceId: string; token: string };

function loadSession(code: string): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    return s.code === code && s.token ? s : null;
  } catch {
    return null;
  }
}

function saveSession(s: StoredSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function priceOf(price: unknown, kind: Item["price_kind"]): number {
  if (typeof price === "number") return price;
  if (price && typeof price === "object") {
    const p = price as Record<string, unknown>;
    if (kind === "single" && typeof p.value === "number") return p.value;
    if (kind === "sized" && typeof p.big === "number") return p.big;
    if (kind === "persone" && typeof p.per2 === "number") return p.per2;
    if (kind === "volume") {
      const small = p.small as { price?: number } | undefined;
      if (small?.price) return small.price;
    }
  }
  return 0;
}

function formatEUR(n: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export function KioskApp({ pairingCode }: { pairingCode: string }) {
  const [phase, setPhase] = useState<Phase>("pairing");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<MenuPayload | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Checkout state
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableLabel, setTableLabel] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  // ── Pairing + initial menu load ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        let session = loadSession(pairingCode);
        if (!session) {
          const res = await fetch("/api/kiosk/pair", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code: pairingCode }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error ?? "pairing_failed");
          }
          const j = (await res.json()) as { device_id: string; token: string };
          session = { code: pairingCode, deviceId: j.device_id, token: j.token };
          saveSession(session);
        }
        const menuRes = await fetch("/api/kiosk/menu", {
          headers: { "x-kiosk-token": session.token },
          cache: "no-store",
        });
        if (!menuRes.ok) {
          if (menuRes.status === 401) {
            window.localStorage.removeItem(STORAGE_KEY);
            throw new Error("session_expired");
          }
          throw new Error("menu_failed");
        }
        const payload = (await menuRes.json()) as MenuPayload;
        if (cancelled) return;
        setData(payload);
        setActiveCategory(payload.categories[0]?.id ?? null);
        setPhase("attract");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "unknown");
        setPhase("error");
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [pairingCode]);

  // Heartbeat + idle reset
  useEffect(() => {
    const session = loadSession(pairingCode);
    if (!session) return;
    const id = setInterval(() => {
      fetch("/api/kiosk/menu", {
        headers: { "x-kiosk-token": session.token },
        cache: "no-store",
      }).catch(() => undefined);
    }, 60_000);
    return () => clearInterval(id);
  }, [pairingCode]);

  // Reset to attract dopo 90s di inattività se cart vuoto e siamo in menu
  useEffect(() => {
    if (phase !== "menu" || cart.length > 0) return;
    const id = setTimeout(() => setPhase("attract"), 90_000);
    return () => clearTimeout(id);
  }, [phase, cart.length]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const it of data?.items ?? []) {
      const arr = map.get(it.category_id) ?? [];
      arr.push(it);
      map.set(it.category_id, arr);
    }
    return map;
  }, [data]);

  const total = useMemo(
    () => cart.reduce((s, l) => s + l.unit * l.qty, 0),
    [cart],
  );
  const totalQty = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  const addToCart = useCallback((it: Item) => {
    const unit = priceOf(it.price, it.price_kind);
    setCart((prev) => {
      const existing = prev.find((l) => l.itemId === it.id);
      if (existing) {
        return prev.map((l) => (l.itemId === it.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { itemId: it.id, name: it.name, unit, qty: 1 }];
    });
  }, []);

  const changeQty = useCallback((itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const resetAll = useCallback(() => {
    setCart([]);
    setCartOpen(false);
    setOrderType(null);
    setTableLabel("");
    setCustomerName("");
    setPaymentMethod(null);
    setSuccessCode(null);
    setPhase("attract");
  }, []);

  // ── Step transition logic ─────────────────────────────────────────────────
  const config = data?.device.config ?? {};
  const stepDineIn = config.steps?.dine_in_takeaway ?? true;
  const stepTable = config.steps?.table_number ?? false;
  const stepName = config.steps?.customer_name ?? false;
  const paymentsEnabled = config.payments ?? { cash: true };
  const enabledMethods: { key: PaymentMethod; label: string; sub: string; icon: React.ReactNode }[] = [];
  if (paymentsEnabled.cash) enabledMethods.push({ key: "cash", label: "Paga in cassa", sub: "Contanti o carta al banco", icon: <Banknote size={32} strokeWidth={2} /> });
  if (paymentsEnabled.stripe_qr) enabledMethods.push({ key: "stripe_qr", label: "QR Stripe", sub: "Inquadra col telefono", icon: <QrCode size={32} strokeWidth={2} /> });
  if (paymentsEnabled.satispay) enabledMethods.push({ key: "satispay", label: "Satispay", sub: "Inquadra col telefono", icon: <Smartphone size={32} strokeWidth={2} /> });
  if (paymentsEnabled.pos) enabledMethods.push({ key: "pos", label: "POS al kiosk", sub: "Avvicina la carta", icon: <CreditCard size={32} strokeWidth={2} /> });

  function startCheckout() {
    setCartOpen(false);
    if (stepDineIn) setPhase("choose");
    else { setOrderType("asporto"); goAfterType("asporto"); }
  }

  function goAfterType(t: OrderType) {
    if (t === "tavolo" && stepTable) setPhase("table");
    else if (stepName) setPhase("name");
    else setPhase("pay");
  }

  function confirmType(t: OrderType) {
    setOrderType(t);
    goAfterType(t);
  }

  async function submitOrder(method: PaymentMethod) {
    const session = loadSession(pairingCode);
    if (!session) { setErrorMsg("session_expired"); setPhase("error"); return; }
    setPaymentMethod(method);
    setPhase("paying");

    // Demo non-cash: simula 3s di "elaborazione" prima di creare l'ordine.
    if (method !== "cash") {
      await new Promise((r) => setTimeout(r, 3000));
    }

    try {
      const res = await fetch("/api/kiosk/order", {
        method: "POST",
        headers: { "content-type": "application/json", "x-kiosk-token": session.token },
        body: JSON.stringify({
          type: orderType ?? "asporto",
          lines: cart.map((l) => ({ itemId: l.itemId, name: l.name, qty: l.qty, unit: l.unit })),
          total,
          customerName: customerName.trim() || null,
          tableLabel: tableLabel.trim() || null,
          paymentMethod: method,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "order_failed");
      }
      const j = (await res.json()) as { code: string };
      setSuccessCode(j.code);
      setPhase("success");
      // Auto-reset dopo 10s.
      setTimeout(resetAll, 10_000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "unknown");
      setPhase("error");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (phase === "pairing") {
    return (
      <div className="kiosk-screen kiosk-center">
        <div className="kiosk-spinner" />
        <p className="kiosk-info">Avvio kiosk in corso…</p>
        <p className="kiosk-hint">Codice {pairingCode}</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="kiosk-screen kiosk-center">
        <h1 className="kiosk-title">Si è verificato un problema</h1>
        <p className="kiosk-info">
          {errorMsg === "invalid_code" && "Codice di pairing non valido."}
          {errorMsg === "device_disabled" && "Questo kiosk è disattivato dal gestore."}
          {errorMsg === "session_expired" && "Sessione scaduta. Riavvia la pagina."}
          {errorMsg === "order_failed" && "Impossibile inviare l'ordine. Chiedi assistenza allo staff."}
          {!["invalid_code","device_disabled","session_expired","order_failed"].includes(errorMsg ?? "") &&
            "Riprova oppure chiama lo staff."}
        </p>
        <button type="button" className="kiosk-cta" onClick={resetAll}>Torna all&apos;inizio</button>
      </div>
    );
  }

  if (phase === "attract") {
    return (
      <button type="button" className="kiosk-attract" onClick={() => setPhase("menu")}>
        <div className="kiosk-attract-inner">
          <span className="kiosk-attract-eyebrow">{data?.device.name ?? "Kiosk"}</span>
          <h1 className="kiosk-attract-title">Tocca per ordinare</h1>
          <p className="kiosk-attract-sub">Menu, carrello e pagamento dal tuo dispositivo</p>
          <span className="kiosk-attract-cta">
            Inizia <ArrowRight size={28} strokeWidth={2.4} />
          </span>
        </div>
      </button>
    );
  }

  if (phase === "choose") {
    return (
      <CheckoutShell onBack={() => setPhase("menu")} onCancel={resetAll} title="Come desideri ordinare?">
        <div className="kiosk-choose-grid">
          <button type="button" className="kiosk-choose" onClick={() => confirmType("tavolo")}>
            <UtensilsCrossed size={64} strokeWidth={1.8} />
            <span className="kiosk-choose-title">Mangia qui</span>
            <span className="kiosk-choose-sub">Servito al tavolo</span>
          </button>
          <button type="button" className="kiosk-choose" onClick={() => confirmType("asporto")}>
            <ShoppingCart size={64} strokeWidth={1.8} />
            <span className="kiosk-choose-title">Asporto</span>
            <span className="kiosk-choose-sub">Ritira al banco</span>
          </button>
        </div>
      </CheckoutShell>
    );
  }

  if (phase === "table") {
    return (
      <CheckoutShell
        onBack={() => setPhase(stepDineIn ? "choose" : "menu")}
        onCancel={resetAll}
        title="Qual è il tuo tavolo?"
      >
        <div className="kiosk-form">
          <input
            type="text"
            inputMode="numeric"
            value={tableLabel}
            onChange={(e) => setTableLabel(e.target.value)}
            placeholder="Es. 12"
            className="kiosk-input"
            autoFocus
          />
          <button
            type="button"
            className="kiosk-cta"
            disabled={!tableLabel.trim()}
            onClick={() => (stepName ? setPhase("name") : setPhase("pay"))}
          >
            Continua <ArrowRight size={20} strokeWidth={2.4} />
          </button>
        </div>
      </CheckoutShell>
    );
  }

  if (phase === "name") {
    return (
      <CheckoutShell
        onBack={() => setPhase(stepTable && orderType === "tavolo" ? "table" : stepDineIn ? "choose" : "menu")}
        onCancel={resetAll}
        title="A nome di chi è l'ordine?"
      >
        <div className="kiosk-form">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Il tuo nome"
            className="kiosk-input"
            autoFocus
          />
          <button
            type="button"
            className="kiosk-cta"
            disabled={!customerName.trim()}
            onClick={() => setPhase("pay")}
          >
            Continua <ArrowRight size={20} strokeWidth={2.4} />
          </button>
        </div>
      </CheckoutShell>
    );
  }

  if (phase === "pay") {
    return (
      <CheckoutShell
        onBack={() => setPhase(stepName ? "name" : stepTable && orderType === "tavolo" ? "table" : stepDineIn ? "choose" : "menu")}
        onCancel={resetAll}
        title={`Totale ${formatEUR(total)} — come paghi?`}
      >
        {enabledMethods.length === 0 ? (
          <p className="kiosk-info">
            Nessun metodo di pagamento attivo. Chiedi assistenza allo staff.
          </p>
        ) : (
          <div className="kiosk-pay-grid">
            {enabledMethods.map((m) => (
              <button key={m.key} type="button" className="kiosk-pay" onClick={() => submitOrder(m.key)}>
                <span className="kiosk-pay-icon">{m.icon}</span>
                <span className="kiosk-pay-title">{m.label}</span>
                <span className="kiosk-pay-sub">{m.sub}</span>
                {m.key !== "cash" && <span className="kiosk-pay-demo">Demo</span>}
              </button>
            ))}
          </div>
        )}
      </CheckoutShell>
    );
  }

  if (phase === "paying") {
    if (paymentMethod === "stripe_qr" || paymentMethod === "satispay") {
      return (
        <div className="kiosk-screen kiosk-center">
          <span className="kiosk-attract-eyebrow">Pagamento {paymentMethod === "stripe_qr" ? "Stripe" : "Satispay"}</span>
          <div className="kiosk-qr">
            <QrCode size={220} strokeWidth={1.4} />
            <span className="kiosk-qr-badge">Demo</span>
          </div>
          <h1 className="kiosk-title" style={{ fontSize: "clamp(28px,3.5vw,42px)" }}>Inquadra il QR col telefono</h1>
          <p className="kiosk-info">Totale {formatEUR(total)} · attendi la conferma…</p>
          <div className="kiosk-spinner" />
        </div>
      );
    }
    if (paymentMethod === "pos") {
      return (
        <div className="kiosk-screen kiosk-center">
          <span className="kiosk-attract-eyebrow">Pagamento POS</span>
          <CreditCard size={140} strokeWidth={1.4} />
          <h1 className="kiosk-title" style={{ fontSize: "clamp(28px,3.5vw,42px)" }}>Avvicina la carta al terminale</h1>
          <p className="kiosk-info">Totale {formatEUR(total)} · attendi la conferma…</p>
          <span className="kiosk-pay-demo" style={{ position: "static" }}>Demo</span>
          <div className="kiosk-spinner" />
        </div>
      );
    }
    return (
      <div className="kiosk-screen kiosk-center">
        <div className="kiosk-spinner" />
        <p className="kiosk-info">Invio dell&apos;ordine in corso…</p>
      </div>
    );
  }

  if (phase === "success") {
    const isCash = paymentMethod === "cash";
    return (
      <div className="kiosk-screen kiosk-center kiosk-success">
        <div className="kiosk-success-check">
          <Check size={72} strokeWidth={3} />
        </div>
        <h1 className="kiosk-title">{isCash ? "Vai alla cassa" : "Pagamento ricevuto"}</h1>
        <p className="kiosk-info">
          {isCash
            ? "Mostra questo codice in cassa per completare il pagamento."
            : "Grazie! Il tuo ordine è stato inviato in cucina."}
        </p>
        <div className="kiosk-order-code">{successCode}</div>
        <p className="kiosk-hint">
          {orderType === "tavolo"
            ? `Ti serviremo al tavolo${tableLabel ? ` ${tableLabel}` : ""}.`
            : "Verrai chiamato quando l'ordine è pronto."}
        </p>
        <button type="button" className="kiosk-cta" onClick={resetAll}>
          Nuovo ordine
        </button>
      </div>
    );
  }

  // phase === "menu"
  const cats = data?.categories ?? [];
  const activeItems = activeCategory ? itemsByCategory.get(activeCategory) ?? [] : [];

  return (
    <div className="kiosk-screen kiosk-app" data-cart-open={cartOpen}>
      <header className="kiosk-topbar">
        <button type="button" className="kiosk-link" onClick={resetAll}>
          <X size={18} strokeWidth={2.4} /> Annulla
        </button>
        <span className="kiosk-topbar-title">{data?.device.name}</span>
        <button
          type="button"
          className="kiosk-cart-toggle"
          onClick={() => setCartOpen((v) => !v)}
          aria-label="Apri carrello"
        >
          <ShoppingBag size={22} strokeWidth={2.2} />
          {totalQty > 0 && <span className="kiosk-cart-badge">{totalQty}</span>}
        </button>
      </header>

      <div className="kiosk-body">
        <aside className="kiosk-cats">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              className="kiosk-cat"
              data-active={c.id === activeCategory}
              onClick={() => setActiveCategory(c.id)}
            >
              <span className="kiosk-cat-title">{c.title}</span>
              {c.subtitle && <span className="kiosk-cat-sub">{c.subtitle}</span>}
            </button>
          ))}
        </aside>

        <main className="kiosk-items">
          {activeItems.length === 0 ? (
            <div className="kiosk-empty">Nessun prodotto disponibile.</div>
          ) : (
            <div className="kiosk-items-grid">
              {activeItems.map((it) => (
                <button key={it.id} type="button" className="kiosk-item" onClick={() => addToCart(it)}>
                  {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.name} className="kiosk-item-image" />
                  )}
                  <div className="kiosk-item-body">
                    <span className="kiosk-item-name">{it.name}</span>
                    {it.description && <span className="kiosk-item-desc">{it.description}</span>}
                    <span className="kiosk-item-price">{formatEUR(priceOf(it.price, it.price_kind))}</span>
                  </div>
                  <span className="kiosk-item-add">
                    <Plus size={20} strokeWidth={2.4} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      <aside className="kiosk-cart-drawer" aria-hidden={!cartOpen}>
        <header className="kiosk-cart-head">
          <h2>Il tuo ordine</h2>
          <button type="button" onClick={() => setCartOpen(false)} aria-label="Chiudi carrello">
            <X size={22} strokeWidth={2.4} />
          </button>
        </header>
        <div className="kiosk-cart-lines">
          {cart.length === 0 ? (
            <p className="kiosk-cart-empty">Il carrello è vuoto. Tocca un prodotto per aggiungerlo.</p>
          ) : (
            cart.map((l) => (
              <div key={l.itemId} className="kiosk-cart-line">
                <div>
                  <div className="kiosk-cart-name">{l.name}</div>
                  <div className="kiosk-cart-unit">{formatEUR(l.unit)}</div>
                </div>
                <div className="kiosk-cart-qty">
                  <button type="button" onClick={() => changeQty(l.itemId, -1)} aria-label="Riduci">
                    <Minus size={18} strokeWidth={2.4} />
                  </button>
                  <span>{l.qty}</span>
                  <button type="button" onClick={() => changeQty(l.itemId, +1)} aria-label="Aumenta">
                    <Plus size={18} strokeWidth={2.4} />
                  </button>
                </div>
                <div className="kiosk-cart-total">{formatEUR(l.unit * l.qty)}</div>
              </div>
            ))
          )}
        </div>
        <footer className="kiosk-cart-foot">
          <div className="kiosk-cart-sum">
            <span>Totale</span>
            <span className="kiosk-cart-sum-amount">{formatEUR(total)}</span>
          </div>
          <button
            type="button"
            className="kiosk-cta"
            disabled={cart.length === 0}
            onClick={startCheckout}
          >
            Vai al pagamento <ArrowRight size={20} strokeWidth={2.4} />
          </button>
        </footer>
      </aside>
    </div>
  );
}

function CheckoutShell({
  title,
  onBack,
  onCancel,
  children,
}: {
  title: string;
  onBack: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="kiosk-screen kiosk-checkout">
      <header className="kiosk-topbar">
        <button type="button" className="kiosk-link" onClick={onBack}>
          <ArrowLeft size={18} strokeWidth={2.4} /> Indietro
        </button>
        <span className="kiosk-topbar-title">Conferma ordine</span>
        <button type="button" className="kiosk-link" onClick={onCancel}>
          <X size={18} strokeWidth={2.4} /> Annulla
        </button>
      </header>
      <main className="kiosk-checkout-body">
        <h1 className="kiosk-checkout-title">{title}</h1>
        {children}
      </main>
    </div>
  );
}
