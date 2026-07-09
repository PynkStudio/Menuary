import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function canViewErrors() {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(data?.role) && hasAdminPermission(data.role, "errors:view");
}

export async function GET() {
  if (!await canViewErrors()) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("platform_error_events" as never)
    .select("id", { count: "exact", head: true })
    .not("status", "in", "(resolved,ignored)");
  if (error) return NextResponse.json({ count: 0 });
  return NextResponse.json({ count: count ?? 0 });
}
