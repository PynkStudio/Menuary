"use client";

import { useState } from "react";

export function BizeryStudioRecessoPanel() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="rounded-2xl bg-white p-6 text-sm leading-relaxed text-[var(--bs-muted)] shadow-sm ring-1 ring-black/5">
        <h2
          className="text-xl font-medium tracking-[-0.02em] text-[var(--bs-ink)]"
          style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
        >
          Disdetta del servizio
        </h2>
        <p className="mt-4">
          Il recesso è regolato dal contratto di servizio sottoscritto con Bizery (preavviso,
          effetti su dati e pubblicazione del sito). L&apos;invio della richiesta non sospende
          automaticamente la fatturazione: riceverai conferma dall&apos;ufficio amministrativo.
        </p>
        <p className="mt-4">
          Dopo la cessazione, i dati dei clienti finali saranno trattati secondo le informative
          privacy aggiornate; le fatture emesse restano archiviate per obblighi di legge.
        </p>
      </section>

      <form
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <label className="block text-sm font-bold">
          Motivazione (facoltativa)
          <textarea
            name="reason"
            rows={4}
            className="mt-2 w-full rounded-xl border border-[var(--bs-line)] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--bs-accent)]/30"
            placeholder="Es. chiusura attività, cambio fornitore…"
          />
        </label>
        <label className="mt-5 flex items-start gap-3 text-sm">
          <input type="checkbox" required className="mt-1" />
          <span>
            Dichiaro di aver preso visione delle condizioni di recesso e di voler avviare la
            procedura di disdetta per l&apos;attività indicata in anagrafica.
          </span>
        </label>
        <button
          type="submit"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--bs-ink)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 active:scale-95"
        >
          Invia richiesta di recesso
        </button>
        {sent && (
          <p className="mt-4 text-sm text-[var(--bs-success)]" role="status">
            (Demo) Richiesta registrata. Collegamento a ticketing / email in produzione.
          </p>
        )}
      </form>
    </div>
  );
}
