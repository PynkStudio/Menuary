"use client";

import { Check, ShoppingBag, Sparkles } from "lucide-react";
import { useDemoSteps } from "./use-demo-steps";

type Line = { who: "guest" | "ai"; text: string; suggestions?: { name: string; price: string; why: string }[] };

const LINES: Line[] = [
  { who: "guest", text: "Non mangio carne e vorrei spendere circa 30 euro. Cosa mi consigli?" },
  {
    who: "ai",
    text: "Ti propongo due piatti senza carne:",
    suggestions: [
      { name: "Risotto ai porcini", price: "16 €", why: "cremoso, con porcini freschi" },
      { name: "Parmigiana di melanzane", price: "12 €", why: "vegetariana, al forno" },
    ],
  },
  { who: "guest", text: "Prendo il risotto." },
  { who: "ai", text: "Ottima scelta. Con il risotto sta bene un calice di Soave: fresco, non copre i porcini. Te lo aggiungo?" },
  { who: "guest", text: "Sì, grazie." },
];

// passo n = n messaggi visibili; poi carrello aggiornato e ordine inviato
const TOTAL_STEPS = LINES.length + 2;

export function SelfOrderDemo() {
  const { ref, step } = useDemoSteps<HTMLDivElement>(TOTAL_STEPS, {
    interval: [1400, 2400, 1500, 2600, 1400, 1800],
    holdLast: 4200,
  });
  const visible = Math.min(step, LINES.length);
  const cart = [
    step >= 3 ? { name: "Risotto ai porcini", price: 16 } : null,
    step >= 5 ? { name: "Calice di Soave", price: 6 } : null,
  ].filter(Boolean) as { name: string; price: number }[];
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const sent = step >= TOTAL_STEPS - 1;

  return (
    <div ref={ref} className="menuary-demo-surface grid md:grid-cols-[1.25fr_0.75fr]">
      <div className="flex min-h-[23rem] flex-col gap-2.5 p-5" aria-live="polite">
        <p className="menuary-demo-eyebrow">Tavolo 7 · Menu del locale</p>
        {LINES.slice(0, visible).map((line, index) => (
          <div
            key={index}
            className={"menuary-demo-in flex flex-col gap-2 " + (line.who === "guest" ? "items-end" : "items-start")}
          >
            <p
              className={
                "menuary-demo-bubble " +
                (line.who === "guest"
                  ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                  : "border border-[var(--menuary-line)] bg-[var(--menuary-paper)] text-[var(--menuary-ink)]")
              }
            >
              {line.text}
            </p>
            {line.suggestions ? (
              <div className="grid w-[88%] gap-2">
                {line.suggestions.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--menuary-line)] bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--menuary-ink)]">{item.name}</p>
                      <p className="text-xs text-[var(--menuary-muted)]">{item.why}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--menuary-copper)]">{item.price}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <aside className="flex flex-col border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-5 md:border-l md:border-t-0">
        <p className="menuary-demo-eyebrow inline-flex items-center gap-2">
          <ShoppingBag size={12} strokeWidth={2} />
          Il tuo ordine
        </p>
        <ul className="mt-4 space-y-2">
          {cart.length === 0 ? <li className="text-sm text-[var(--menuary-muted)]">Ancora vuoto</li> : null}
          {cart.map((item) => (
            <li key={item.name} className="menuary-demo-in flex items-center justify-between gap-2 text-sm">
              <span className="text-[var(--menuary-ink)]">{item.name}</span>
              <span className="font-semibold tabular-nums">{item.price} €</span>
            </li>
          ))}
        </ul>
        {step >= 5 ? (
          <p className="menuary-demo-in mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--menuary-copper)]">
            <Sparkles size={12} strokeWidth={2} />
            Abbinamento consigliato
          </p>
        ) : null}
        <div className="mt-auto pt-6">
          <div className="flex items-baseline justify-between border-t border-[var(--menuary-line)] pt-3">
            <span className="text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Totale</span>
            <span className="menuary-display text-2xl tabular-nums">{total} €</span>
          </div>
          <p
            className={
              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-500 " +
              (sent
                ? "bg-[var(--menuary-sage)] text-white"
                : "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]")
            }
          >
            {sent ? (
              <>
                <Check size={14} strokeWidth={2.4} />
                Inviato in cucina
              </>
            ) : (
              "Invia ordine"
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}

const COMPARISON = {
  classic: ["Menu", "Scegli", "Ordina"],
  menuary: ["Parla", "Scopri", "Ricevi consigli", "Scegli", "Ordina"],
};

export function SelfOrderComparison() {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-6">
        <p className="menuary-demo-eyebrow">Self ordering tradizionale</p>
        <FlowRow steps={COMPARISON.classic} />
        <p className="mt-5 text-sm leading-6 text-[var(--menuary-muted)]">
          Il cliente scorre una lista e sceglie da solo.
        </p>
      </div>
      <div className="rounded-2xl border border-[var(--menuary-ink)] bg-[var(--menuary-porcelain)] p-6">
        <p className="menuary-demo-eyebrow">Con Menuary</p>
        <FlowRow steps={COMPARISON.menuary} accent />
        <div className="mt-5 space-y-2">
          <p className="menuary-demo-bubble ml-auto bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
            I&apos;m vegetarian and I don&apos;t like spicy food. What would you recommend?
          </p>
          <p className="menuary-demo-bubble border border-[var(--menuary-line)] bg-white text-[var(--menuary-ink)]">
            The porcini risotto is a great choice: creamy and not spicy at all. The aubergine parmigiana is vegetarian too.
          </p>
        </div>
      </div>
    </div>
  );
}

function FlowRow({ steps, accent }: { steps: string[]; accent?: boolean }) {
  return (
    <ol className="mt-4 flex flex-wrap items-center gap-2">
      {steps.map((label, index) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={
              "rounded-full px-3 py-1.5 text-sm font-semibold " +
              (accent
                ? "bg-[var(--menuary-copper)] text-white"
                : "border border-[var(--menuary-line)] text-[var(--menuary-ink)]")
            }
          >
            {label}
          </span>
          {index < steps.length - 1 ? <span aria-hidden className="text-[var(--menuary-muted)]">→</span> : null}
        </li>
      ))}
    </ol>
  );
}
