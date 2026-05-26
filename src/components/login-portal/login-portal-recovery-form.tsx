"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { LoginFrom } from "@/lib/login-url";
import { buildRecoveryCallbackUrl } from "@/lib/login-url";

function recoveryRequestErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Hai richiesto troppi link in poco tempo. Attendi qualche minuto prima di riprovare.";
  }
  return "Non siamo riusciti a inviare l'email di recupero. Controlla che l'indirizzo sia scritto correttamente e riprova.";
}

interface Props {
  from: LoginFrom | null;
  accentColor: string;
}

export function LoginPortalRecoveryForm({ from, accentColor }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = buildRecoveryCallbackUrl(from ?? "clienti");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);
    if (error) {
      setError(recoveryRequestErrorMessage(error.message));
    } else {
      setSent(true);
    }
  }

  const loginHref = from ? `/?from=${encodeURIComponent(from)}` : "/";

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <svg viewBox="0 0 20 20" fill={accentColor} className="h-6 w-6">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold">Controlla la tua email</h2>
        <p className="text-sm text-black/50">
          Abbiamo inviato un link a <strong>{email}</strong>.
          Clicca il link per impostare una nuova password.
        </p>
        <Link
          href={loginHref}
          className="mt-2 inline-block text-sm font-semibold underline-offset-2 hover:underline"
          style={{ color: accentColor }}
        >
          Torna al login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold">Recupera password</h1>
        <p className="mt-1 text-sm text-black/50">
          Inserisci la tua email e ti manderemo un link per reimpostare la password.
        </p>
      </div>

      <label className="block text-sm font-semibold">
        Email
        <input
          type="email"
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--login-accent)] focus:ring-2 focus:ring-[var(--login-accent)]/20"
          placeholder="nome@email.it"
          required
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ backgroundColor: accentColor }}
        className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Invio in corso…" : "Invia link di recupero"}
      </button>

      <p className="text-center text-sm text-black/50">
        Ricordi la password?{" "}
        <Link href={loginHref} className="font-semibold hover:underline" style={{ color: accentColor }}>
          Accedi
        </Link>
      </p>
    </form>
  );
}
