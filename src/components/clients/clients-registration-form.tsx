"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ClientsRegistrationForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Questo indirizzo email è già registrato. Accedi o recupera la password."
          : "Si è verificato un errore. Riprova tra qualche istante.",
      );
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="menuary-display text-xl">Controlla la tua email</h2>
        <p className="mt-3 text-sm text-[var(--menuary-muted)]">
          Abbiamo inviato un link di conferma a <strong>{email}</strong>.
          Clicca il link per attivare il tuo account.
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

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md space-y-5"
    >
      <label className="block text-sm font-bold">
        Nome
        <input
          type="text"
          autoFocus
          autoComplete="given-name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3 text-[var(--menuary-ink)]"
          placeholder="Il tuo nome"
          required
        />
      </label>

      <label className="block text-sm font-bold">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3 text-[var(--menuary-ink)]"
          placeholder="nome@email.it"
          required
        />
      </label>

      <label className="block text-sm font-bold">
        Password
        <input
          type="password"
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

      {error && (
        <p className="text-sm font-semibold text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="menuary-button menuary-button-accent w-full justify-center disabled:opacity-60"
      >
        {loading ? "Registrazione in corso…" : "Crea account"}
      </button>

      <p className="text-center text-sm text-[var(--menuary-muted)]">
        Hai già un account?{" "}
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
