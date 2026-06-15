import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
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

  if (!isSiteadminRole(siteadmin?.role) || !hasAdminPermission(siteadmin.role, "subscriptions:view")) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ count: 0 });

  // Contratti che richiedono un'azione del fornitore: firmati dal cliente e in
  // attesa della controfirma.
  const { count, error } = await db
    .from("platform_contracts")
    .select("id", { count: "exact", head: true })
    .eq("status", "signed");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
