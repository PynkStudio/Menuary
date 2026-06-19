import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/set-session
 *
 * Token exchange per domini custom tenant.
 * Riceve access_token + refresh_token dal popup di login.menuary.it
 * tramite postMessage e li scambia con un cookie di sessione sul dominio corrente.
 *
 * Sicurezza:
 * - I token arrivano solo via postMessage (non da URL pubblici)
 * - Il postMessage è già validato sul lato client (isAllowedOrigin)
 * - Supabase verifica la validità del token server-side
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { access_token, refresh_token } = body as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "missing tokens" }, { status: 400 });
  }

  // Nessun cookieDomain -> cookie scoped al dominio corrente.
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error || !data.session) {
    return NextResponse.json({ error: "invalid session" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
