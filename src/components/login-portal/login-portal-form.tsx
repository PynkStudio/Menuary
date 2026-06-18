"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveDestination, type LoginFrom } from "@/lib/login-url";
import { resolveUserAccess } from "@/lib/user-access";
import { notifyParentAndClose } from "@/lib/login-popup";
import { useSearchParams } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantSlugFromFrom } from "@/lib/login-url";

function loginErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("email not confirmed")) {
    return "Il tuo indirizzo email non è ancora confermato. Apri l'email di conferma ricevuta o richiedi un nuovo link.";
  }
  if (normalized.includes("too many") || normalized.includes("rate limit")) {
    return "Troppi tentativi ravvicinati. Attendi qualche minuto e riprova.";
  }
  return "Email o password non corretti. Controlla i dati inseriti e riprova.";
}

function portalAccessError(from: LoginFrom | null) {
  if (from === "admin") {
    return "Accesso riuscito, ma questo account non è abilitato al pannello admin. Entra con un account admin o chiedi a un amministratore di invitarti.";
  }
  if (from === "studio") {
    return "Accesso riuscito, ma questo account non è abilitato all'area Studio. Verifica l'account o chiedi supporto all'amministratore.";
  }
  if (from?.startsWith("gestione")) {
    return "Accesso riuscito, ma questo account non è abilitato a questo gestionale. Verifica di usare l'email invitata per il locale corretto.";
  }
  return null;
}

interface Props {
  from: LoginFrom | null;
  next: string | null;
  popup: boolean;
  error?: string | null;
}

export function LoginPortalForm({ from, next, popup, error: initialError }: Props) {
  const searchParams = useSearchParams();
  // Origin del parent che ha aperto il popup (passato come ?origin=...)
  const parentOrigin = searchParams.get("origin") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);

  // Reset loading se il browser ripristina la pagina dalla bfcache (tasto Back).
  // Senza questo, il bottone resta bloccato su "Accesso in corso…" indefinitamente.
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) setLoading(false);
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  const slug = tenantSlugFromFrom(from);
  const tenant = slug ? TENANTS.find((t) => t.id === slug) : null;

  // Etichetta contestuale
  const portalLabel =
    tenant?.name ??
    (from === "admin"
      ? "Menuary · Back-office"
      : from === "studio"
      ? "Menuary · Studio"
      : "Menuary");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();

      // Un refresh-token orfano (lasciato in un cookie .menuary.it scaduto/ruotato)
      // mandava il client GoTrue in loop su /token?grant_type=refresh_token (400/429):
      // il SIGNED_OUT scatenato dal refresh fallito ripuliva l'header Authorization
      // subito dopo signInWithPassword, e la query a `siteadmin` partiva come anon →
      // RLS nascondeva la riga → "account non abilitato al pannello admin" anche per
      // i superadmin reali. Forzare un signOut locale azzera lo stato prima del login.
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user || !data.session) {
        setError(loginErrorMessage(error?.message ?? ""));
        return;
      }

      const access = await resolveUserAccess(supabase, data.user.id);
      const accessError = portalAccessError(from);
      const isWrongPortal =
        (from === "admin" && !access.isSiteadmin) ||
        (from === "studio" && !access.isSiteadmin && !access.tenantId) ||
        (from?.startsWith("gestione") && !access.isSiteadmin && access.tenantId !== slug);

      if (accessError && isWrongPortal) {
        setError(accessError);
        return;
      }

      const destination = resolveDestination({
        from,
        next,
        isSiteadmin: access.isSiteadmin,
        tenantId: access.tenantId,
      });

      if (popup) {
        notifyParentAndClose({
          from: from ?? "clienti",
          parentOrigin,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        });
      } else {
        // Naviga via GET /api/auth/elevate-session che legge la sessione
        // dai cookie appena impostati da signInWithPassword (su login.menuary.it),
        // li promuove a cookie con Domain=.menuary.it via refreshSession(),
        // e redirige alla destinazione.
        window.location.href =
          `/api/auth/elevate-session?destination=${encodeURIComponent(destination)}`;
        return; // loading resta true finché la navigazione parte
      }
    } catch {
      setError("Si è verificato un errore imprevisto. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  // Link "password dimenticata" con from preservato
  const recoveryHref = from
    ? `/recupera-password?from=${encodeURIComponent(from)}${next ? `&next=${encodeURIComponent(next)}` : ""}`
    : "/recupera-password";

  // Link "registrati" solo per portale clienti (gli altri ruoli arrivano via invito)
  const showRegister = from === "clienti" || from === null;
  const registerHref =
    process.env.NODE_ENV === "production"
      ? "https://clienti.menuary.it/registrati"
      : "http://clienti.menuary.localhost:3000/registrati";

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="mb-6 text-center">
        {/* Logo / wordmark del tenant o di Menuary */}
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">
          {portalLabel}
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">Accedi</h1>
      </div>

      <label className="block text-sm font-semibold">
        Email
        <input
          type="email"
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--login-accent,#B8332E)] focus:ring-2 focus:ring-[var(--login-accent,#B8332E)]/20"
          required
        />
      </label>

      <div>
        <label className="block text-sm font-semibold">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--login-accent,#B8332E)] focus:ring-2 focus:ring-[var(--login-accent,#B8332E)]/20"
            required
          />
        </label>
        <div className="mt-1.5 flex justify-end">
          <Link
            href={recoveryHref}
            className="text-xs opacity-50 hover:opacity-80 transition-opacity"
          >
            Password dimenticata?
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ backgroundColor: "var(--login-accent, #B8332E)" }}
        className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Accesso in corso…" : "Entra"}
      </button>

      {showRegister && (
        <p className="text-center text-sm opacity-60">
          Non hai un account?{" "}
          <Link href={registerHref} className="font-semibold underline-offset-2 hover:underline">
            Registrati
          </Link>
        </p>
      )}
    </form>
  );
}
