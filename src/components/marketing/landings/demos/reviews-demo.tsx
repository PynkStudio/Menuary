"use client";

import { ArrowDown, CalendarX, Check, Globe, Star } from "lucide-react";
import { useDemoSteps } from "./use-demo-steps";

const REVIEW = {
  author: "Giulia M.",
  stars: 4,
  text: "Carbonara ottima e personale gentilissimo. Il sabato sera però abbiamo aspettato un po' per il dolce.",
};

const REPLY =
  "Grazie Giulia! Siamo felici che la carbonara ti sia piaciuta. Hai ragione sul sabato: stiamo rinforzando la sala nel weekend. Ti aspettiamo presto!";

/**
 * Recensione Google → pannello Menuary → risposta pubblicata. Con `aiDrafts`
 * la risposta nasce come bozza di Menuary; senza, la scrive il titolare.
 */
export function ReviewsDemo({ aiDrafts }: { aiDrafts: boolean }) {
  const { ref, step } = useDemoSteps<HTMLDivElement>(4, { interval: [1600, 1800, 2600], holdLast: 3800 });
  const typed = step >= 2 ? REPLY : "";
  const published = step >= 3;

  return (
    <div ref={ref} className="grid gap-3">
      <div className="menuary-demo-surface bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="menuary-demo-eyebrow">Google · nuova recensione</p>
          <span className="flex gap-0.5 text-[var(--menuary-copper)]" aria-label={`${REVIEW.stars} stelle su 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={13} strokeWidth={0} fill={i < REVIEW.stars ? "currentColor" : "rgba(24,35,31,0.15)"} />
            ))}
          </span>
        </div>
        <p className="mt-3 text-sm font-semibold text-[var(--menuary-ink)]">{REVIEW.author}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--menuary-ink)]/80">{REVIEW.text}</p>
        {published ? (
          <div className="menuary-demo-in mt-4 border-l-2 border-[var(--menuary-copper)] pl-3">
            <p className="menuary-demo-eyebrow">Risposta del proprietario</p>
            <p className="mt-1 text-sm leading-6 text-[var(--menuary-ink)]/80">{REPLY}</p>
          </div>
        ) : null}
      </div>

      <ArrowDown size={18} className="mx-auto text-[var(--menuary-muted)]" aria-hidden />

      <div className="menuary-demo-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="menuary-demo-eyebrow">Menuary · Google · Recensioni</p>
          <span
            className={
              "menuary-demo-chip " +
              (published ? "bg-[rgba(135,146,118,0.2)] text-[#4d5b43]" : "bg-[rgba(169,95,69,0.12)] text-[var(--menuary-copper)]")
            }
          >
            {published ? (
              <>
                <Check size={11} strokeWidth={2.4} />
                Pubblicata su Google
              </>
            ) : (
              "1 da rispondere"
            )}
          </span>
        </div>
        <div
          className={
            "mt-4 min-h-[6.5rem] rounded-xl border bg-white p-3 text-sm leading-6 transition-colors " +
            (step >= 1 ? "border-[var(--menuary-ink)]" : "border-[var(--menuary-line)]")
          }
        >
          {step >= 1 ? (
            <p className="menuary-demo-eyebrow mb-1">{aiDrafts ? "Bozza proposta da Menuary" : "La tua risposta"}</p>
          ) : null}
          {typed ? (
            <p className="menuary-demo-in text-[var(--menuary-ink)]">{typed}</p>
          ) : step >= 1 ? (
            <span className="menuary-demo-typing text-[var(--menuary-muted)]" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          ) : (
            <p className="text-[var(--menuary-muted)]">Rispondi a {REVIEW.author}…</p>
          )}
        </div>
        <p
          className={
            "mt-3 inline-flex rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-500 " +
            (published ? "bg-[var(--menuary-sage)] text-white" : "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]")
          }
        >
          {published ? "Risposta pubblicata" : aiDrafts ? "Approva e pubblica" : "Pubblica risposta"}
        </p>
      </div>
    </div>
  );
}

const INSIGHTS = [
  { label: "Visualizzazioni", value: "3.412" },
  { label: "Chiamate", value: "128" },
  { label: "Indicazioni", value: "241" },
  { label: "Clic al sito", value: "187" },
];

/** Chiusura straordinaria impostata una volta: sito e Google insieme. */
export function HoursSyncDemo() {
  const { ref, step } = useDemoSteps<HTMLDivElement>(3, { interval: [1500, 1400], holdLast: 4000 });
  const synced = step >= 1;

  return (
    <div ref={ref} className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="menuary-demo-surface p-5">
        <p className="menuary-demo-eyebrow">Menuary · Orari · Chiusure straordinarie</p>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--menuary-line)] bg-white p-4">
          <CalendarX size={18} strokeWidth={1.7} className="text-[var(--menuary-copper)]" />
          <div>
            <p className="text-sm font-semibold">Venerdì 15 agosto · Chiuso</p>
            <p className="text-xs text-[var(--menuary-muted)]">Ferragosto</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {[
            { label: "Sito del ristorante", icon: Globe, ready: synced },
            { label: "Scheda Google", icon: Star, ready: step >= 2 },
          ].map(({ label, icon: Icon, ready }) => (
            <li key={label} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <Icon size={14} strokeWidth={1.8} className="text-[var(--menuary-muted)]" />
                {label}
              </span>
              <span className={"inline-flex items-center gap-1 text-xs font-semibold " + (ready ? "text-[#4d5b43]" : "text-[var(--menuary-muted)]")}>
                {ready ? <Check size={12} strokeWidth={2.6} /> : null}
                {ready ? "Chiuso il 15/08" : "In aggiornamento"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="menuary-demo-surface p-5">
        <p className="menuary-demo-eyebrow">Menuary · La tua scheda Google · ultimi 30 giorni</p>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          {INSIGHTS.map((item) => (
            <div key={item.label} className="rounded-xl border border-[var(--menuary-line)] bg-white p-3">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-[var(--menuary-muted)]">{item.label}</dt>
              <dd className="menuary-display mt-1 text-2xl tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
