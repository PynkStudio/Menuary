"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Tab = "cliente" | "titolare";

export function ClientsLoginTabs() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function clearError() {
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o password non corretti. Riprova.");
      setLoading(false);
    } else {
      router.refresh();
      router.replace("/");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Tab switcher */}
      <div className="flex rounded-full border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-1">
        <button
          type="button"
          onClick={() => setTab("cliente")}
          className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
            tab === "cliente"
              ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
              : "text-[var(--menuary-muted)]"
          }`}
        >
          Cliente
        </button>
        <button
          type="button"
          onClick={() => setTab("titolare")}
          className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
            tab === "titolare"
              ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
              : "text-[var(--menuary-muted)]"
          }`}
        >
          Titolare / staff
        </button>
      </div>

      {tab === "cliente" ? (
        <form className="mt-10 space-y-5" onSubmit={handleLogin}>
          <label className="block text-sm font-bold">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3 text-[var(--menuary-ink)]"
              placeholder="nome@email.it"
              required
            />
          </label>

          <div>
            <label className="block text-sm font-bold">
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3 text-[var(--menuary-ink)]"
                required
              />
            </label>
            <div className="mt-1.5 flex justify-end">
              <Link
                href="/recupera-password"
                className="text-xs text-[var(--menuary-muted)] hover:text-[var(--menuary-ink)]"
              >
                Password dimenticata?
              </Link>
            </div>
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="menuary-button menuary-button-accent w-full justify-center disabled:opacity-60"
          >
            {loading ? "Accesso in corso…" : "Accedi"}
          </button>

          <p className="text-center text-sm text-[var(--menuary-muted)]">
            Non hai un account?{" "}
            <Link
              href="/registrati"
              className="font-semibold text-[var(--menuary-ink)] underline-offset-2 hover:underline"
            >
              Registrati
            </Link>
          </p>
        </form>
      ) : (
        <div className="mt-10 space-y-4 text-sm text-[var(--menuary-muted)]">
          <p>
            Per gestire menu, ordini e impostazioni del locale usa il back-office dedicato su
            dominio{" "}
            <strong className="text-[var(--menuary-ink)]">admin.menuary.it</strong>.
          </p>
          <a
            href="https://admin.menuary.it"
            className="menuary-button menuary-button-dark inline-flex w-full justify-center"
          >
            Vai ad admin.menuary.it
          </a>
        </div>
      )}
    </div>
  );
}
