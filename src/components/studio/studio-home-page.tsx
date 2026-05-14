import Link from "next/link";
import { studioSite } from "@/lib/studio-config";
import { MOCK_STUDIO_SUBSCRIPTION } from "@/lib/studio-mock-data";

function formatEur(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(new Date(iso));
}

const CARDS = [
  {
    title: "Dati di fatturazione",
    body: "Ragione sociale, P.IVA, SDI, PEC e indirizzo per le fatture del servizio.",
    href: studioSite.paths.billing,
  },
  {
    title: "Pagamenti",
    body: "Bonifico SEPA oggi; carta e addebito automatico con Stripe in arrivo.",
    href: studioSite.paths.payments,
  },
  {
    title: "Recesso",
    body: "Condizioni e richiesta di disdetta del servizio.",
    href: studioSite.paths.recesso,
  },
] as const;

export function StudioHomePage() {
  const sub = MOCK_STUDIO_SUBSCRIPTION;

  return (
    <div>
      <p className="menuary-section-label">Abbonamento</p>
      <h1 className="menuary-display mt-4 text-[clamp(2rem,5vw,3.2rem)]">Il tuo servizio Menuary</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--menuary-muted)]">
        Panoramica piano attivo, importi e prossimo rinnovo. Per modifiche contrattuali scrivi a{" "}
        <a href="mailto:hello@menuary.it" className="menuary-link text-base">
          hello@menuary.it
        </a>
        .
      </p>

      <div className="menuary-card mt-10 max-w-xl rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--menuary-copper)]">
          Piano attuale
        </p>
        <h2 className="menuary-display mt-2 text-2xl">{sub.planLabel}</h2>
        <dl className="mt-4 space-y-2 text-sm text-[var(--menuary-muted)]">
          <div className="flex justify-between gap-4">
            <dt>Ciclo</dt>
            <dd className="font-semibold text-[var(--menuary-ink)]">{sub.billingCycle}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Importo</dt>
            <dd className="font-semibold text-[var(--menuary-ink)]">{formatEur(sub.amountEur)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Prossimo rinnovo</dt>
            <dd className="font-semibold text-[var(--menuary-ink)]">{formatDate(sub.nextRenewalIso)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="menuary-card block rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
          >
            <h2 className="menuary-display text-xl">{c.title}</h2>
            <p className="mt-3 text-sm text-[var(--menuary-muted)]">{c.body}</p>
            <span className="menuary-link mt-5 inline-flex text-sm">Apri →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
