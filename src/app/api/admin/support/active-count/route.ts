import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (!isSiteadminRole(siteadmin?.role) || !hasAdminPermission(siteadmin.role, "support:manage")) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ count: 0 });

  const { count, error } = await db
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .not("status", "in", '("resolved","closed")');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
