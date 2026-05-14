"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  /** true quando l'utente arriva dal link email (type=recovery) */
  showNewPassword: boolean;
}

export function ClientsPasswordRecoveryForm({ showNewPassword }: Props) {
  const router = useRouter();

  // Step 1: richiedi reset
  const [email, setEmail] = useState("");
  const [requestDone, setRequestDone] = useState(false);

  // Step 2: imposta nuova password
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [updateDone, setUpdateDone] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const nextPath = encodeURIComponent("/recupera-password?step=nuova-password");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=${nextPath}`,
    });

    setLoading(false);
    if (error) {
      setError("Impossibile inviare l'email. Controlla l'indirizzo e riprova.");
    } else {
      setRequestDone(true);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
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
      setError("Impossibile aggiornare la password. Richiedi un nuovo link.");
      setLoading(false);
    } else {
      setUpdateDone(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    }
  }

  // Conferma aggiornamento password
  if (updateDone) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="menuary-display text-xl">Password aggiornata</h2>
        <p className="mt-2 text-sm text-[var(--menuary-muted)]">
          Stai per essere reindirizzato alla tua area personale…
        </p>
      </div>
    );
  }

  // Step 2: nuova password (utente arriva dal link email)
  if (showNewPassword) {
    return (
      <form onSubmit={handleUpdate} className="mx-auto max-w-md space-y-5">
        <label className="block text-sm font-bold">
          Nuova password
          <input
            type="password"
            autoFocus
            autoComplete="new-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3 text-[var(--menuary-ink)]"
            placeholder="Almeno 8 caratteri"
            required
          />
        </label>

        <label className="block text-sm font-bold">
          Conferma password
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(null); }}
            className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3 text-[var(--menuary-ink)]"
            required
          />
        </label>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="menuary-button menuary-button-accent w-full justify-center disabled:opacity-60"
        >
          {loading ? "Salvataggio…" : "Salva nuova password"}
        </button>
      </form>
    );
  }

  // Step 1: richiesta email inviata
  if (requestDone) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-8 text-center">
        <h2 className="menuary-display text-xl">Controlla la tua email</h2>
        <p className="mt-3 text-sm text-[var(--menuary-muted)]">
          Abbiamo inviato un link a <strong>{email}</strong>.
          Clicca il link per impostare una nuova password.
        </p>
        <Link
          href="/login"
          className="menuary-button menuary-button-dark mt-6 inline-flex justify-center"
        >
          Torna al login
        </Link>
      </div>
    );
  }

  // Step 1: form richiesta reset
  return (
    <form onSubmit={handleRequest} className="mx-auto max-w-md space-y-5">
      <label className="block text-sm font-bold">
        Il tuo indirizzo email
        <input
          type="email"
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3 text-[var(--menuary-ink)]"
          placeholder="nome@email.it"
          required
        />
      </label>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="menuary-button menuary-button-accent w-full justify-center disabled:opacity-60"
      >
        {loading ? "Invio in corso…" : "Invia link di recupero"}
      </button>

      <p className="text-center text-sm text-[var(--menuary-muted)]">
        Ricordi la password?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--menuary-ink)] underline-offset-2 hover:underline"
        >
          Accedi
        </Link>
      </p>
    </form>
  );
}
