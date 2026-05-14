import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/revoke-access
 *
 * Revoca l'accesso admin/staff di un utente a un tenant.
 * L'account auth e il profilo cliente rimangono intatti.
 *
 * Autorizzazioni:
 *   - platform_admin → può revocare chiunque
 *   - titolare / manager → può revocare solo staff del proprio tenant
 *
 * Body: { admin_user_id: string }
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const { admin_user_id } = body as { admin_user_id?: string };
  if (!admin_user_id) {
    return NextResponse.json({ error: "admin_user_id richiesto." }, { status: 400 });
  }

  // La funzione DB verifica le autorizzazioni e lancia eccezione se non autorizzato
  const { error } = await supabase.rpc("revoke_tenant_access", {
    p_admin_user_id: admin_user_id,
    p_revoker_user_id: user.id,
  });

  if (error) {
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
    }
    return NextResponse.json({ error: "Errore durante la revoca." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * POST /api/admin/revoke-access?action=restore
 * Ripristina un accesso precedentemente revocato (solo platform_admin).
 */
export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const { admin_user_id } = body as { admin_user_id?: string };
  if (!admin_user_id) {
    return NextResponse.json({ error: "admin_user_id richiesto." }, { status: 400 });
  }

  // Solo platform_admin può ripristinare
  const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const { error } = await supabase
    .from("admin_users")
    .update({ enabled: true })
    .eq("id", admin_user_id);

  if (error) {
    return NextResponse.json({ error: "Errore durante il ripristino." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
