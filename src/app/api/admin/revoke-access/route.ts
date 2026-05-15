import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/revoke-access
 * Revoca accesso di un employee. Body: { employee_id }
 * Autorizzazioni: siteadmin, tenantadmin o manager dello stesso tenant.
 *
 * PUT /api/admin/revoke-access
 * Ripristina accesso (solo siteadmin). Body: { employee_id }
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const { employee_id } = body as { employee_id?: string };
  if (!employee_id) return NextResponse.json({ error: "employee_id richiesto." }, { status: 400 });

  const { error } = await supabase.rpc("revoke_tenant_access", {
    p_employee_id: employee_id,
    p_revoker_user_id: user.id,
  });

  if (error) {
    if (error.message.includes("unauthorized")) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
    if (error.message.includes("not found")) return NextResponse.json({ error: "Dipendente non trovato." }, { status: 404 });
    return NextResponse.json({ error: "Errore durante la revoca." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const { employee_id } = body as { employee_id?: string };
  if (!employee_id) return NextResponse.json({ error: "employee_id richiesto." }, { status: 400 });

  const { data: isSiteadmin } = await supabase.rpc("is_siteadmin");
  if (!isSiteadmin) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const { error } = await supabase.from("employee").update({ enabled: true }).eq("id", employee_id);
  if (error) return NextResponse.json({ error: "Errore durante il ripristino." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
