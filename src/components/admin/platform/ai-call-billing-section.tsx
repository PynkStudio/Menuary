"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import type { OrderCancellationRow, TenantCallBilling } from "@/lib/retell/call-billing";

// Causali scritte dal locale nel pannello ordini (codici in lib/orders/cancellation.ts).
const REASON_LABELS: Record<string, string> = {
  fuori_area: "Fuori area di consegna",
  ordine_finto: "Ordine finto",
  prodotti_esauriti: "Prodotti esauriti",
  richiesta_cliente: "Richiesta del cliente",
  altro: "Altro",
};

type Response = {
  month: string;
  names?: Record<string, string>;
  tenants: TenantCallBilling[];
  cancellations: OrderCancellationRow[];
};

function eur(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function romeMonth(offset: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 15));
  return d.toISOString().slice(0, 7);
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
}

export function AiCallBillingSection() {
  const [month, setMonth] = useState(() => romeMonth(0));
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetch(`/api/admin/ai-phone/call-billing?month=${month}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as Response;
      })
      .then((json) => active && setData(json))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [month]);

  const name = (id: string) => data?.names?.[id] ?? id;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="headline text-2xl">Chiamate IA · Costo mensile</h2>
          <p className="text-sm text-pork-ink/50">
            Una chiamata non si addebita se tutti i suoi ordini sono stati annullati dal locale.
          </p>
        </div>
        <div className="flex gap-2">
          {[0, -1, -2].map((offset) => {
            const value = romeMonth(offset);
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMonth(value)}
                className={
                  value === month
                    ? "rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-white"
                    : "rounded-full bg-white px-3 py-1.5 text-xs font-bold text-pork-ink/70 ring-1 ring-pork-ink/10"
                }
              >
                {monthLabel(value)}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-pork-ink/40 ring-1 ring-pork-ink/10">Caricamento…</div>
      )}
      {!loading && error && (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-red-600 ring-1 ring-pork-ink/10">
          Errore nel caricamento delle chiamate.
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-pork-ink/10">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-pork-ink/40">
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3 text-right">Chiamate</th>
                  <th className="px-4 py-3 text-right">Escluse</th>
                  <th className="px-4 py-3 text-right">Fatturabili</th>
                  <th className="px-4 py-3 text-right">Importo</th>
                </tr>
              </thead>
              <tbody>
                {data.tenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-pork-ink/50">
                      Nessuna chiamata in {monthLabel(data.month)}.
                    </td>
                  </tr>
                )}
                {data.tenants.map((t) => (
                  <tr key={t.tenantId} className="border-t border-pork-ink/5">
                    <td className="px-4 py-3 font-bold">
                      <span className="inline-flex items-center gap-2">
                        <Phone size={14} className="text-pork-ink/40" />
                        {name(t.tenantId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{t.calls}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{t.excludedCalls}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{t.billableCalls}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{eur(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-pork-ink/50">
              Ordini annullati dal locale · {data.cancellations.length}
            </h3>
            {data.cancellations.length === 0 ? (
              <p className="text-sm text-pork-ink/50">Nessun annullamento nel mese.</p>
            ) : (
              <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-pork-ink/10">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-pork-ink/40">
                      <th className="px-4 py-3">Quando</th>
                      <th className="px-4 py-3">Tenant</th>
                      <th className="px-4 py-3">Ordine</th>
                      <th className="px-4 py-3">Causale</th>
                      <th className="px-4 py-3">Nota</th>
                      <th className="px-4 py-3 text-right">Totale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cancellations.map((c) => (
                      <tr key={c.id} className="border-t border-pork-ink/5 align-top">
                        <td className="px-4 py-3 whitespace-nowrap text-pork-ink/60">
                          {new Date(c.cancelledAt).toLocaleString("it-IT", {
                            timeZone: "Europe/Rome",
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">{name(c.tenantId)}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {c.code} · {c.source}
                          {c.retellCallId ? "" : c.source === "retell" ? " · chiamata non collegata" : ""}
                        </td>
                        <td className="px-4 py-3">{c.reason ? REASON_LABELS[c.reason] ?? c.reason : "—"}</td>
                        <td className="px-4 py-3 text-pork-ink/70">{c.note ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{eur(c.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
