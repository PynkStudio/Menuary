import { headers } from "next/headers";
import type { Metadata } from "next";
import { getPlatformModeFromHost } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Pagamenti",
};

export default async function StudioPagamentiPage() {
  const mode = getPlatformModeFromHost((await headers()).get("host"));

  if (mode === "studio-bizery") {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--bs-accent)]">Incassi</p>
        <h1
          className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
        >
          Pagamenti
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--bs-muted)]">
          Oggi il servizio è fatturato e saldato tramite <strong>bonifico SEPA</strong>. L&apos;integrazione
          con <strong>Stripe</strong> (carta, portale cliente, eventuale addebito automatico) è in
          arrivo: stesso portale, sezione aggiornata senza cambiare URL.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="relative overflow-hidden rounded-2xl bg-white p-6 opacity-85 shadow-sm ring-1 ring-black/5">
            <span className="absolute right-4 top-4 rounded-full bg-[var(--bs-porcelain)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--bs-muted)]">
              In arrivo
            </span>
            <h2
              className="text-xl font-medium tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Stripe
            </h2>
            <p className="mt-3 text-sm text-[var(--bs-muted)]">
              Pagamenti con carta, gestione metodo predefinito, ricevute e rimborsi saranno
              disponibili qui. Nessun dato di carta transiterà sui server del tuo sito: checkout
              ospitato da Stripe (PCI).
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-[var(--bs-muted)]">
              <li>Checkout sicuro e Customer Portal</li>
              <li>Fatture e abbonamenti allineati al contratto</li>
              <li>Notifiche webhook verso il nostro backend</li>
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2
              className="text-xl font-medium tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Bonifico SEPA
            </h2>
            <p className="mt-3 text-sm text-[var(--bs-muted)]">
              Coordinate attuali per il saldo delle fatture. Inserisci sempre la causale indicata in
              fattura per l&apos;abbinamento automatico.
            </p>
            <dl className="mt-6 space-y-3 rounded-xl bg-[var(--bs-porcelain)] p-4 text-sm">
              <div>
                <dt className="font-bold text-[var(--bs-ink)]">Intestatario</dt>
                <dd className="text-[var(--bs-muted)]">Bizery S.r.l. (esempio)</dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--bs-ink)]">IBAN</dt>
                <dd className="font-mono text-[var(--bs-ink)]">IT00 X000 0000 0000 0000 0000 000</dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--bs-ink)]">BIC / SWIFT</dt>
                <dd className="font-mono text-[var(--bs-ink)]">XXXXXXXX</dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--bs-ink)]">Causale</dt>
                <dd className="text-[var(--bs-muted)]">Fattura n. ____ / contratto azienda ____</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-[var(--bs-muted)]">
              Le coordinate definitive saranno quelle riportate in fattura PDF / XML e sincronizzate
              da back-office.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="menuary-section-label">Incassi</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">Pagamenti</h1>
      <p className="mt-3 max-w-2xl text-[var(--menuary-muted)]">
        Oggi il servizio è fatturato e saldato tramite <strong>bonifico SEPA</strong>. L&apos;integrazione
        con <strong>Stripe</strong> (carta, portale cliente, eventuale addebito automatico) è in
        arrivo: stesso portale, sezione aggiornata senza cambiare URL.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="menuary-card relative overflow-hidden rounded-2xl p-6 opacity-85">
          <span className="absolute right-4 top-4 rounded-full bg-[var(--menuary-line)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--menuary-muted)]">
            In arrivo
          </span>
          <h2 className="menuary-display text-xl">Stripe</h2>
          <p className="mt-3 text-sm text-[var(--menuary-muted)]">
            Pagamenti con carta, gestione metodo predefinito, ricevute e rimborsi saranno
            disponibili qui. Nessun dato di carta transiterà sui server del tuo sito: checkout
            ospitato da Stripe (PCI).
          </p>
          <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-[var(--menuary-muted)]">
            <li>Checkout sicuro e Customer Portal</li>
            <li>Fatture e abbonamenti allineati al contratto</li>
            <li>Notifiche webhook verso il nostro backend</li>
          </ul>
        </section>

        <section className="menuary-card rounded-2xl p-6">
          <h2 className="menuary-display text-xl">Bonifico SEPA</h2>
          <p className="mt-3 text-sm text-[var(--menuary-muted)]">
            Coordinate attuali per il saldo delle fatture. Inserisci sempre la causale indicata in
            fattura per l&apos;abbinamento automatico.
          </p>
          <dl className="mt-6 space-y-3 rounded-xl bg-[var(--menuary-porcelain)] p-4 text-sm">
            <div>
              <dt className="font-bold text-[var(--menuary-ink)]">Intestatario</dt>
              <dd className="text-[var(--menuary-muted)]">Menuary S.r.l. (esempio)</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--menuary-ink)]">IBAN</dt>
              <dd className="font-mono text-[var(--menuary-ink)]">IT00 X000 0000 0000 0000 0000 000</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--menuary-ink)]">BIC / SWIFT</dt>
              <dd className="font-mono text-[var(--menuary-ink)]">XXXXXXXX</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--menuary-ink)]">Causale</dt>
              <dd className="text-[var(--menuary-muted)]">Fattura n. ____ / contratto locale ____</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-[var(--menuary-muted)]">
            Le coordinate definitive saranno quelle riportate in fattura PDF / XML e sincronizzate
            da back-office.
          </p>
        </section>
      </div>
    </div>
  );
}
