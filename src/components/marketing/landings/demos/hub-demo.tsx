"use client";

import {
  BarChart3,
  Bike,
  CalendarCheck,
  ChefHat,
  Globe,
  LayoutGrid,
  MonitorSmartphone,
  Phone,
  QrCode,
  Receipt,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useDemoSteps } from "./use-demo-steps";

const NODES: { label: string; icon: LucideIcon }[] = [
  { label: "Cassa", icon: Receipt },
  { label: "Ordini", icon: UtensilsCrossed },
  { label: "Tavoli", icon: LayoutGrid },
  { label: "Prenotazioni", icon: CalendarCheck },
  { label: "Menu e QR", icon: QrCode },
  { label: "Kiosk", icon: MonitorSmartphone },
  { label: "Cucina", icon: ChefHat },
  { label: "Sito", icon: Globe },
  { label: "Telefono IA", icon: Phone },
  { label: "Delivery", icon: Bike },
  { label: "Google", icon: Star },
  { label: "Statistiche", icon: BarChart3 },
];

// Arrotondato: server e browser calcolano sin/cos con ultime cifre diverse (hydration mismatch).
function ringPoint(index: number, count: number) {
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.round((50 + Math.cos(angle) * 40) * 100) / 100,
    y: Math.round((50 + Math.sin(angle) * 40) * 100) / 100,
  };
}

/** Menuary al centro, i moduli intorno: si accendono uno alla volta. */
export function HubDemo() {
  const { ref, step } = useDemoSteps<HTMLDivElement>(NODES.length, { interval: 900, holdLast: 1200 });
  const count = NODES.length;

  return (
    <div ref={ref} className="menuary-demo-surface p-5 sm:p-8">
      <div className="relative mx-auto hidden aspect-square max-w-[30rem] sm:block">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          {NODES.map((node, index) => {
            const point = ringPoint(index, count);
            return (
              <line
                key={node.label}
                x1="50"
                y1="50"
                x2={point.x}
                y2={point.y}
                stroke={index === step ? "var(--menuary-copper)" : "var(--menuary-line)"}
                strokeWidth={index === step ? 0.6 : 0.3}
                style={{ transition: "stroke 300ms ease" }}
              />
            );
          })}
        </svg>
        <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[var(--menuary-ink)] text-center text-[var(--menuary-paper)] shadow-[0_20px_50px_-20px_rgba(24,35,31,0.6)]">
          <span className="menuary-wordmark text-xl">
            menuary<span className="text-[var(--menuary-copper)]">.</span>
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/55">Stessi dati</span>
        </div>
        {NODES.map((node, index) => {
          const point = ringPoint(index, count);
          const Icon = node.icon;
          return (
            <span
              key={node.label}
              className="menuary-eco-node absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-xs"
              data-active={index === step}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              <Icon size={14} strokeWidth={1.8} />
              {node.label}
            </span>
          );
        })}
      </div>

      <div className="sm:hidden">
        <div className="mx-auto flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
          <span className="menuary-wordmark text-base">
            menuary<span className="text-[var(--menuary-copper)]">.</span>
          </span>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {NODES.map((node, index) => {
            const Icon = node.icon;
            return (
              <span key={node.label} className="menuary-eco-node text-xs" data-active={index === step}>
                <Icon size={13} strokeWidth={1.8} />
                {node.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const QUEUE = [
  { channel: "QR · Tavolo 7", detail: "2 × Carbonara, 1 × Tiramisù", meta: "Comanda stampata in cucina" },
  { channel: "Telefono IA", detail: "Prenotazione Rossi · 4 persone · 21:00", meta: "Da confermare" },
  { channel: "Deliveroo", detail: "Ordine #4821 · 3 articoli", meta: "Accettato · stato inviato alla piattaforma" },
  { channel: "Kiosk", detail: "Ordine 112 · asporto", meta: "Inviato in cucina" },
  { channel: "Sito", detail: "Asporto Bianchi · ritiro 20:15", meta: "In preparazione" },
];

/** Un servizio: ordini e prenotazioni da canali diversi nella stessa coda. */
export function ServiceQueueDemo() {
  const { ref, step } = useDemoSteps<HTMLDivElement>(QUEUE.length + 1, { interval: 1300, holdLast: 3800 });
  const shown = QUEUE.slice(0, step).reverse();

  return (
    <div ref={ref} className="menuary-demo-surface">
      <div className="flex items-center justify-between border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-5 py-4">
        <div>
          <p className="menuary-demo-eyebrow">Operativo · servizio di stasera</p>
          <p className="menuary-display text-xl">Tutti i canali</p>
        </div>
        <span className="menuary-demo-chip bg-[var(--menuary-ink)] text-[var(--menuary-paper)] tabular-nums">
          {step} in coda
        </span>
      </div>
      <ul className="min-h-[21rem] divide-y divide-[var(--menuary-line)]" aria-live="polite">
        {shown.map((item) => (
          <li key={item.channel} className="menuary-demo-in flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[var(--menuary-ink)]">{item.detail}</p>
              <p className="mt-0.5 text-xs text-[var(--menuary-muted)]">{item.meta}</p>
            </div>
            <span className="menuary-demo-chip shrink-0 bg-[rgba(169,95,69,0.12)] text-[var(--menuary-copper)]">
              {item.channel}
            </span>
          </li>
        ))}
        {step === 0 ? (
          <li className="px-5 py-10 text-center text-sm text-[var(--menuary-muted)]">Apertura cucina, 19:00</li>
        ) : null}
      </ul>
    </div>
  );
}
