import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Gestisce i redirect post-email di Supabase:
 * - type=invite   → admin.menuary.it, dopo verifica va a /set-password
 * - type=recovery → clienti.menuary.it, dopo verifica va a /recupera-password
 * - type=signup   → clienti.menuary.it, dopo verifica va a / (o ?next=)
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
  const next = searchParams.get("next");

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      if (type === "invite") {
        // Utente admin invitato → imposta la sua password
        return NextResponse.redirect(`${origin}/set-password`);
      }
      if (type === "recovery") {
        // Reset password → torna alla pagina di recupero per inserire la nuova pw
        return NextResponse.redirect(`${origin}${next ?? "/recupera-password"}`);
      }
      // Conferma email signup → home (o path specificato)
      return NextResponse.redirect(`${origin}${next ?? "/"}`);
    }
  }

  // Token non valido o scaduto
  return NextResponse.redirect(`${origin}/login?error=link-scaduto`);
}
