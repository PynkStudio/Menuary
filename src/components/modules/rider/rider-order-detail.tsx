"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Navigation, CheckCircle, Bike, StickyNote, CreditCard, Banknote } from "lucide-react";
import { RiderDeliveryMap } from "./rider-delivery-map";

type OrderLine = { name: string; qty: number; variant_label: string | null };
type Order = {
  id: string;
  code: string;
  status: string;
  total: number;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_address_text: string | null;
  delivery_pin_lat: number | null;
  delivery_pin_lng: number | null;
  notes: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  order_lines: OrderLine[];
};

function formatEur(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export function RiderOrderDetail({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const address = order.delivery_address_text ?? order.delivery_address ?? "";
  const hasPin = order.delivery_pin_lat != null && order.delivery_pin_lng != null;

  const mapsUrl = hasPin
    ? `https://maps.google.com/maps?q=${order.delivery_pin_lat},${order.delivery_pin_lng}`
    : (address ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}` : null);

  async function updateStatus(newStatus: "in_consegna" | "consegnato") {
    setLoading(true);
    const res = await fetch(`/api/rider/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      if (newStatus === "consegnato") {
        setTimeout(() => router.push("/rider"), 1200);
      }
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "rgb(var(--tenant-cream, 252 248 244))" }}>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            {order.customer_name ?? "Cliente"} — {order.code}
          </div>
          <div style={{ fontSize: "0.72rem", opacity: 0.5 }}>{formatEur(order.total)}</div>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.72rem",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 20,
            background: status === "consegnato" ? "#6b7280" : status === "in_consegna" ? "#22c55e" : "#f59e0b",
            color: "#fff",
          }}
        >
          {status === "in_consegna" ? "In consegna" : status === "consegnato" ? "Consegnato" : "Pronto"}
        </span>
      </div>

      <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Mappa */}
        {hasPin && (
          <RiderDeliveryMap
            lat={order.delivery_pin_lat!}
            lng={order.delivery_pin_lng!}
            label={(address || order.customer_name) ?? undefined}
          />
        )}

        {/* Indirizzo + navigazione */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {address ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <MapPin size={16} strokeWidth={2.2} style={{ marginTop: 2, color: "rgb(var(--tenant-red, 180 30 30))", flexShrink: 0 }} />
              <span style={{ fontSize: "0.9rem", lineHeight: 1.4 }}>{address}</span>
            </div>
          ) : (
            <p style={{ fontSize: "0.85rem", opacity: 0.5, margin: 0 }}>Indirizzo non specificato</p>
          )}

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgb(var(--tenant-red, 180 30 30))",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.88rem",
                justifyContent: "center",
              }}
            >
              <Navigation size={15} strokeWidth={2.4} /> Naviga con Google Maps
            </a>
          )}

          {order.customer_phone && (
            <a
              href={`tel:${order.customer_phone}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px solid rgba(0,0,0,0.12)",
                color: "inherit",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.88rem",
                justifyContent: "center",
              }}
            >
              <Phone size={15} strokeWidth={2.2} /> {order.customer_phone}
            </a>
          )}
        </div>

        {/* Stato pagamento */}
        {order.payment_status === "paid" ? (
          <div
            style={{
              background: "#dcfce7",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#15803d",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            <CreditCard size={18} strokeWidth={2.2} />
            Già pagato online
          </div>
        ) : (
          <div
            style={{
              background: "#fef9c3",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#a16207",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            <Banknote size={18} strokeWidth={2.2} />
            Da pagare alla consegna — {formatEur(order.total)}
          </div>
        )}

        {/* Articoli */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px" }}>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 600, opacity: 0.5, margin: "0 0 10px" }}>ARTICOLI</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {order.order_lines.map((l, i) => (
              <li key={i} style={{ display: "flex", gap: 8, fontSize: "0.88rem" }}>
                <span style={{ fontWeight: 700, minWidth: 24 }}>{l.qty}×</span>
                <span>{l.name}{l.variant_label ? ` · ${l.variant_label}` : ""}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Note */}
        {order.notes && (
          <div style={{ background: "#fffbeb", borderRadius: 14, padding: "14px 18px" }}>
            <div style={{ display: "flex", gap: 6, fontSize: "0.85rem" }}>
              <StickyNote size={14} strokeWidth={2.2} style={{ marginTop: 2, flexShrink: 0 }} />
              {order.notes}
            </div>
          </div>
        )}

        {/* Azioni stato */}
        {status === "pronto" && (
          <button
            type="button"
            onClick={() => updateStatus("in_consegna")}
            disabled={loading}
            style={{
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "#22c55e",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Bike size={18} strokeWidth={2.4} /> Sono partito per la consegna
          </button>
        )}

        {status === "in_consegna" && (
          <button
            type="button"
            onClick={() => updateStatus("consegnato")}
            disabled={loading}
            style={{
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "rgb(var(--tenant-red, 180 30 30))",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={18} strokeWidth={2.4} /> Consegnato
          </button>
        )}

        {status === "consegnato" && (
          <div style={{ textAlign: "center", padding: "16px", opacity: 0.6, fontSize: "0.9rem" }}>
            ✓ Consegna completata
          </div>
        )}
      </div>
    </div>
  );
}
