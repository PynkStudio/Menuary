"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Carosello di contenuti per il tenant pynkstudio.
// Adatta il pattern scroll-snap di Doca, ma navigabile (frecce + dot) su desktop
// e mobile. Tenant-isolato: stile in pynkstudio.css.
export function PynkCarousel({ children, label }: { children: ReactNode; label?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);
  const count = items.length;
  const [active, setActive] = useState(0);

  const syncActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const base = track.scrollLeft;
    let nearest = 0;
    let best = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const distance = Math.abs(el.offsetLeft - track.offsetLeft - base);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });
    setActive(nearest);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        syncActive();
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [syncActive]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(count - 1, index));
      const child = track.children[clamped] as HTMLElement | undefined;
      if (!child) return;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: prefersReduced ? "auto" : "smooth" });
    },
    [count],
  );

  return (
    <div className="pynk-carousel" role="group" aria-roledescription="carosello" aria-label={label}>
      <div className="pynk-carousel-track" ref={trackRef} tabIndex={0}>
        {items}
      </div>
      <div className="pynk-carousel-controls">
        <button
          type="button"
          className="pynk-carousel-arrow"
          onClick={() => scrollToIndex(active - 1)}
          disabled={active === 0}
          aria-label="Contenuto precedente"
        >
          <ArrowLeft className="pynk-icon-sm" />
        </button>
        <div className="pynk-carousel-dots">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`pynk-carousel-dot${active === i ? " is-active" : ""}`}
              aria-current={active === i}
              aria-label={`Vai al contenuto ${i + 1} di ${count}`}
              onClick={() => scrollToIndex(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className="pynk-carousel-arrow"
          onClick={() => scrollToIndex(active + 1)}
          disabled={active === count - 1}
          aria-label="Contenuto successivo"
        >
          <ArrowRight className="pynk-icon-sm" />
        </button>
      </div>
    </div>
  );
}
