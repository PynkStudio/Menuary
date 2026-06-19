"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Bike, User, Copy, Check } from "lucide-react";

type Rider = {
  id: string;
  name: string;
  access_code: string;
  active: boolean;
  created_at: string;
};

type DeliveryOrder = {
  id: string;
  code: string;
  customer_name: string | null;
  delivery_address: string | null;
  total: number;
  status: string;
  rider_id: string | null;
};

export function RiderPanel({ tenantId }: { tenantId: string }) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [ridersRes, ordersRes] = await Promise.all([
      fetch(`/api/gestione/${tenantId}/riders`),
      fetch(`/api/gestione/${tenantId}/orders/delivery-pending`),
    ]);
    if (ridersRes.ok) setRiders(await ridersRes.json().then((d) => d.riders));
    if (ordersRes.ok) setOrders(await ordersRes.json().then((d) => d.orders));
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  async function createRider() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/gestione/${tenantId}/riders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const { rider } = await res.json();
      setRiders((prev) => [...prev, rider]);
      setNewName("");
    }
    setCreating(false);
  }

  async function toggleActive(rider: Rider) {
    const res = await fetch(`/api/gestione/${tenantId}/riders/${rider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rider.active }),
    });
    if (res.ok) {
      const { rider: updated } = await res.json();
      setRiders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
  }

  async function deleteRider(riderId: string) {
    if (!confirm("Eliminare questo rider?")) return;
    const res = await fetch(`/api/gestione/${tenantId}/riders/${riderId}`, { method: "DELETE" });
    if (res.ok) setRiders((prev) => prev.filter((r) => r.id !== riderId));
  }

  async function assignRider(orderId: string, riderId: string | null) {
    const res = await fetch(`/api/gestione/${tenantId}/orders/${orderId}/assign-rider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riderId }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, rider_id: riderId } : o)),
      );
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return <div className="ga-empty">Caricamento...</div>;

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Modulo rider</span>
        <h1 className="ga-heading">Rider e consegne</h1>
        <p className="ga-lead">Gestisci i profili rider e assegna gli ordini delivery pronti.</p>
      </header>

      {/* Crea rider */}
      <section>
        <h2 className="ga-section-title" style={{ marginBottom: 12 }}>
          <User size={15} strokeWidth={2.2} style={{ display: "inline", marginRight: 6 }} />
          Rider attivi
        </h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            className="ga-input"
            placeholder="Nome rider (es. Marco)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createRider()}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="ga-btn ga-btn-primary"
            onClick={createRider}
            disabled={creating || !newName.trim()}
          >
            <Plus size={14} strokeWidth={2.4} /> Aggiungi
          </button>
        </div>

        {riders.length === 0 ? (
          <div className="ga-empty">Nessun rider creato.</div>
        ) : (
          <div className="ga-reservation-list">
            {riders.map((rider) => (
              <article key={rider.id} className="ga-reservation" style={{ opacity: rider.active ? 1 : 0.55 }}>
                <div className="ga-reservation-when">
                  <Bike size={18} strokeWidth={2} />
                </div>
                <div className="ga-reservation-body">
                  <div className="ga-reservation-head">
                    <span className="ga-reservation-name">{rider.name}</span>
                    <span className="ga-module-status" data-status={rider.active ? "ok" : "muted"}>
                      {rider.active ? "Attivo" : "Disattivo"}
                    </span>
                  </div>
                  <div className="ga-reservation-meta">
                    <span style={{ fontFamily: "monospace", letterSpacing: "0.06em" }}>
                      Codice: <strong>{rider.access_code}</strong>
                    </span>
                    <button
                      type="button"
                      className="ga-btn ga-btn-ghost"
                      style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                      onClick={() => copyCode(rider.access_code)}
                    >
                      {copied === rider.access_code ? <Check size={11} /> : <Copy size={11} />}
                      {copied === rider.access_code ? "Copiato" : "Copia"}
                    </button>
                  </div>
                </div>
                <div className="ga-reservation-actions">
                  <button type="button" className="ga-btn ga-btn-ghost" onClick={() => toggleActive(rider)}>
                    {rider.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {rider.active ? "Disattiva" : "Attiva"}
                  </button>
                  <button type="button" className="ga-btn ga-btn-ghost" onClick={() => deleteRider(rider.id)}>
                    <Trash2 size={14} strokeWidth={2.2} /> Elimina
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Ordini da assegnare */}
      <section style={{ marginTop: 32 }}>
        <h2 className="ga-section-title" style={{ marginBottom: 12 }}>
          <Bike size={15} strokeWidth={2.2} style={{ display: "inline", marginRight: 6 }} />
          Ordini delivery pronti
        </h2>

        {orders.length === 0 ? (
          <div className="ga-empty">Nessun ordine delivery da assegnare.</div>
        ) : (
          <div className="ga-reservation-list">
            {orders.map((order) => {
              const assignedRider = riders.find((r) => r.id === order.rider_id);
              return (
                <article key={order.id} className="ga-reservation">
                  <div className="ga-reservation-when">
                    <span className="ga-reservation-date">Delivery</span>
                    <span className="ga-reservation-time">{order.code}</span>
                  </div>
                  <div className="ga-reservation-body">
                    <div className="ga-reservation-head">
                      <span className="ga-reservation-name">{order.customer_name ?? "Cliente"}</span>
                      <span className="ga-module-status" data-status={order.rider_id ? "ok" : "warn"}>
                        {order.rider_id ? `Rider: ${assignedRider?.name ?? "—"}` : "Da assegnare"}
                      </span>
                    </div>
                    {order.delivery_address && (
                      <div className="ga-reservation-meta">
                        <span>{order.delivery_address}</span>
                      </div>
                    )}
                  </div>
                  <div className="ga-reservation-actions">
                    <select
                      className="ga-input"
                      style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                      value={order.rider_id ?? ""}
                      onChange={(e) => assignRider(order.id, e.target.value || null)}
                    >
                      <option value="">— Nessun rider —</option>
                      {riders.filter((r) => r.active).map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
