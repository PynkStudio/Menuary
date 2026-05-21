"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Download, Trash2, ExternalLink } from "lucide-react";
import {
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  deleteContract,
  listContracts,
  type StoredContract,
} from "@/lib/contracts/contracts-store";
import { formatEUR, computeYearlyTotal } from "@/lib/contracts/menuary-contract";

export function ContractsList() {
  const [items, setItems] = useState<StoredContract[]>([]);

  useEffect(() => {
    setItems(listContracts());
  }, []);

  function refresh() {
    setItems(listContracts());
  }

  function handleDelete(id: string) {
    if (!window.confirm("Eliminare definitivamente questo contratto?")) return;
    deleteContract(id);
    refresh();
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
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
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#f9fafb", textAlign: "left" }}>
              <tr>
                <th style={th}>Numero</th>
                <th style={th}>Cliente</th>
                <th style={th}>Piano</th>
                <th style={th}>Canone</th>
                <th style={th}>Stato</th>
                <th style={th}>Data</th>
                <th style={th}>Scadenza firma</th>
                <th style={{ ...th, textAlign: "right" }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const annuale = c.data.economiche.cicloFatturazione === "yearly";
                const tot = annuale
                  ? computeYearlyTotal(c.data.economiche.canoneMensile, c.data.economiche.scontoAnnuale)
                  : c.data.economiche.canoneMensile;
                const isOverdue =
                  c.status === "sent" && c.expiresAt && new Date(c.expiresAt) < new Date();
                return (
                  <tr key={c.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={td}>
                      <strong>{c.numero}</strong>
                    </td>
                    <td style={td}>{c.data.cliente.ragioneSociale || "—"}</td>
                    <td style={td}>{c.data.servizio.pianoNome}</td>
                    <td style={td}>
                      {formatEUR(tot)}
                      <span style={{ color: "#6b7280", fontSize: 11 }}>
                        {" "}
                        / {annuale ? "anno" : "mese"}
                      </span>
                    </td>
                    <td style={td}>
                      <span
                        className={CONTRACT_STATUS_COLORS[c.status]}
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {CONTRACT_STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td style={td}>{new Date(c.createdAt).toLocaleDateString("it-IT")}</td>
                    <td style={{ ...td, color: isOverdue ? "#dc2626" : "#6b7280" }}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("it-IT") : "—"}
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <Link href={`/admin/contratti/${c.id}`} style={iconBtn} title="Apri">
                          <ExternalLink size={14} />
                        </Link>
                        {c.signedFileDataUrl && (
                          <a
                            href={c.signedFileDataUrl}
                            download={c.signedFileName ?? "contratto.pdf"}
                            style={iconBtn}
                            title="Scarica controfirmato"
                          >
                            <Download size={14} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          style={{ ...iconBtn, color: "#dc2626" }}
                          title="Elimina"
                        >
                          <Trash2 size={14} />
                        </button>
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
