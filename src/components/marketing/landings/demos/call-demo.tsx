"use client";

import { useState } from "react";
import { CalendarCheck, Check, PhoneIncoming, Search } from "lucide-react";
import { useDemoSteps } from "./use-demo-steps";

type CallLanguage = "it" | "en" | "de" | "fr";

type CallScript = {
  label: string;
  caller: string;
  lines: { who: "caller" | "ai"; text: string }[];
  note: string;
};

const SCRIPTS: Record<CallLanguage, CallScript> = {
  it: {
    label: "Italiano",
    caller: "Rossi",
    note: "1 ospite celiaco",
    lines: [
      { who: "caller", text: "Buonasera, avete un tavolo per quattro domani alle 21?" },
      { who: "ai", text: "Buonasera! Controllo subito… Sì, domani alle 21 ho un tavolo per quattro in sala. A che nome lo segno?" },
      { who: "caller", text: "Rossi. Uno di noi è celiaco." },
      { who: "ai", text: "Perfetto, lo annoto per la cucina. Le mando il riepilogo su WhatsApp." },
    ],
  },
  en: {
    label: "English",
    caller: "Miller",
    note: "1 ospite senza glutine",
    lines: [
      { who: "caller", text: "Hi, do you have a table for four tomorrow at 9 pm?" },
      { who: "ai", text: "Good evening! Let me check… Yes, I have a table for four at 9 pm. What name should I put it under?" },
      { who: "caller", text: "Miller. One of us is gluten-free." },
      { who: "ai", text: "Noted for the kitchen. You'll get a summary on WhatsApp." },
    ],
  },
  de: {
    label: "Deutsch",
    caller: "Schneider",
    note: "1 ospite senza glutine",
    lines: [
      { who: "caller", text: "Guten Abend, haben Sie morgen um 21 Uhr einen Tisch für vier?" },
      { who: "ai", text: "Guten Abend! Einen Moment… Ja, morgen um 21 Uhr habe ich einen Tisch für vier. Auf welchen Namen?" },
      { who: "caller", text: "Schneider. Einer von uns verträgt kein Gluten." },
      { who: "ai", text: "Ist für die Küche notiert. Die Zusammenfassung kommt per WhatsApp." },
    ],
  },
  fr: {
    label: "Français",
    caller: "Martin",
    note: "1 ospite celiaco",
    lines: [
      { who: "caller", text: "Bonsoir, vous avez une table pour quatre demain à 21 h ?" },
      { who: "ai", text: "Bonsoir ! Je vérifie… Oui, j'ai une table pour quatre demain à 21 h. À quel nom ?" },
      { who: "caller", text: "Martin. L'un de nous est cœliaque." },
      { who: "ai", text: "C'est noté pour la cuisine. Vous recevrez le récapitulatif sur WhatsApp." },
    ],
  },
};

// 0 squillo · 1-2 domanda/verifica · 3-5 conversazione · 6 prenotazione registrata
const TOTAL_STEPS = 7;
const TIMINGS = [1600, 1500, 1700, 2200, 1700, 2000] as const;

export function CallDemo({ languages = ["it"] }: { languages?: CallLanguage[] }) {
  const [language, setLanguage] = useState<CallLanguage>(languages[0] ?? "it");
  const { ref, step } = useDemoSteps<HTMLDivElement>(TOTAL_STEPS, {
    interval: TIMINGS,
    holdLast: 4200,
    resetKey: language,
  });
  const script = SCRIPTS[language];
  const visibleLines = step === 0 ? 0 : step === 1 ? 1 : Math.min(script.lines.length, step - 1);
  const checking = step === 2;

  return (
    <div ref={ref}>
      {languages.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Lingua della chiamata">
          {languages.map((code) => (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={code === language}
              onClick={() => setLanguage(code)}
              className={
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors " +
                (code === language
                  ? "border-[var(--menuary-ink)] bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                  : "border-[var(--menuary-line)] bg-[var(--menuary-paper)] text-[var(--menuary-ink)] hover:border-[var(--menuary-ink)]")
              }
            >
              {SCRIPTS[code].label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="menuary-demo-surface" data-tone="dark">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--menuary-copper)] text-white">
              {step === 0 ? <span className="menuary-demo-ring" aria-hidden /> : null}
              <PhoneIncoming size={16} strokeWidth={1.8} />
            </span>
            <div>
              <p className="menuary-demo-eyebrow">{step === 0 ? "Chiamata in arrivo" : "Assistente Menuary · in linea"}</p>
              <p className="text-sm font-semibold">+39 333 ••• 4821</p>
            </div>
          </div>
          <span className="menuary-demo-chip bg-white/10 text-white/80">{script.label}</span>
        </div>

        <div className="flex h-[19.5rem] flex-col justify-end gap-2.5 overflow-hidden px-5 py-5" aria-live="polite">
          {script.lines.slice(0, visibleLines).map((line, index) => (
            <p
              key={`${language}-${index}`}
              className={
                "menuary-demo-bubble menuary-demo-in " +
                (line.who === "caller"
                  ? "self-start bg-white/10 text-white"
                  : "self-end bg-[var(--menuary-paper)] text-[var(--menuary-ink)]")
              }
            >
              {line.text}
            </p>
          ))}
          {checking ? (
            <p className="menuary-demo-in inline-flex items-center gap-2 self-end text-xs text-white/60">
              <Search size={12} strokeWidth={2} />
              Verifica disponibilità · domani 21:00 · 4 persone
            </p>
          ) : null}
          {step === 0 ? (
            <p className="m-auto text-sm text-white/50">Il personale è in sala. Risponde Menuary.</p>
          ) : null}
        </div>

        <div
          className={
            "border-t border-white/10 bg-[var(--menuary-paper)] px-5 py-4 text-[var(--menuary-ink)] transition-opacity duration-500 " +
            (step >= TOTAL_STEPS - 1 ? "opacity-100" : "opacity-30")
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <CalendarCheck size={18} strokeWidth={1.7} className="mt-0.5 text-[var(--menuary-copper)]" />
              <div>
                <p className="menuary-demo-eyebrow">Nuova prenotazione · Menuary</p>
                <p className="mt-1 text-sm font-semibold">
                  {script.caller} · 4 persone · domani 21:00
                </p>
                <p className="mt-0.5 text-xs text-[var(--menuary-muted)]">Note: {script.note}</p>
              </div>
            </div>
            <span className="menuary-demo-chip shrink-0 bg-[rgba(135,146,118,0.2)] text-[#4d5b43]">
              {step >= TOTAL_STEPS - 1 ? <Check size={11} strokeWidth={2.4} /> : null}
              Da confermare
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
