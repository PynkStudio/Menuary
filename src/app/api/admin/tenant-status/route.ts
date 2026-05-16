import { NextResponse, type NextRequest } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireSiteAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(sa?.role) && hasAdminPermission(sa.role, "tenant:manage") ? user : null;
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { tenantId, enabled } = (body ?? {}) as { tenantId?: string; enabled?: boolean };

  if (!tenantId || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "tenantId e enabled sono obbligatori." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!await requireSiteAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("tenants")
    .update({
      enabled,
      status: enabled ? "active" : "offline",
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tenantId, enabled });
}
