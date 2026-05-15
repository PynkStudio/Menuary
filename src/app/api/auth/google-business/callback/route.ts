import { NextResponse } from "next/server";
import { exchangeCodeAndSave } from "@/lib/google/my-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/gestione?google_auth=error&reason=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  // Decodifica il tenantId dallo state
  let tenantId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    tenantId = decoded.tenantId;
    if (!tenantId) throw new Error("tenantId mancante");
  } catch {
    return NextResponse.json({ error: "State non valido" }, { status: 400 });
  }

  // Verifica che l'utente loggato sia admin del tenant
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/gestione/${tenantId}?google_auth=unauthorized`);
  }

  try {
    await exchangeCodeAndSave(tenantId, code, user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.redirect(
      `${origin}/gestione/${tenantId}/google?google_auth=error&reason=${encodeURIComponent(msg)}`,
    );
  }

  // TODO(google-reserve): dopo che Google ci approva come Actions Center partner,
  // in questo callback (o in exchangeCodeAndSave) richiedere anche lo scope
  // "https://www.googleapis.com/auth/mapsbooking" oltre a quelli già presenti.
  // Lo stesso refresh token potrà essere usato sia per My Business che per Actions Center.

  // Dopo aver salvato il token, mandiamo il gestore alla selezione sede
  return NextResponse.redirect(
    `${origin}/gestione/${tenantId}/google?google_auth=ok&step=select-location`,
  );
}
