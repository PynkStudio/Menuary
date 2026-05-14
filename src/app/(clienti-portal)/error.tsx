"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ClientiPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[clienti-portal/error]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="max-w-md space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--menuary-copper)]">
          Account clienti
        </p>
        <h1 className="text-xl font-semibold text-[var(--menuary-ink)]">
          Errore nel portale
        </h1>
        <p className="text-sm text-[var(--menuary-muted)]">
          Il sito del ristorante non è coinvolto. Torna alla home del portale o riprova.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] px-4 py-2 text-sm font-medium text-[var(--menuary-ink)] hover:bg-white"
        >
          Riprova
        </button>
        <Link
          href="/"
          className="rounded-full bg-[var(--menuary-copper)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Portale clienti
        </Link>
      </div>
    </div>
  );
}
