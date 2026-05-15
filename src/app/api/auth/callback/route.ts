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

  if (tokenHash && type) {
    // invite e recovery: NON verificare server-side — i link scanner dei client email
    // (Gmail, Outlook…) eseguono GET su ogni link appena arriva la mail, consumando
    // il token OTP prima che l'utente clicchi. Soluzione: passare il token nel hash
    // fragment verso una pagina client-side; i scanner non eseguono JS quindi il
    // token sopravvive fino al click reale dell'utente.
    if (type === "invite") {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      const hash = `token_hash=${encodeURIComponent(tokenHash)}&type=invite`;
      return NextResponse.redirect(`${origin}/set-password?${params}#${hash}`);
    }

    if (type === "recovery") {
      const params = new URLSearchParams({ mode: "recovery" });
      if (from) params.set("from", from);
      if (next) params.set("next", next);
      const hash = `token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;
      return NextResponse.redirect(`${origin}/set-password?${params}#${hash}`);
    }

    // signup e magiclink: verificare server-side è sicuro (l'utente ha cliccato
    // intenzionalmente; non c'è una password da impostare, il token crea la sessione).
    const supabase = await createSupabaseServerClient(".menuary.it");
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (!error && data.user) {
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("role, tenant_id")
        .eq("auth_user_id", data.user.id)
        .single();

      const role = adminRow?.role ?? null;
      const tenantId = adminRow?.tenant_id ?? null;
      const destination = resolveDestination({ from, next, role, tenantId });

      if (isPopup) {
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
