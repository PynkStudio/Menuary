"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      setError("Impossibile impostare la password. Richiedi un nuovo invito.");
      setLoading(false);
    } else {
      router.refresh();
      router.replace("/admin");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pork-ink p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-pork-cream p-8 shadow-2xl"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pork-red text-white">
          <KeyRound size={22} />
        </div>
        <h1 className="headline text-center text-3xl">Imposta password</h1>
        <p className="mt-1 text-center text-sm text-pork-ink/60">
          Primo accesso — scegli una password sicura
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
              Nuova password
            </span>
            <input
              type="password"
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-4 py-3 outline-none transition-colors focus:border-pork-red"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
              Conferma password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(null); }}
              className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-4 py-3 outline-none transition-colors focus:border-pork-red"
              required
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 text-sm font-semibold text-pork-red">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full disabled:opacity-60"
        >
          {loading ? "Salvataggio…" : "Salva e accedi"}
        </button>
      </form>
    </div>
  );
}
