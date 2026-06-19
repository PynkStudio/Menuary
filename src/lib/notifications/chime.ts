"use client";

// Chime sintetico via Web Audio API. Niente file MP3: tre timbri distinti
// (ordine, prenotazione, pronto) generati on-the-fly. Robusto, no asset.
// Mute persistito in localStorage per-utente.

export type ChimeKind = "order" | "reservation" | "ready" | "order_edit";

const MUTE_KEY = "menuary:chime-muted";

let ctx: AudioContext | null = null;
let unlocked = false;
let activeNodes: Array<AudioScheduledSourceNode | GainNode> = [];

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    (window.AudioContext as typeof AudioContext | undefined) ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Sblocca il context audio dopo il primo gesto utente (richiesto da Chrome/iOS).
 * Da chiamare una volta al mount del provider, su listener "pointerdown" e "keydown".
 */
export function unlockAudioOnGesture(): () => void {
  if (unlocked || typeof window === "undefined") return () => {};
  const handler = () => {
    const c = getContext();
    if (c && c.state === "suspended") {
      void c.resume().catch(() => {});
    }
    unlocked = true;
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("pointerdown", handler, { once: true });
  window.addEventListener("keydown", handler, { once: true });
  return () => {
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (muted) window.localStorage.setItem(MUTE_KEY, "1");
    else window.localStorage.removeItem(MUTE_KEY);
    if (muted) stopActiveChimes();
    window.dispatchEvent(
      new CustomEvent("menuary:chime-mute", { detail: { muted } }),
    );
  } catch {
    /* storage non disponibile */
  }
}

function stopActiveChimes(): void {
  for (const node of activeNodes) {
    try {
      if ("stop" in node) node.stop();
      node.disconnect();
    } catch {
      /* nodo gia' fermo */
    }
  }
  activeNodes = [];
}

/**
 * Pattern timbrico per ogni evento.
 * - order: due note ascendenti, tono caldo (campanello cassa).
 * - reservation: nota singola morbida (notifica calendario).
 * - ready: tre note brevi, alert (cameriere vai a prendere).
 */
const PATTERNS: Record<ChimeKind, Array<{ freq: number; at: number; dur: number }>> = {
  order: [
    { freq: 880, at: 0, dur: 0.16 },
    { freq: 1320, at: 0.14, dur: 0.22 },
  ],
  order_edit: [
    { freq: 1200, at: 0, dur: 0.12 },
    { freq: 900, at: 0.12, dur: 0.12 },
    { freq: 1200, at: 0.26, dur: 0.18 },
  ],
  reservation: [{ freq: 660, at: 0, dur: 0.32 }],
  ready: [
    { freq: 1046, at: 0, dur: 0.1 },
    { freq: 1046, at: 0.14, dur: 0.1 },
    { freq: 1568, at: 0.28, dur: 0.18 },
  ],
};

export function playChime(kind: ChimeKind): void {
  if (isMuted()) return;
  const c = getContext();
  if (!c) return;
  if (c.state === "suspended") {
    // Non ancora sbloccato: il gesto utente arriverà, intanto skippo.
    void c.resume().catch(() => {});
    if (c.state === "suspended") return;
  }
  const now = c.currentTime;
  const master = c.createGain();
  master.gain.value = 0.18;
  master.connect(c.destination);
  activeNodes.push(master);
  const repeats = kind === "order" ? 8 : kind === "order_edit" ? 4 : 1;
  const spacing = kind === "order" || kind === "order_edit" ? 1 : 0;
  for (let repeat = 0; repeat < repeats; repeat++) {
    for (const note of PATTERNS[kind]) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = note.freq;
      // Envelope ADSR semplificato per evitare click
      const start = now + repeat * spacing + note.at;
      const end = start + note.dur;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.9, start + 0.01);
      gain.gain.linearRampToValueAtTime(0.7, start + note.dur * 0.6);
      gain.gain.linearRampToValueAtTime(0, end);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(end + 0.02);
      activeNodes.push(osc, gain);
    }
  }
}
