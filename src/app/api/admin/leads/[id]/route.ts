import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole, type SiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireCrmPermission(permission: Parameters<typeof hasAdminPermission>[1]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { error: "Non autenticato.", status: 401 as const };

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  const role = isSiteadminRole(siteadmin?.role) ? (siteadmin!.role as SiteadminRole) : null;
  if (!hasAdminPermission(role, permission)) {
    return { error: "Non autorizzato.", status: 403 as const };
  }
  return { error: null, status: 200 as const };
}

// PATCH /api/admin/leads/[id]
// Aggiorna campi del lead: sales_owner_id / sales_owner_name, temperature, stage, status, notes.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCrmPermission("crm:view");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID lead mancante." }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body non valido." }, { status: 400 });

  const update: Record<string, unknown> = {};

  if ("sales_owner_id" in body) update.sales_owner_id = body.sales_owner_id ?? null;
  if ("sales_owner_name" in body) update.sales_owner_name = body.sales_owner_name ?? null;
  if ("temperature" in body && ["cold", "warm", "hot"].includes(body.temperature as string)) {
    update.temperature = body.temperature;
  }
  if (
    "stage" in body &&
    ["new", "contacted", "qualified", "demo", "proposal", "contract", "tenant", "lost"].includes(
      body.stage as string,
    )
  ) {
    update.stage = body.stage;
  }
  if (
    "status" in body &&
    ["lead", "prospect", "active", "churned"].includes(body.status as string)
  ) {
    update.status = body.status;
  }
  if ("notes" in body) update.notes = body.notes ?? null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nessun campo aggiornabile nel body." }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("platform_leads")
    .update(update as never)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
