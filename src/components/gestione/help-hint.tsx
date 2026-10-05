"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 6;
const VIEWPORT_MARGIN = 8;

export function HelpHint({
  text,
  size = 13,
  className = "",
}: {
  text: string;
  size?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const tipRef = useRef<HTMLSpanElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // In portal su <body> con posizione fixed: dentro card o tabelle con overflow
  // nascosto il tooltip assoluto veniva tagliato.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    function place() {
      const button = buttonRef.current;
      const tip = tipRef.current;
      if (!button || !tip) return;
      const rect = button.getBoundingClientRect();
      const width = tip.offsetWidth;
      const height = tip.offsetHeight;
      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - width / 2, VIEWPORT_MARGIN),
        window.innerWidth - width - VIEWPORT_MARGIN,
      );
      const above = rect.top - GAP - height;
      const top = above >= VIEWPORT_MARGIN ? above : rect.bottom + GAP;
      setPosition({ top, left });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, text]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className={`relative inline-flex items-center align-middle ${className}`}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-describedby={open ? id : undefined}
        aria-label="Spiegazione"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-pork-ink/40 hover:bg-pork-ink/10 hover:text-pork-ink"
      >
        <HelpCircle size={size} strokeWidth={2.2} />
      </button>
      {open &&
        createPortal(
          <span
            ref={tipRef}
            id={id}
            role="tooltip"
            className="pointer-events-none whitespace-normal rounded-lg bg-pork-ink px-2.5 py-1.5 text-[11px] font-normal leading-snug text-pork-cream shadow-lg"
            style={{
              position: "fixed",
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              zIndex: 1000,
              width: "max-content",
              maxWidth: 240,
              visibility: position ? "visible" : "hidden",
            }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
