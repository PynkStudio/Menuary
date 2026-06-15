"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Trash2, ExternalLink, MoreHorizontal, Loader2, Send, Copy } from "lucide-react";
import {
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
} from "@/lib/contracts/contracts-store";
import { BRAND_INFO, formatEUR, computeYearlyTotal, type ContractData, type ContractBrand } from "@/lib/contracts/menuary-contract";

type ServerContract = {
  id: string;
  numero: string;
  brand: string;
  status: ContractStatus;
  contract_data: ContractData;
  payment_status: string;
  signing_url: string | null;
  signed_at: string | null;
  tenant_activated_at: string | null;
  created_at: string;
  expires_at: string | null;
};

export function ContractsList() {
  const [items, setItems] = useState<ServerContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    loadContracts();
  }, []);

  // Auto-refresh: lettura leggera dal DB (no sync-all, che interroga Documenso
  // per ogni contratto). Il webhook aggiorna il DB; qui basta rileggerlo.
  useEffect(() => {
    const interval = setInterval(refreshContracts, 25_000);
    window.addEventListener("focus", refreshContracts);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshContracts);
    };
  }, []);

  async function refreshContracts() {
    try {
      const res = await fetch("/api/admin/contracts", { cache: "no-store" });
      if (!res.ok) return;
      const { contracts } = (await res.json()) as { contracts: ServerContract[] };
      setItems(contracts ?? []);
      window.dispatchEvent(new Event("contracts:refresh"));
    } catch {
      // ignora errori transitori di rete
    }
  }

  function loadContracts() {
    setLoading(true);
    fetch("/api/admin/contracts/sync-all", { method: "POST" })
      .catch(() => {})
      .finally(() => {
        fetch("/api/admin/contracts", { cache: "no-store" })
          .then(async (res) => {
            if (!res.ok) return;
            const { contracts } = (await res.json()) as { contracts: ServerContract[] };
            setItems(contracts ?? []);
            window.dispatchEvent(new Event("contracts:refresh"));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      });
  }

  function handleDelete(id: string, status: string) {
    const isDraft = status === "draft";
    const msg = isDraft
      ? "Eliminare definitivamente questo contratto?"
      : "Annullare il contratto? Verrà cancellato il link di firma e il contratto sarà archiviato come annullato.";
    if (!window.confirm(msg)) return;
    fetch(`/api/admin/contracts?id=${id}`, { method: "DELETE" })
      .then((res) => { if (res.ok) loadContracts(); });
    setOpenDropdown(null);
  }

  function toggleDropdown(id: string) {
    setOpenDropdown((prev) => (prev === id ? null : id));
  }

  function copyToClipboard(url: string | null | undefined) {
    if (!url) return;
    navigator.clipboard.writeText(url);
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 12px" }}>
      <style>{`.dropdown-item:hover { background: #f3f4f6; } .dropdown-item-danger:hover { background: #fef2f2; }`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Storico contratti</h1>
          <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>
            {items.length} contratti registrati
          </p>
        </div>
        <Link
          href="/admin/contratti/nuovo"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          <Plus size={14} /> Nuovo contratto
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            border: "1px dashed #d1d5db",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <FileText size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
          <div>Nessun contratto in archivio. Inizia creandone uno nuovo.</div>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
            <thead style={{ background: "#f9fafb", textAlign: "left" }}>
              <tr>
                <th style={th}>Numero</th>
                <th style={th}>Brand</th>
                <th style={th}>Cliente</th>
                <th style={th}>Piano</th>
                <th style={th}>Canone</th>
                <th style={th}>Stato</th>
                <th style={th}>Pagamento</th>
                <th style={th}>Data</th>
                <th style={{ ...th, textAlign: "right" }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const d = c.contract_data;
                const annuale = d.economiche.cicloFatturazione === "yearly";
                const tot = annuale
                  ? computeYearlyTotal(d.economiche.canoneMensile, d.economiche.scontoAnnuale)
                  : d.economiche.canoneMensile;
                const isOverdue =
                  c.status === "sent" && c.expires_at && new Date(c.expires_at) < new Date();
                const brandKey = (d.brand ?? "menuary") as ContractBrand;
                return (
                  <tr key={c.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={td}>
                      <strong>{c.numero}</strong>
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          background:
                            brandKey === "orpheo"
                              ? "#fae8ff"
                              : brandKey === "bizery"
                                ? "#dbeafe"
                                : "#fef3c7",
                          color:
                            brandKey === "orpheo"
                              ? "#86198f"
                              : brandKey === "bizery"
                                ? "#1e40af"
                                : "#92400e",
                        }}
                      >
                        {BRAND_INFO[brandKey].label}
                      </span>
                    </td>
                    <td style={td}>{d.cliente.ragioneSociale || "—"}</td>
                    <td style={td}>{d.servizio.pianoNome}</td>
                    <td style={td}>
                      {formatEUR(tot)}
                      <span style={{ color: "#6b7280", fontSize: 11 }}>
                        {" "}
                        / {annuale ? "anno" : "mese"}
                      </span>
                    </td>
                    <td style={td}>
                      <span
                        className={CONTRACT_STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-700"}
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {CONTRACT_STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      {isOverdue && (
                        <span style={{ display: "block", fontSize: 10, color: "#dc2626", marginTop: 2 }}>
                          Scaduto
                        </span>
                      )}
                      {c.status === "sent" && d.opened_at && (
                        <span style={{ display: "block", fontSize: 10, color: "#2563eb", marginTop: 2 }}>
                          Aperto dal cliente
                        </span>
                      )}
                    </td>
                    <td style={td}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 600,
                        background: c.payment_status === "paid" ? "#ecfdf5" : "#f3f4f6",
                        color: c.payment_status === "paid" ? "#065f46" : "#6b7280",
                      }}>
                        {c.payment_status === "paid" ? "Pagato" : "In attesa"}
                      </span>
                    </td>
                    <td style={td}>{new Date(c.created_at).toLocaleDateString("it-IT")}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
                        <button
                          type="button"
                          onClick={() => toggleDropdown(c.id)}
                          style={iconBtn}
                          title="Azioni"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {openDropdown === c.id && (
                          <div style={dropdownMenuStyle}>
                            <Link href={`/admin/contratti/${c.id}`} className="dropdown-item" style={dropdownItemStyle}>
                              <ExternalLink size={13} /> Apri contratto
                            </Link>
                            {c.status === "draft" && (
                              <Link href={`/admin/contratti/${c.id}#send`} className="dropdown-item" style={dropdownItemStyle}>
                                <Send size={13} /> Invia per firma
                              </Link>
                            )}
                            {c.status === "sent" && c.signing_url && (
                              <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => { copyToClipboard(c.signing_url); setOpenDropdown(null); }}
                                style={dropdownItemStyle}
                              >
                                <Copy size={13} /> Copia link firma
                              </button>
                            )}
                            <div style={dropdownDividerStyle} />
                            <button
                              type="button"
                              className="dropdown-item-danger"
                              onClick={() => handleDelete(c.id, c.status)}
                              style={{ ...dropdownItemStyle, color: "#dc2626" }}
                            >
                              <Trash2 size={13} /> Elimina contratto
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
  fontWeight: 600,
};
const td: React.CSSProperties = { padding: "12px 14px", verticalAlign: "middle" };
const iconBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
  color: "#374151",
  textDecoration: "none",
  cursor: "pointer",
};
const dropdownMenuStyle: React.CSSProperties = {
  position: "absolute",
  right: 0,
  top: "100%",
  marginTop: 4,
  zIndex: 50,
  minWidth: 200,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  padding: "4px 0",
};
const dropdownItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 12px",
  border: "none",
  background: "none",
  fontSize: 13,
  color: "#374151",
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
  boxSizing: "border-box",
};
const dropdownDividerStyle: React.CSSProperties = {
  height: 1,
  background: "#e5e7eb",
  margin: "4px 0",
};
