"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";

export function CartLineNoteModal({
  title,
  initialNote,
  onClose,
  onSave,
}: {
  title: string;
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [mounted, setMounted] = useState(false);

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

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-pork-ink/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-pork-cream shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-pork-ink/10 px-5 py-4">
          <div>
            <p className="impact-title text-xs text-pork-red">Nota</p>
            <h2 className="headline text-xl leading-tight">{title}</h2>
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
        <div className="px-5 py-4">
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Es. ben cotto, da dividere…"
            className="w-full resize-none rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2.5 text-base outline-none focus:border-pork-red sm:text-sm"
          />
        </div>
        <footer className="flex gap-2 border-t border-pork-ink/10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Annulla
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(note.trim());
              onClose();
            }}
            className="btn-primary flex-1"
          >
            Salva
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
