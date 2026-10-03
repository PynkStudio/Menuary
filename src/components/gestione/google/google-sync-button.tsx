"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

type SyncMode = "regular" | "special" | "all";

/** Sincronizza gli orari su Google restando nella pagina, con l'esito visibile. */
export function GoogleSyncButton({
  tenantId,
  mode,
  label,
  variant = "primary",
}: {
  tenantId: string;
  mode: SyncMode;
  label: string;
  variant?: "primary" | "ghost";
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setState("running");
    setMessage(null);
    try {
      const response = await fetch("/api/gestione/google/sync-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, mode }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: string[] };
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error ?? payload.errors?.[0] ?? "Sincronizzazione non riuscita.");
      }
      setState("done");
      setMessage("Orari aggiornati su Google.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Sincronizzazione non riuscita.");
    }
  }

  return (
    <span className="ga-inline-form">
      <button
        type="button"
        className={variant === "primary" ? "ga-btn ga-btn-primary" : "ga-btn ga-btn-ghost"}
        onClick={run}
        disabled={state === "running"}
      >
        <RefreshCw size={14} aria-hidden="true" />
        {state === "running" ? "Sincronizzazione…" : label}
      </button>
      {message && (
        <span className="ga-section-hint" role="status" data-tone={state === "error" ? "error" : "success"}>
          {message}
        </span>
      )}
    </span>
  );
}
