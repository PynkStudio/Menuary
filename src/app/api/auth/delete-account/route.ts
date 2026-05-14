import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/auth/delete-account
 *
 * Elimina l'account cliente. Blocca se l'utente ha ancora accessi admin attivi
 * (deve essere rimosso dai tenant prima della cancellazione).
 */
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  // Verifica che non ci siano accessi admin attivi
  const { count } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq("auth_user_id", user.id)
    .eq("enabled", true);

  if (count && count > 0) {
    return NextResponse.json(
      {
        error:
          "Account associato a uno o più locali. Chiedi ai titolari di rimuoverti prima di eliminare l'account.",
        code: "has_active_staff_roles",
      },
      { status: 409 },
    );
  }

  // Elimina profilo e poi l'utente auth (via service role)
  await supabase.from("user_profiles").delete().eq("user_id", user.id);

  const adminClient = createSupabaseAdminClient();
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Impossibile eliminare l'account. Riprova o contatta il supporto." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
