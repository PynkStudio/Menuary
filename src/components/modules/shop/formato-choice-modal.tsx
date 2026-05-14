"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { AdminMenuItem } from "@/lib/types";
import { formatEuro, priceVariants, type PriceVariant } from "@/lib/price-utils";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";
import { cn } from "@/lib/utils";

/** Solo scelta formato (piatto senza ingredienti/extra configurabili). */
export function FormatoChoiceModal({
  item,
  onClose,
  onConfirm,
}: {
  item: AdminMenuItem;
  onClose: () => void;
  onConfirm: (v: PriceVariant, flyFrom?: DOMRect | null) => void;
}) {
  const variants = priceVariants(item.price);
  const [key, setKey] = useState(variants[0]?.key ?? "default");
  const [mounted, setMounted] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    bodyScrollLock();
    return () => bodyScrollUnlock();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const active = variants.find((v) => v.key === key) ?? variants[0];

  if (!mounted || !active) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-pork-ink/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-pork-cream shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-pork-ink/10 px-5 py-4">
          <div>
            <p className="impact-title text-xs text-pork-red">Formato</p>
            <h2 className="headline text-2xl leading-tight">{item.name}</h2>
            <p className="mt-2 text-sm text-pork-ink/65">
              Questo piatto è disponibile in più formati. Scegli quello che preferisci.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full hover:bg-pork-ink/10"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {variants.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setKey(v.key)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border-2 bg-white p-4 text-left transition-all active:scale-[0.98]",
                  key === v.key
                    ? "border-pork-red"
                    : "border-pork-ink/10 hover:border-pork-ink/30",
                )}
              >
                <span className="impact-title text-xs text-pork-ink/70">
                  {v.label ?? "Standard"}
                </span>
                <span className="headline text-xl text-pork-red">
                  {formatEuro(v.price)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <footer className="flex shrink-0 gap-2 border-t border-pork-ink/10 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Annulla
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() =>
              onConfirm(active, confirmRef.current?.getBoundingClientRect() ?? null)
            }
            className="btn-primary flex-1"
          >
            Aggiungi · {formatEuro(active.price)}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
