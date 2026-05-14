"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { parseFrom, resolveDestination } from "@/lib/login-url";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantSlugFromFrom } from "@/lib/login-url";
import { LoginPortalTheme } from "@/components/login-portal/login-portal-theme";

/**
 * Pagina set-password usata in due casi:
 * 1. type=invite  → enrollment nuovo utente (staff o admin invitato)
 * 2. mode=recovery → reset password richiesto dall'utente
 *
 * In entrambi i casi l'utente è già autenticato (token verificato dal callback).
 * Dopo aver impostato la password viene reindirizzato al portale corretto.
 * In modalità invite, mostra la checkbox per abilitare il profilo cliente Menuary.
 */
export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const from = parseFrom(searchParams.get("from"));
  const next = searchParams.get("next");
  const isRecovery = searchParams.get("mode") === "recovery";

  const slug = tenantSlugFromFrom(from);
  const tenant = slug ? TENANTS.find((t) => t.id === slug) : null;
  const accentColor = tenant?.theme?.red ?? "#B8332E";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consumerOptIn, setConsumerOptIn] = useState(false);
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

    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError || !updateData.user) {
      setError("Impossibile impostare la password. Richiedi un nuovo invito.");
      setLoading(false);
      return;
    }

    // Enrollment: se l'utente ha scelto di abilitare il profilo cliente
    if (!isRecovery && consumerOptIn) {
      await supabase
        .from("user_profiles")
        .update({ consumer_enabled: true })
        .eq("user_id", updateData.user.id);
    }

    // Recupera ruolo per il redirect finale
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("role, tenant_id")
      .eq("auth_user_id", updateData.user.id)
      .single();

    const destination = resolveDestination({
      from,
      next: next ?? null,
      role: adminRow?.role ?? null,
      tenantId: adminRow?.tenant_id ?? null,
    });

    window.location.href = destination;
  }

  return (
    <LoginPortalTheme from={from}>
      <div
        className="flex min-h-screen items-center justify-center bg-[#F5F0EA] p-6"
        style={{ "--login-accent": accentColor } as React.CSSProperties}
      >
        <div className="w-full max-w-sm">
          <div className="rounded-3xl bg-white px-8 py-10 shadow-xl shadow-black/5">
            <div className="mb-6 text-center">
              <div
                className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: accentColor }}
              >
                <KeyRound size={20} />
              </div>
              <h1 className="text-xl font-bold">
                {isRecovery ? "Nuova password" : "Benvenuto — scegli la tua password"}
              </h1>
              {!isRecovery && (
                <p className="mt-1 text-sm text-black/50">
                  Primo accesso · imposta una password sicura
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-semibold">
                {isRecovery ? "Nuova password" : "Password"}
                <input
                  type="password"
                  autoFocus
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--login-accent,#B8332E)] focus:ring-2 focus:ring-[var(--login-accent,#B8332E)]/20"
                  placeholder="Almeno 8 caratteri"
                  required
                />
              </label>

              <label className="block text-sm font-semibold">
                Conferma password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--login-accent,#B8332E)] focus:ring-2 focus:ring-[var(--login-accent,#B8332E)]/20"
                  required
                />
              </label>

              {/* Optin cliente Menuary — solo per invite, non per recovery */}
              {!isRecovery && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-4 transition hover:border-black/20">
                  <input
                    type="checkbox"
                    checked={consumerOptIn}
                    onChange={(e) => setConsumerOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--login-accent,#B8332E)]"
                  />
                  <span className="text-sm leading-snug">
                    <strong className="font-semibold">Abilita anche il profilo cliente Menuary</strong>
                    <span className="block mt-0.5 text-black/50">
                      Potrai accedere a clienti.menuary.it con le stesse credenziali
                      per gestire ordini, prenotazioni e preferenze personali.
                    </span>
                  </span>
                </label>
              )}

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
                {loading ? "Salvataggio…" : isRecovery ? "Salva nuova password" : "Salva e accedi"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </LoginPortalTheme>
  );
}
