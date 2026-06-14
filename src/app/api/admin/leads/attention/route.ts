import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (!isSiteadminRole(siteadmin?.role) || !hasAdminPermission(siteadmin.role, "crm:view")) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("platform_leads")
    .select("id", { count: "exact", head: true })
    .not("attention_kind", "is", null)
    .or(`sales_owner_id.is.null,attention_for_user_id.eq.${user.id}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
