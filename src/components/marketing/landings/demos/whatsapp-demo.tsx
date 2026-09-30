"use client";

import { CheckCheck } from "lucide-react";
import { useDemoSteps } from "./use-demo-steps";

type Message = { from: "owner" | "menuary"; text: string; time: string };

const MESSAGES: Message[] = [
  { from: "owner", text: "Quanti coperti abbiamo stasera?", time: "18:02" },
  { from: "menuary", text: "62 coperti confermati su 18 tavoli. Il momento più pieno è tra le 20:30 e le 21:15.", time: "18:02" },
  { from: "owner", text: "Metti la carbonara non disponibile.", time: "18:40" },
  { from: "menuary", text: "Fatto. La carbonara ora risulta non disponibile su sito, QR, kiosk e canali collegati.", time: "18:40" },
  { from: "owner", text: "Chiudi le prenotazioni dalle 20 alle 21.", time: "19:05" },
  { from: "menuary", text: "Vuoi bloccare nuove prenotazioni tra le 20:00 e le 21:00 di oggi? Quelle già confermate restano valide. Rispondi “sì” per confermare.", time: "19:05" },
  { from: "owner", text: "Sì", time: "19:06" },
  { from: "menuary", text: "Fatto: fascia 20:00–21:00 chiusa per oggi.", time: "19:06" },
  { from: "owner", text: "Quanto abbiamo incassato oggi?", time: "23:48" },
  { from: "menuary", text: "Oggi il locale ha registrato 4.280 € di vendite, 312 € in più di martedì scorso.", time: "23:48" },
];

export function WhatsAppDemo() {
  const { ref, step } = useDemoSteps<HTMLDivElement>(MESSAGES.length + 1, { interval: 1500, holdLast: 4500 });
  const shown = MESSAGES.slice(0, step);
  const typing = step < MESSAGES.length && MESSAGES[step]?.from === "menuary";

  return (
    <div ref={ref} className="menuary-demo-surface mx-auto max-w-md">
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--menuary-paper)] text-[var(--menuary-ink)]">
          <span className="menuary-wordmark text-sm">
            m<span className="text-[var(--menuary-copper)]">.</span>
          </span>
        </span>
        <div>
          <p className="text-sm font-semibold">Menuary · Trattoria Da Anna</p>
          <p className="text-[11px] text-white/70">{typing ? "sta scrivendo…" : "online"}</p>
        </div>
      </div>
      <div
        className="flex h-[26rem] flex-col justify-end gap-2 overflow-hidden bg-[#ece5dd] px-3 py-4"
        aria-live="polite"
      >
        {shown.slice(-7).map((message, index) => (
          <div
            key={`${message.time}-${index}-${message.text.slice(0, 8)}`}
            className={
              "menuary-demo-in max-w-[85%] rounded-lg px-3 py-2 text-[13.5px] leading-[1.4] text-[#111b21] shadow-[0_1px_0_rgba(0,0,0,0.08)] " +
              (message.from === "owner" ? "self-end bg-[#d9fdd3]" : "self-start bg-white")
            }
          >
            <p>{message.text}</p>
            <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#667781]">
              {message.time}
              {message.from === "owner" ? <CheckCheck size={12} className="text-[#53bdeb]" /> : null}
            </p>
          </div>
        ))}
        {typing ? (
          <div className="menuary-demo-in self-start rounded-lg bg-white px-3 py-2.5 text-[#667781]">
            <span className="menuary-demo-typing" aria-label="Menuary sta scrivendo">
              <i />
              <i />
              <i />
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const KINDS = [
  {
    kind: "Domande",
    note: "Risposta immediata",
    ask: "Che prenotazioni ci sono domani a pranzo?",
    reply: "5 tavoli, 17 persone. La prima alle 12:30.",
  },
  {
    kind: "Analisi",
    note: "Sui dati di cassa e ordini",
    ask: "Qual è il piatto più venduto della settimana?",
    reply: "La tagliata: 84 porzioni, poi la carbonara con 71.",
  },
  {
    kind: "Modifiche operative",
    note: "Applicate e confermate",
    ask: "Sospendi gli ordini d'asporto per stasera.",
    reply: "Fatto. Riaprono domani all'apertura.",
  },
  {
    kind: "Operazioni sensibili",
    note: "Sempre con conferma",
    ask: "Da domani la Margherita costa 9 €.",
    reply: "Confermi il nuovo prezzo di 9,00 € da domani su tutti i canali? Rispondi “sì”.",
  },
];

export function WhatsAppKinds() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {KINDS.map((item) => (
        <article key={item.kind} className="rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="menuary-display text-xl">{item.kind}</h3>
            <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--menuary-muted)]">{item.note}</span>
          </div>
          <p className="menuary-demo-bubble mt-4 ml-auto bg-[#d9fdd3] text-[#111b21]">{item.ask}</p>
          <p className="menuary-demo-bubble mt-2 border border-[var(--menuary-line)] bg-white text-[#111b21]">{item.reply}</p>
        </article>
      ))}
    </div>
  );
}
