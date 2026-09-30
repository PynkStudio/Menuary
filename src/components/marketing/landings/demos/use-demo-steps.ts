"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Avanza una demo passo per passo. Parte solo quando è a schermo, si ferma
 * quando esce, e con `prefers-reduced-motion` mostra subito l'ultimo passo:
 * il contenuto completo resta leggibile senza animazione.
 */
export function useDemoSteps<T extends HTMLElement>(
  total: number,
  { interval = 1500, holdLast = 3200, loop = true, resetKey }: {
    interval?: number | readonly number[];
    holdLast?: number;
    loop?: boolean;
    resetKey?: unknown;
  } = {},
) {
  const ref = useRef<T>(null);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setStep(0);
  }, [resetKey]);

  useEffect(() => {
    if (reduced || !visible) return;
    const isLast = step >= total - 1;
    if (isLast && !loop) return;
    const delay = isLast
      ? holdLast
      : Array.isArray(interval)
        ? (interval[step] ?? interval[interval.length - 1] ?? 1500)
        : (interval as number);
    const timer = window.setTimeout(() => setStep(isLast ? 0 : step + 1), delay);
    return () => window.clearTimeout(timer);
  }, [step, total, interval, holdLast, loop, visible, reduced]);

  return { ref, step: reduced ? total - 1 : step, setStep, reduced };
}
