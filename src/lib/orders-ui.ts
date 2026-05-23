import type { OrderStatus } from "./types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_confirmation: "In attesa conferma",
  expired: "Scaduto",
  nuovo: "Nuovo",
  in_preparazione: "In preparazione",
  pronto: "Pronto",
  consegnato: "Consegnato",
  annullato: "Annullato",
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_confirmation: "bg-pork-mustard/70 text-pork-ink",
  expired: "bg-pork-ink/40 text-pork-cream",
  nuovo: "bg-pork-red text-white",
  in_preparazione: "bg-pork-mustard text-pork-ink",
  pronto: "bg-pork-green text-white",
  consegnato: "bg-pork-ink/30 text-pork-ink",
  annullato: "bg-pork-ink/60 text-pork-cream",
};

export const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  pending_confirmation: "nuovo",
  expired: null,
  nuovo: "in_preparazione",
  in_preparazione: "pronto",
  pronto: "consegnato",
  consegnato: null,
  annullato: null,
};

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export function elapsedMinutes(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}
