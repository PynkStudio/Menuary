import { NextResponse } from "next/server";
import { isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const service = createSupabaseServiceClient();
  if (!service) {
    return NextResponse.json({ error: "Supabase service role non configurata." }, { status: 503 });
  }

  const { data: siteadmin, error } = await service
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
    user_id: user.id,
    email: siteadmin.email,
    name: siteadmin.display_name ?? siteadmin.email,
    role: siteadmin.role,
  });
}
