import { NextResponse } from "next/server";
import { isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { data: siteadmin, error } = await supabase
    .from("siteadmin")
    .select("id, role, email, display_name")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!siteadmin || !isSiteadminRole(siteadmin.role)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  return NextResponse.json({
    id: siteadmin.id,
    email: siteadmin.email,
    name: siteadmin.display_name ?? siteadmin.email,
    role: siteadmin.role,
  });
}
