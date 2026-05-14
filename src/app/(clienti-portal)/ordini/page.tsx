import type { Metadata } from "next";
import { MOCK_ORDERS } from "@/lib/clients-mock-data";

export const metadata: Metadata = {
  title: "I tuoi ordini",
};

function formatEur(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function ClientiOrdiniPage() {
  return (
    <div>
      <p className="menuary-section-label">Storico</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">I tuoi ordini</h1>
      <p className="mt-3 max-w-2xl text-[var(--menuary-muted)]">
        Ordini effettuati tramite i siti dei locali collegati al tuo account. Dettaglio e scontrino
        saranno collegati a Supabase.
      </p>
      <ul className="mt-10 space-y-6">
        {MOCK_ORDERS.map((o) => (
          <li key={o.id} className="menuary-card rounded-2xl p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--menuary-copper)]">
                  {o.channel}
                </p>
                <h2 className="menuary-display mt-1 text-xl">{o.restaurantName}</h2>
                <p className="text-sm text-[var(--menuary-muted)]">{formatWhen(o.placedAt)}</p>
              </div>
              <p className="text-lg font-bold">{formatEur(o.totalEur)}</p>
            </div>
            <ul className="mt-4 space-y-1 border-t border-[var(--menuary-line)] pt-4 text-sm text-[var(--menuary-muted)]">
              {o.lines.map((l) => (
                <li key={l.label}>
                  {l.qty}× {l.label} — {formatEur(l.unitPriceEur * l.qty)}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[var(--menuary-muted)]">Riferimento ordine: {o.id}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
