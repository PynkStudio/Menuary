import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseFrom, parseNext, resolveDestination } from "@/lib/login-url";

/**
 * Callback centralizzato per tutti i link email di Supabase.
 * Gestisce: invite, signup confirm, password recovery.
 *
 * Parametri URL:
 *   token_hash  — token Supabase (nei link email)
 *   type        — invite | signup | recovery | magiclink
 *   from        — portale chiamante: admin | studio | clienti | gestione.bepork
 *   next        — path post-login all'interno del portale
 *   popup       — "1" se la verifica arriva da un flusso popup
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "invite"
    | "signup"
    | "recovery"
    | "magiclink"
    | null;
  const from = parseFrom(searchParams.get("from"));
  const next = parseNext(searchParams.get("next"));
  const isPopup = searchParams.get("popup") === "1";

  const supabase = await createSupabaseServerClient();

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error && data.user) {
      // Recupera ruolo e tenant dell'utente da admin_users
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("role, tenant_id")
        .eq("auth_user_id", data.user.id)
        .single();

      const role = adminRow?.role ?? null;
      const tenantId = adminRow?.tenant_id ?? null;

      // Invite → set-password (sempre su login.menuary.it con branding corretto)
      if (type === "invite") {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        return NextResponse.redirect(`${origin}/set-password?${params}`);
      }

      // Recovery → pagina nuova password
      if (type === "recovery") {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (next) params.set("next", next);
        return NextResponse.redirect(`${origin}/set-password?${params}&mode=recovery`);
      }

      // Signup confirm o magiclink → destinazione finale
      const destination = resolveDestination({ from, next, role, tenantId });

      if (isPopup) {
        // Nel popup: redirect a auth-success che fa postMessage e chiude
        const params = new URLSearchParams({ destination });
        if (from) params.set("from", from);
        return NextResponse.redirect(`${origin}/auth-success?${params}`);
      }

      return NextResponse.redirect(destination);
    }
  }

  // Token non valido o scaduto
  const errorParams = new URLSearchParams({ error: "link-scaduto" });
  if (from) errorParams.set("from", from);
  return NextResponse.redirect(`${origin}?${errorParams}`);
}
