"use client";

import { useState } from "react";
import type { SharedRestaurantRecord } from "@/lib/clients-types";

export function ClientsRestaurantDataTable({ rows }: { rows: SharedRestaurantRecord[] }) {
  const [pending, setPending] = useState<Record<string, boolean>>({});

  function requestRemoval(tenantId: string) {
    setPending((p) => ({ ...p, [tenantId]: true }));
    // TODO: POST /api/clients/data-removal-request { tenantId }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--menuary-line)] bg-white">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="border-b border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] text-xs uppercase tracking-wide text-[var(--menuary-muted)]">
          <tr>
            <th className="px-4 py-3">Ristorante</th>
            <th className="px-4 py-3">Città</th>
            <th className="px-4 py-3">Dati condivisi dal</th>
            <th className="px-4 py-3">Marketing locale</th>
            <th className="px-4 py-3">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.tenantId} className="border-b border-[var(--menuary-line)] last:border-0">
              <td className="px-4 py-3 font-bold">{r.displayName}</td>
              <td className="px-4 py-3">{r.city}</td>
              <td className="px-4 py-3">{r.sharedSince}</td>
              <td className="px-4 py-3">{r.marketingConsentGranted ? "Sì" : "No"}</td>
              <td className="px-4 py-3">
                {r.removalRequestedAt ? (
                  <span className="text-xs text-[var(--menuary-muted)]">Richiesta in elaborazione</span>
                ) : pending[r.tenantId] ? (
                  <span className="text-xs text-[var(--menuary-sage)]">Richiesta registrata (TODO anonimizzazione)</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => requestRemoval(r.tenantId)}
                    className="text-xs font-bold text-[var(--menuary-copper)] underline"
                  >
                    Richiedi rimozione dati
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
