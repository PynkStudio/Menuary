"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[app/error]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="max-w-md space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-pork-red/80">
          Sito
        </p>
        <h1 className="font-sans text-2xl font-semibold text-pork-ink">
          Qualcosa non ha funzionato
        </h1>
        <p className="text-sm leading-relaxed text-pork-ink/70">
          Questa pagina ha incontrato un errore. Puoi riprovare o tornare alla home; admin e portale clienti sono route separate e non dipendono da questa pagina.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-pork-ink/15 bg-pork-cream px-5 py-2.5 text-sm font-medium text-pork-ink shadow-sm transition hover:bg-pork-peach/60"
        >
          Riprova
        </button>
        <Link
          href="/"
          className="rounded-full bg-pork-mustard px-5 py-2.5 text-sm font-semibold text-pork-ink shadow-sm transition hover:bg-pork-mustard-soft"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
