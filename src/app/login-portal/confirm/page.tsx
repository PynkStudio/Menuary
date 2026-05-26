"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { parseFrom, parseNext, resolveDestination } from "@/lib/login-url";
import { resolveUserAccess } from "@/lib/user-access";
import { LoginPortalTheme } from "@/components/login-portal/login-portal-theme";

const INVALID_INVITE_MESSAGE =
  "Questo invito non è più valido o è già stato usato. Contatta l'amministratore per fartelo reinviare.";
const INVALID_RECOVERY_MESSAGE =
  "Questo link per reimpostare la password non è più valido o è già stato usato. Richiedi un nuovo link dalla pagina di recupero password.";
const INVALID_AUTH_LINK_MESSAGE =
  "Questo link di accesso non è valido o è scaduto. Torna al login e riprova.";

function invalidLinkMessage(type?: string | null, mode?: string | null) {
  if (type === "invite") return INVALID_INVITE_MESSAGE;
  if (type === "recovery" || mode === "recovery") return INVALID_RECOVERY_MESSAGE;
  return INVALID_AUTH_LINK_MESSAGE;
}

/**
 * Pagina universale di conferma auth — sostituisce /api/auth/callback per tutti i
 * flussi che consegnano il token via hash fragment o redirect.
 *
 * Casi gestiti:
 *   1. #access_token=...&type=invite|recovery  (implicit flow — Supabase verify URL)
 *   2. ?token_hash=...&type=...                (email OTP diretto — inviti admin API)
 *   3. ?code=...                               (PKCE — resetPasswordForEmail)
 *
 * La pagina è client-side: solo il browser può leggere il hash fragment,
 * quindi i link scanner delle email non possono consumare i token.
 */
export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const from = parseFrom(searchParams.get("from"));
  const next = parseNext(searchParams.get("next"));
  const mode = searchParams.get("mode"); // "recovery" da resetPasswordForEmail
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function processAuth() {
      // ── Caso 1: hash fragment (implicit flow da Supabase verify URL) ────────
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const hashType = hash.get("type"); // "invite", "recovery", "signup", ecc.

      if (accessToken && refreshToken) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error || !data.user) { setError(invalidLinkMessage(hashType, mode)); return; }

        if (hashType === "invite") {
          window.location.href = `/set-password?from=${from ?? ""}`;
          return;
        }
        if (hashType === "recovery") {
          window.location.href = `/set-password?mode=recovery${from ? `&from=${from}` : ""}`;
          return;
        }
        await redirectToDestination(supabase, data.user.id, from, next);
        return;
      }

      // ── Caso 2: token_hash in query (OTP diretto — alcuni template Supabase) ─
      const tokenHash = searchParams.get("token_hash");
      const queryType = searchParams.get("type") as "invite" | "recovery" | "signup" | "magiclink" | null;

      if (tokenHash && queryType) {
        window.history.replaceState(null, "", window.location.pathname + (from ? `?from=${from}` : ""));
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: queryType });
        if (error || !data.user) { setError(invalidLinkMessage(queryType, mode)); return; }

        if (queryType === "invite") {
          window.location.href = `/set-password?from=${from ?? ""}`;
          return;
        }
        if (queryType === "recovery") {
          window.location.href = `/set-password?mode=recovery${from ? `&from=${from}` : ""}`;
          return;
        }
        await redirectToDestination(supabase, data.user.id, from, next);
        return;
      }

      // ── Caso 3: code PKCE (resetPasswordForEmail con @supabase/ssr) ──────────
      const code = searchParams.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.user) { setError(invalidLinkMessage(null, mode)); return; }

        if (mode === "recovery") {
          window.location.href = `/set-password?mode=recovery${from ? `&from=${from}` : ""}`;
          return;
        }
        await redirectToDestination(supabase, data.user.id, from, next);
        return;
      }

      setError(INVALID_AUTH_LINK_MESSAGE);
    }

    processAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LoginPortalTheme from={from}>
      <div className="flex min-h-screen items-center justify-center bg-[#F5F0EA] p-6">
        <div className="w-full max-w-sm rounded-3xl bg-white px-8 py-12 shadow-xl shadow-black/5 text-center">
          {error ? (
            <>
              <p className="text-xl font-bold">Link non valido</p>
              <p className="mt-2 text-sm text-black/50">{error}</p>
              <a
                href={from ? `/?from=${from}` : "/"}
                className="mt-6 inline-block rounded-xl bg-[#B8332E] px-6 py-2.5 text-sm font-bold text-white"
              >
                Torna al login
              </a>
            </>
          ) : (
            <>
              <Loader2 size={28} className="mx-auto animate-spin text-black/20" />
              <p className="mt-4 text-sm text-black/40">Verifica in corso…</p>
            </>
          )}
        </div>
      </div>
    </LoginPortalTheme>
  );
}

async function redirectToDestination(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  userId: string,
  from: ReturnType<typeof parseFrom>,
  next: string | null,
) {
  const access = await resolveUserAccess(supabase, userId);
  const destination = resolveDestination({
    from,
    next,
    isSiteadmin: access.isSiteadmin,
    tenantId: access.tenantId,
  });
  window.location.href = destination;
}
