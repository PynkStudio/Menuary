import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole, type SiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Returns all enabled siteadmin users — used to populate venditore assignment dropdowns.
// Requires crm:view permission.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { data: me } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  const role = isSiteadminRole(me?.role) ? (me!.role as SiteadminRole) : null;
  if (!hasAdminPermission(role, "crm:view")) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("siteadmin")
    .select("id, user_id, email, display_name, role")
    .eq("enabled", true)
    .in("role", ["admin", "venditore"])
    .order("display_name", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    venditori: (data ?? []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.display_name ?? row.email,
      email: row.email,
      role: row.role,
    })),
  });
}
