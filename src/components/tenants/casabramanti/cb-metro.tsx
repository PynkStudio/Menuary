"use client";

/**
 * IL METRO DA SARTO — la firma di Casa Bramanti.
 *
 * Un metro fisso sul bordo sinistro per tutta la pagina. Non è una barra di
 * avanzamento travestita: ogni oggetto occupa il tratto di nastro che
 * servirebbe davvero a prenderne le misure (la somma delle sue misure), e gli
 * spilli si piantano ai centimetri cumulati esatti mentre li superi, come fa
 * un sarto che srotola il nastro una misura dopo l'altra.
 *
 * Sull'oggetto 08 non c'è niente da misurare: il nastro si spegne e la
 * lettura diventa "taglia unica".
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { casabramantiTape, type CbTapeStop } from "@/lib/casabramanti-catalog";
import { useCasabramantiCopy, useCasabramantiLanguage } from "@/lib/casabramanti-i18n";

const PX_PER_CM = 7;
/** Il nastro viene disegnato a finestre di 400 cm, ricentrate ogni 100 cm. */
const WINDOW_HALF = 200;
const BUCKET = 100;

export type CbMetroHandle = {
  update: (cm: number, pieceIndex: number, blank: boolean) => void;
};

type Props = {
  onJump: (pieceIndex: number) => void;
};

export const CbMetro = forwardRef<CbMetroHandle, Props>(function CbMetro({ onJump }, ref) {
  const copy = useCasabramantiCopy();
  const language = useCasabramantiLanguage();
  const { stops, total } = useMemo(() => casabramantiTape(), []);

  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLSpanElement>(null);
  const pinRefs = useRef<Map<string, HTMLElement>>(new Map());

  const [base, setBase] = useState(0);
  const [active, setActive] = useState(0);
  const [blank, setBlank] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const windowStart = base - WINDOW_HALF;
  const windowEnd = base + WINDOW_HALF;

  useImperativeHandle(
    ref,
    () => ({
      update(cm, pieceIndex, isBlank) {
        const bucket = Math.round(cm / BUCKET) * BUCKET;
        // Lo stato cambia solo ogni metro di nastro: il resto è scrittura diretta sul DOM.
        setBase((current) => (current === bucket ? current : bucket));
        setActive((current) => (current === pieceIndex ? current : pieceIndex));
        setBlank((current) => (current === isBlank ? current : isBlank));

        if (readRef.current) readRef.current.textContent = String(Math.round(cm));

        const strip = stripRef.current;
        if (strip && !reduced) {
          // Vedi viewportHeight() in pages/home.tsx: innerHeight può essere 0.
          const line = (document.documentElement.clientHeight || window.innerHeight || 800) / 2;
          const offset = line - (cm - (bucket - WINDOW_HALF)) * PX_PER_CM;
          strip.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        }

        pinRefs.current.forEach((node) => {
          const at = Number(node.dataset.cbAt ?? "0");
          node.style.setProperty("--cb-pin-o", cm >= at ? "1" : "0");
        });
      },
    }),
    [reduced],
  );

  const numbers = useMemo(() => {
    const out: number[] = [];
    const first = Math.ceil(windowStart / 50) * 50;
    for (let cm = first; cm <= windowEnd; cm += 50) {
      if (cm >= 0 && cm <= total) out.push(cm);
    }
    return out;
  }, [windowStart, windowEnd, total]);

  const marks = useMemo(
    () => stops.filter((stop) => stop.start >= windowStart && stop.start <= windowEnd),
    [stops, windowStart, windowEnd],
  );

  const activeStop: CbTapeStop | undefined = stops[active];

  const setPinRef = useCallback((key: string, node: HTMLElement | null) => {
    if (node) pinRefs.current.set(key, node);
    else pinRefs.current.delete(key);
  }, []);

  if (reduced) {
    return (
      <div className="cb-metro-dock">
      <div className="cb-metro" ref={rootRef} aria-label={copy.metro.ariaLabel}>
        <div className="cb-metro-read" style={{ top: "auto", bottom: "auto", transform: "none" }}>
          <small>{copy.metro.reducedNote}</small>
          {activeStop?.piece.measures.map((measure) => (
            <span key={measure.key} style={{ display: "block" }}>
              {measure.label[language]} {measure.cm} {copy.metro.unit}
            </span>
          ))}
        </div>
        <span className="cb-metro-title">
          <b>{copy.metro.title}</b>
        </span>
      </div>
      </div>
    );
  }

  return (
    <div className="cb-metro-dock">
    <div
      className="cb-metro"
      ref={rootRef}
      data-cb-blank={blank ? "true" : "false"}
      role="complementary"
      aria-label={copy.metro.ariaLabel}
      style={{ ["--cb-cm" as string]: `${PX_PER_CM}px` }}
    >
      <div className="cb-metro-strip" ref={stripRef}>
        <div
          className="cb-metro-ticks"
          style={{ ["--cb-tape-h" as string]: `${(windowEnd - windowStart) * PX_PER_CM}px` }}
        />

        {numbers.map((cm) => (
          <span key={cm} className="cb-metro-num" style={{ top: (cm - windowStart) * PX_PER_CM }}>
            {cm}
          </span>
        ))}

        {marks.map((stop) => (
          <button
            key={stop.piece.id}
            type="button"
            className="cb-metro-mark"
            style={{ top: (stop.start - windowStart) * PX_PER_CM }}
            onClick={() => onJump(stops.indexOf(stop))}
            title={stop.piece.name[language]}
          >
            <span>{stop.piece.number}</span>
            <span className="sr-only">{stop.piece.name[language]}</span>
          </button>
        ))}

        {activeStop?.pins
          .filter((pin) => pin.at >= windowStart && pin.at <= windowEnd)
          .map((pin) => (
            <i
              key={`${activeStop.piece.id}-${pin.measure.key}`}
              className="cb-metro-pin"
              ref={(node) => setPinRef(`${activeStop.piece.id}-${pin.measure.key}`, node)}
              data-cb-at={pin.at}
              style={{ top: (pin.at - windowStart) * PX_PER_CM }}
            >
              <span>
                {pin.measure.label[language]} {pin.measure.cm}
              </span>
            </i>
          ))}
      </div>

      <p className="cb-metro-read" aria-live="off">
        <b>
          <span ref={readRef}>0</span>
          <i>{copy.metro.unit}</i>
        </b>
        {blank ? <small>{copy.metro.oneSize}</small> : null}
      </p>

      <span className="cb-metro-title">
        <b>{copy.metro.title}</b>
        <span>
          {total} {copy.metro.unit}
        </span>
      </span>
    </div>
    </div>
  );
});
