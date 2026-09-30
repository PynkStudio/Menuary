"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Phone } from "lucide-react";

export type AICallStep =
  | { role: "caller" | "ai"; text: string }
  | { role: "task"; text: string; from?: string; to?: string };

type Props = {
  liveLabel: string;
  handledLabel: string;
  script: readonly AICallStep[];
};

const TYPING_MS = 900;
const LOOP_PAUSE_MS = 5200;
// Il timer corre più veloce del tempo reale: la demo dura ~30s ma deve sembrare una chiamata vera.
const CALL_CLOCK_SPEED = 2.4;

function stepDelay(step: AICallStep): number {
  if (step.role === "task") return 650;
  return Math.min(2600, 900 + step.text.length * 22);
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AICallSimulation({ liveLabel, handledLabel, script }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const done = visible >= script.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(script.length);
      setTyping(false);
      setSeconds(68);
    }
  }, [reducedMotion, script.length]);

  useEffect(() => {
    if (reducedMotion || !inView) return;
    const timers: number[] = [];

    if (done) {
      timers.push(
        window.setTimeout(() => {
          setVisible(0);
          setSeconds(0);
        }, LOOP_PAUSE_MS),
      );
    } else {
      const wait = visible === 0 ? 500 : stepDelay(script[visible - 1]);
      if (script[visible].role === "ai") {
        timers.push(
          window.setTimeout(() => setTyping(true), wait),
          window.setTimeout(() => {
            setTyping(false);
            setVisible((v) => v + 1);
          }, wait + TYPING_MS),
        );
      } else {
        timers.push(window.setTimeout(() => setVisible((v) => v + 1), wait));
      }
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [visible, done, inView, reducedMotion, script]);

  useEffect(() => {
    if (reducedMotion || !inView || done) return;
    const id = window.setInterval(() => setSeconds((s) => s + CALL_CLOCK_SPEED * 0.5), 500);
    return () => window.clearInterval(id);
  }, [inView, done, reducedMotion]);

  return (
    <aside
      ref={rootRef}
      aria-hidden
      className="menuary-reveal menuary-fade-up-d2 flex h-[430px] flex-col rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-5 shadow-[0_30px_70px_-30px_rgba(24,35,31,0.5)] sm:h-[460px]"
    >
      <div className="flex items-center justify-between border-b border-[var(--menuary-line)] pb-4">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
          {done ? (
            <Phone size={12} strokeWidth={2} />
          ) : (
            <span className="menuary-call-live-dot" />
          )}
          {done ? handledLabel : liveLabel}
        </span>
        <span className="text-[11px] tabular-nums text-[var(--menuary-muted)]">{formatClock(seconds)}</span>
      </div>

      <div className="menuary-call-feed relative mt-3 flex min-h-0 flex-1 flex-col justify-end gap-2.5 overflow-hidden text-sm">
        {script.slice(0, visible).map((step, i) => {
          if (step.role === "task") {
            return (
              <p
                key={`${i}-${step.text}`}
                className="menuary-call-in flex shrink-0 items-start gap-2 px-1 text-[13px] text-[var(--menuary-ink)]/80"
              >
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--menuary-sage)] text-white">
                  <Check size={10} strokeWidth={3} />
                </span>
                <span>
                  {step.text}
                  {step.from && step.to ? (
                    <>
                      {" · "}
                      <s className="text-[var(--menuary-muted)]">{step.from}</s>
                      {" → "}
                      <span className="menuary-call-swap font-semibold text-[var(--menuary-ink)]">{step.to}</span>
                    </>
                  ) : null}
                </span>
              </p>
            );
          }
          const isAi = step.role === "ai";
          return (
            <p
              key={`${i}-${step.text}`}
              className={
                "menuary-call-in max-w-[86%] shrink-0 rounded-2xl px-3.5 py-2 leading-[1.5] " +
                (isAi
                  ? "self-end rounded-br-md bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                  : "self-start rounded-bl-md bg-[var(--menuary-ink)]/[0.06] text-[var(--menuary-ink)]")
              }
            >
              {step.text}
            </p>
          );
        })}
        {typing ? (
          <span className="menuary-call-in menuary-call-typing shrink-0 self-end rounded-2xl rounded-br-md bg-[var(--menuary-ink)] px-3.5 py-3">
            <i />
            <i />
            <i />
          </span>
        ) : null}
      </div>
    </aside>
  );
}
