import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildAuthCallbackUrl } from "@/lib/login-url";
import type { StoreRole } from "@/lib/store-roles";
import type { Database } from "@/lib/supabase/types";

type AdminRole = Database["public"]["Enums"]["admin_role"];

const INVITABLE_ROLES: readonly StoreRole[] = [
  "manager",
  "chef",
  "cameriere",
  "personale_cucina",
];

/**
 * POST /api/gestione/invite-staff
 *
 * Invita un dipendente come membro dello staff di un tenant.
 * Solo titolare / manager / platform_admin del tenant possono invitare.
 *
 * Body: { tenant_slug, email, display_name?, role, permissions? }
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const { tenant_slug, email, display_name, role, permissions } = body as {
    tenant_slug?: string;
    email?: string;
    display_name?: string | null;
    role?: string;
    permissions?: Record<string, boolean>;
  };

  if (!tenant_slug || !email || !role) {
    return NextResponse.json(
      { error: "tenant_slug, email e role sono richiesti." },
      { status: 400 },
    );
  }

  if (!INVITABLE_ROLES.includes(role as StoreRole)) {
    return NextResponse.json(
      { error: `Ruolo non valido. Ammessi: ${INVITABLE_ROLES.join(", ")}.` },
      { status: 400 },
    );
  }

  // Verifica autorizzazione: titolare/manager del tenant o platform admin
  const { data: invokerRow } = await supabase
    .from("admin_users")
    .select("role, tenant_id")
    .eq("auth_user_id", user.id)
    .eq("enabled", true)
    .single();

  const isPlatformAdmin =
    invokerRow?.role === "platform_admin" || invokerRow?.role === "tenant_admin";
  const isTitolareOrManager =
    invokerRow?.tenant_id === tenant_slug &&
    (invokerRow?.role === "titolare" || invokerRow?.role === "manager");

  if (!isPlatformAdmin && !isTitolareOrManager) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  // Inserisci la riga admin_users (auth_user_id verrà collegato dal trigger
  // quando l'utente accetta l'invito)
  const { error: insertError } = await supabase.from("admin_users").insert({
    email,
    tenant_id: tenant_slug,
    role: role as AdminRole,
    display_name: display_name ?? null,
    permissions: (permissions ?? {}) as never,
    invited_by: user.id,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Esiste già un membro dello staff con questa email." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Invia l'invito Supabase con redirect su login.menuary.it
  const adminClient = createSupabaseAdminClient();
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: buildAuthCallbackUrl(`gestione.${tenant_slug}`) },
  );

  if (inviteError) {
    // Rollback admin_users se l'email non è stata inviata
    await supabase
      .from("admin_users")
      .delete()
      .eq("email", email)
      .eq("tenant_id", tenant_slug);
    return NextResponse.json(
      { error: `Errore invio email: ${inviteError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
