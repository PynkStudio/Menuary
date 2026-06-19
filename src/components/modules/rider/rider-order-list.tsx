"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, MapPin, LogOut, Package, CreditCard, Banknote } from "lucide-react";

type OrderLine = { name: string; qty: number; variant_label: string | null };
type RiderOrder = {
  id: string;
  code: string;
  status: string;
  total: number;
  customer_name: string | null;
  delivery_address: string | null;
  delivery_address_text: string | null;
  delivery_pin_lat: number | null;
  delivery_pin_lng: number | null;
  notes: string | null;
  assigned_at: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  order_lines: OrderLine[];
};

export function RiderOrderList({ riderName, tenantId }: { riderName: string; tenantId: string }) {
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    const res = await fetch("/api/rider/orders");
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function logout() {
    await fetch("/api/rider/auth", { method: "DELETE" });
    router.refresh();
  }

  const address = (o: RiderOrder) => o.delivery_address_text ?? o.delivery_address ?? "Indirizzo non specificato";

  function paymentBadge(o: RiderOrder) {
    if (o.payment_status === "paid") {
      return { label: "Già pagato", bg: "#dcfce7", color: "#15803d", icon: <CreditCard size={11} strokeWidth={2.4} /> };
    }
    return { label: "Da pagare", bg: "#fef9c3", color: "#a16207", icon: <Banknote size={11} strokeWidth={2.4} /> };
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "rgb(var(--tenant-cream, 252 248 244))",
        paddingBottom: 32,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bike size={20} strokeWidth={2} style={{ color: "rgb(var(--tenant-red, 180 30 30))" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Ciao, {riderName}</div>
            <div style={{ fontSize: "0.72rem", opacity: 0.5 }}>Aggiornamento ogni 15s</div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            opacity: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: "0.78rem",
          }}
        >
          <LogOut size={14} /> Esci
        </button>
      </div>

      {/* Lista ordini */}
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {loading && <p style={{ opacity: 0.5, textAlign: "center" }}>Caricamento...</p>}

        {!loading && orders.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              opacity: 0.5,
            }}
          >
            <Package size={40} strokeWidth={1.4} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: "0.9rem" }}>Nessun ordine assegnato</p>
            <p style={{ fontSize: "0.78rem" }}>Gli ordini appariranno qui quando il locale li assegna a te.</p>
          </div>
        )}

        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/rider/${order.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                  {order.customer_name ?? "Cliente"} — {order.code}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: order.status === "in_consegna" ? "#22c55e" : "#f59e0b",
                    color: "#fff",
                  }}
                >
                  {order.status === "in_consegna" ? "In consegna" : "Pronto"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  fontSize: "0.82rem",
                  opacity: 0.7,
                }}
              >
                <MapPin size={13} strokeWidth={2.2} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{address(order)}</span>
              </div>

              <div style={{ fontSize: "0.78rem", opacity: 0.5 }}>
                {order.order_lines.slice(0, 3).map((l, i) => (
                  <span key={i}>
                    {l.qty}× {l.name}{l.variant_label ? ` (${l.variant_label})` : ""}
                    {i < Math.min(order.order_lines.length, 3) - 1 ? " · " : ""}
                  </span>
                ))}
                {order.order_lines.length > 3 && ` +${order.order_lines.length - 3}`}
              </div>

              {(() => {
                const pb = paymentBadge(order);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, paddingTop: 2 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: pb.bg,
                        color: pb.color,
                      }}
                    >
                      {pb.icon} {pb.label}
                    </span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.55 }}>
                      {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(order.total)}
                    </span>
                  </div>
                );
              })()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
