"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin/error]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="max-w-md space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-pork-red/80">
          Amministrazione
        </p>
        <h1 className="font-sans text-xl font-semibold text-pork-ink">
          Errore nel pannello
        </h1>
        <p className="text-sm text-pork-ink/70">
          Il sito pubblico non è coinvolto. Torna al pannello o riprova.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-pork-ink/15 bg-pork-cream px-4 py-2 text-sm font-medium text-pork-ink hover:bg-pork-peach/60"
        >
          Riprova
        </button>
        <Link
          href="/admin"
          className="rounded-full bg-pork-mustard px-4 py-2 text-sm font-semibold text-pork-ink hover:bg-pork-mustard-soft"
        >
          Pannello admin
        </Link>
      </div>
    </div>
  );
}
