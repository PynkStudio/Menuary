"use client";

import { useState } from "react";

export function NicknameGate({
  initialSuggestion,
  onSubmit,
  embedded = false,
}: {
  initialSuggestion: string;
  onSubmit: (nick: string) => void;
  /** Senza overlay a schermo intero (es. dentro modale menu). */
  embedded?: boolean;
}) {
  const [value, setValue] = useState("");

  const inner = (
    <div className={embedded ? "w-full" : "w-full max-w-md rounded-3xl bg-pork-cream p-6 shadow-2xl"}>
      <p className="impact-title text-xs text-pork-red">Chi sei?</p>
      <h2 className="headline text-3xl">Come ti chiamiamo?</h2>
      <p className="mt-1 text-sm text-pork-ink/60">
        Cos&igrave; il tuo ordine resta separato da quello degli altri al tavolo.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = value.trim() || initialSuggestion;
          onSubmit(v);
        }}
        className="mt-4 space-y-3"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={initialSuggestion}
          maxLength={24}
          autoFocus
          className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-4 py-3 text-lg outline-none focus:border-pork-red"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSubmit(initialSuggestion)}
            className="btn-ghost flex-1 text-sm"
          >
            Salta
          </button>
          <button type="submit" className="btn-primary flex-1 text-sm">
            Iniziamo
          </button>
        </div>
      </form>
    </div>
  );

  if (embedded) return inner;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-pork-ink/90 p-5">
      {inner}
    </div>
  );
}
