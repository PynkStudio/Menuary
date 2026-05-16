import Link from "next/link";
import { bizeryStudioSite } from "@/lib/bizery-studio-config";
import { MOCK_BIZERY_STUDIO_SUBSCRIPTION } from "@/lib/bizery-studio-mock-data";

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
    href: bizeryStudioSite.paths.billing,
  },
  {
    title: "Pagamenti",
    body: "Bonifico SEPA oggi; carta e addebito automatico con Stripe in arrivo.",
    href: bizeryStudioSite.paths.payments,
  },
  {
    title: "Recesso",
    body: "Condizioni e richiesta di disdetta del servizio.",
    href: bizeryStudioSite.paths.recesso,
  },
] as const;

export function BizeryStudioHomePage() {
  const sub = MOCK_BIZERY_STUDIO_SUBSCRIPTION;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--bs-accent)]">Abbonamento</p>
      <h1
        className="mt-4 text-[clamp(2rem,5vw,3.2rem)] font-medium leading-tight tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
      >
        Il tuo servizio Bizery
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--bs-muted)]">
        Panoramica piano attivo, importi e prossimo rinnovo. Per modifiche contrattuali scrivi a{" "}
        <a href="mailto:hello@bizery.it" className="font-semibold text-[var(--bs-accent)] hover:underline">
          hello@bizery.it
        </a>
        .
      </p>

      <div className="mt-10 max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--bs-accent)]">Piano attuale</p>
        <h2
          className="mt-2 text-2xl font-medium tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
        >
          {sub.planLabel}
        </h2>
        <dl className="mt-4 space-y-2 text-sm text-[var(--bs-muted)]">
          <div className="flex justify-between gap-4">
            <dt>Ciclo</dt>
            <dd className="font-semibold text-[var(--bs-ink)]">{sub.billingCycle}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Importo</dt>
            <dd className="font-semibold text-[var(--bs-ink)]">{formatEur(sub.amountEur)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Prossimo rinnovo</dt>
            <dd className="font-semibold text-[var(--bs-ink)]">{formatDate(sub.nextRenewalIso)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
          >
            <h2
              className="text-xl font-medium tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              {c.title}
            </h2>
            <p className="mt-3 text-sm text-[var(--bs-muted)]">{c.body}</p>
            <span className="mt-5 inline-flex text-sm font-semibold text-[var(--bs-accent)] hover:underline">
              Apri →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
