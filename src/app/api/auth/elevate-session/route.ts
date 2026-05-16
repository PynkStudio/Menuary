import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_DEST = /^https:\/\/[a-z0-9-]+\.menuary\.it(\/.*)?$/;

function safeDestination(raw: string | null): string {
  if (!raw) return "https://admin.menuary.it";
  try {
    const dest = decodeURIComponent(raw);
    if (ALLOWED_DEST.test(dest)) return dest;
  } catch {}
  return "https://admin.menuary.it";
}

/**
 * GET ?destination=...
 * Legge la sessione corrente dai cookie (login.menuary.it),
 * la riscrive con Domain=.menuary.it via refreshSession(),
 * poi redirige alla destinazione.
 * Usato dal login portal quando l'utente è già loggato.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = safeDestination(searchParams.get("destination"));

  const supabase = await createSupabaseServerClient(".menuary.it");
  // refreshSession() chiama sempre setAll → scrive cookie con Domain=.menuary.it
  await supabase.auth.refreshSession();

  return NextResponse.redirect(new URL(destination));
}

/**
 * POST { access_token, refresh_token }
 * Riceve i token da un login appena completato lato client,
 * li persiste come cookie con Domain=.menuary.it.
 * Usato dal LoginPortalForm dopo signInWithPassword.
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

  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error || !data.session) {
    return NextResponse.json({ error: "invalid session" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
