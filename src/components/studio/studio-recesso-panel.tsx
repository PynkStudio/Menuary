"use client";

import { useState } from "react";

export function StudioRecessoPanel() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="menuary-card rounded-2xl p-6 text-sm leading-relaxed text-[var(--menuary-muted)]">
        <h2 className="menuary-display text-xl text-[var(--menuary-ink)]">Disdetta del servizio</h2>
        <p className="mt-4">
          Il recesso è regolato dal contratto di servizio sottoscritto con Menuary (preavviso,
          effetti su dati e pubblicazione del sito). L&apos;invio della richiesta non sospende
          automaticamente la fatturazione: riceverai conferma da ufficio amministrativo.
        </p>
        <p className="mt-4">
          Dopo la cessazione, i dati dei clienti finali saranno trattati secondo le informative
          privacy aggiornate; le fatture emesse restano archiviate per obblighi di legge.
        </p>
      </section>

      <form
        className="menuary-card rounded-2xl p-6"
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
            className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
            placeholder="Es. chiusura attività, cambio fornitore…"
          />
        </label>
        <label className="mt-5 flex items-start gap-3 text-sm">
          <input type="checkbox" required className="mt-1" />
          <span>
            Dichiaro di aver preso visione delle condizioni di recesso e di voler avviare la
            procedura di disdetta per il locale indicato in anagrafica.
          </span>
        </label>
        <button type="submit" className="menuary-button menuary-button-dark mt-6">
          Invia richiesta di recesso
        </button>
        {sent && (
          <p className="mt-4 text-sm text-[var(--menuary-sage)]" role="status">
            (Demo) Richiesta registrata. Collegamento a ticketing / email in produzione.
          </p>
        )}
      </form>
    </div>
  );
}
