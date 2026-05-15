import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/auth/delete-account
 *
 * Elimina l'account utente. Blocca se ha ancora accessi attivi come employee o tenantadmin
 * (deve essere rimosso dai tenant prima della cancellazione).
 * Eliminare customer elimina in cascata tutti i record di ruolo collegati.
 */
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  // Blocca se ha accessi attivi come employee o tenantadmin
  const [{ count: empCount }, { count: taCount }] = await Promise.all([
    supabase.from("employee").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("enabled", true),
    supabase.from("tenantadmin").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("enabled", true),
  ]);

  if ((empCount ?? 0) > 0 || (taCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error: "Account associato a uno o più locali. Chiedi ai titolari di rimuoverti prima di eliminare l'account.",
        code: "has_active_roles",
      },
      { status: 409 },
    );
  }

  // Elimina l'utente auth — customer si elimina in cascata (ON DELETE CASCADE)
  const adminClient = createSupabaseAdminClient();
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: "Impossibile eliminare l'account. Riprova o contatta il supporto." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
