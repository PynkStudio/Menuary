import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildAuthCallbackUrl } from "@/lib/login-url";
import { type EmployeeRole } from "@/lib/store-roles";

const INVITABLE_ROLES: readonly EmployeeRole[] = [
  "manager",
  "chef",
  "cameriere",
  "personale_cucina",
];

/**
 * POST /api/gestione/invite-staff
 *
 * Invita un dipendente nel tenant. Solo tenantadmin, manager employee o siteadmin.
 * Body: { tenant_slug, email, display_name?, role, permissions? }
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
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
    return NextResponse.json({ error: "tenant_slug, email e role sono richiesti." }, { status: 400 });
  }

  if (!INVITABLE_ROLES.includes(role as EmployeeRole)) {
    return NextResponse.json(
      { error: `Ruolo non valido. Ammessi: ${INVITABLE_ROLES.join(", ")}.` },
      { status: 400 },
    );
  }

  // Verifica autorizzazione: siteadmin, tenantadmin di quel tenant, o manager employee
  const [{ data: sa }, { data: ta }, { data: mgr }] = await Promise.all([
    supabase.from("siteadmin").select("id").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    supabase.from("tenantadmin").select("id").eq("user_id", user.id).eq("tenant_id", tenant_slug).eq("enabled", true).maybeSingle(),
    supabase.from("employee").select("id").eq("user_id", user.id).eq("tenant_id", tenant_slug).eq("role", "manager").eq("enabled", true).maybeSingle(),
  ]);

  if (!sa && !ta && !mgr) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  // Invia invito Supabase — il trigger crea customer, poi qui inseriamo employee
  const adminClient = createSupabaseAdminClient();
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: buildAuthCallbackUrl(`gestione.${tenant_slug}`) },
  );

  if (inviteError) {
    return NextResponse.json({ error: `Errore invio email: ${inviteError.message}` }, { status: 500 });
  }

  // Il trigger ha già creato il customer. Ora crea l'employee record.
  const { error: insertError } = await supabase.from("employee").insert({
    user_id: inviteData.user.id,
    email,
    tenant_id: tenant_slug,
    role: role as EmployeeRole,
    display_name: display_name ?? null,
    permissions: (permissions ?? {}) as never,
    invited_by: user.id,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Esiste già un membro dello staff con questa email." }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
