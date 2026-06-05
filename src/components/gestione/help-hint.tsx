"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

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
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-normal rounded-lg bg-pork-ink px-2.5 py-1.5 text-[11px] font-normal leading-snug text-pork-cream shadow-lg"
          style={{ width: "max-content", maxWidth: 240 }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
