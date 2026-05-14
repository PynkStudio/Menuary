"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  /** Chiamato dopo cambio password riuscito */
  onSuccess?: () => void;
  className?: string;
}

/**
 * Form cambio password per utenti già autenticati.
 * Usabile da qualsiasi portale (clienti, gestione, admin).
 */
export function ChangePasswordForm({ onSuccess, className }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Impossibile aggiornare la password. Riprova.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setPassword("");
    setConfirm("");
    setLoading(false);
    onSuccess?.();
  }

  if (success) {
    return (
      <div className={`rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 ${className ?? ""}`}>
        Password aggiornata con successo.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className ?? ""}`}>
      <label className="block text-sm font-semibold">
        Nuova password
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          className="mt-1.5 w-full rounded-xl border border-[var(--menuary-line,#E5E0D8)] bg-white px-4 py-3 text-sm outline-none transition focus:border-current focus:ring-2 focus:ring-current/10"
          placeholder="Almeno 8 caratteri"
          required
        />
      </label>

      <label className="block text-sm font-semibold">
        Conferma nuova password
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(null); }}
          className="mt-1.5 w-full rounded-xl border border-[var(--menuary-line,#E5E0D8)] bg-white px-4 py-3 text-sm outline-none transition focus:border-current focus:ring-2 focus:ring-current/10"
          required
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[var(--menuary-ink,#1A1A1A)] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {loading ? "Salvataggio…" : "Aggiorna password"}
      </button>
    </form>
  );
}
