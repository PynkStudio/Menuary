"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useDemoSteps } from "./use-demo-steps";

type Change = {
  id: "soldout" | "price";
  action: string;
  item: string;
  before: string;
  after: string;
};

const CHANGES: Change[] = [
  { id: "soldout", action: "Tartare esaurita", item: "Tartare di manzo", before: "Disponibile", after: "Non disponibile" },
  { id: "price", action: "Margherita a 9 €", item: "Pizza Margherita", before: "8,00 €", after: "9,00 €" },
];

const CHANNELS: { name: string; group: "Canali Menuary" | "Delivery collegati" }[] = [
  { name: "Sito del ristorante", group: "Canali Menuary" },
  { name: "Menu QR al tavolo", group: "Canali Menuary" },
  { name: "Kiosk", group: "Canali Menuary" },
  { name: "Asporto online", group: "Canali Menuary" },
  { name: "Assistente telefonico", group: "Canali Menuary" },
  { name: "Deliveroo", group: "Delivery collegati" },
  { name: "Just Eat", group: "Delivery collegati" },
  { name: "Uber Eats", group: "Delivery collegati" },
  { name: "Glovo", group: "Delivery collegati" },
];

/**
 * Una modifica nel pannello e la propagazione ai canali. In `interactive` il
 * visitatore sceglie la modifica; altrimenti la demo alterna le due da sola.
 */
export function MenuSyncDemo({ interactive = false }: { interactive?: boolean }) {
  const [selected, setSelected] = useState<Change["id"]>("soldout");
  const [run, setRun] = useState(0);
  const { ref, step } = useDemoSteps<HTMLDivElement>(CHANNELS.length + 2, {
    interval: [1100, 450],
    holdLast: 2600,
    loop: !interactive,
    resetKey: `${selected}-${run}`,
  });

  // In autoplay, a fine giro (ultimo passo → 0) passa all'altra modifica.
  const previousStep = useRef(step);
  useEffect(() => {
    if (!interactive && step === 0 && previousStep.current > 0) {
      setSelected((current) => (current === "soldout" ? "price" : "soldout"));
    }
    previousStep.current = step;
  }, [step, interactive]);

  const change = CHANGES.find((c) => c.id === selected) ?? CHANGES[0];
  const saved = step >= 1;
  const updated = Math.max(0, step - 1);

  return (
    <div ref={ref} className="menuary-demo-surface grid md:grid-cols-[0.85fr_1.15fr]">
      <div className="flex flex-col gap-4 border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-5 md:border-b-0 md:border-r">
        <p className="menuary-demo-eyebrow">Pannello Menuary · Menu</p>
        {interactive ? (
          <div className="flex flex-wrap gap-2">
            {CHANGES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelected(c.id);
                  setRun((n) => n + 1);
                }}
                className={
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors " +
                  (c.id === selected
                    ? "border-[var(--menuary-copper)] bg-[var(--menuary-copper)] text-white"
                    : "border-[var(--menuary-line)] bg-white text-[var(--menuary-ink)] hover:border-[var(--menuary-ink)]")
                }
              >
                {c.action}
              </button>
            ))}
          </div>
        ) : null}
        <div className="rounded-xl border border-[var(--menuary-line)] bg-white p-4">
          <p className="menuary-display text-lg">{change.item}</p>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--menuary-muted)]">{change.id === "price" ? "Prezzo" : "Disponibilità"}</span>
            <span
              className={
                "menuary-demo-chip transition-colors duration-500 " +
                (saved
                  ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                  : "bg-[rgba(135,146,118,0.2)] text-[#4d5b43]")
              }
            >
              {saved ? change.after : change.before}
            </span>
          </div>
        </div>
        <p className="text-sm leading-6 text-[var(--menuary-muted)]">
          {saved ? "Salvato una volta. Menuary aggiorna i canali collegati." : "Una sola modifica, nel pannello."}
        </p>
      </div>

      <ul className="min-w-0 divide-y divide-[var(--menuary-line)] p-2" aria-live="polite">
        {CHANNELS.map((channel, index) => {
          const done = index < updated;
          const syncing = index === updated && saved && step < CHANNELS.length + 1;
          const showGroup = index === 0 || CHANNELS[index - 1]?.group !== channel.group;
          return (
            <li key={channel.name}>
              {showGroup ? <p className="menuary-demo-eyebrow px-3 pb-1 pt-3">{channel.group}</p> : null}
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0 truncate text-[13px] text-[var(--menuary-ink)]">{channel.name}</span>
                <span
                  className={
                    "inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold tabular-nums transition-colors " +
                    (done ? "text-[#4d5b43]" : "text-[var(--menuary-muted)]")
                  }
                >
                  {syncing ? <Loader2 size={12} className="animate-spin" /> : null}
                  {done ? <Check size={12} strokeWidth={2.6} /> : null}
                  {done ? change.after : change.before}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
