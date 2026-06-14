import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: lead, error: findError } = await admin
    .from("platform_leads")
    .select("sales_owner_id")
    .eq("id", id)
    .maybeSingle();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
  if (!lead) return NextResponse.json({ error: "Lead non trovato." }, { status: 404 });
  if (lead.sales_owner_id !== user.id) return NextResponse.json({ ok: true, cleared: false });

  const { error } = await admin
    .from("platform_leads")
    .update({
      attention_kind: null,
      attention_for_user_id: null,
      attention_updated_at: null,
    } as never)
    .eq("id", id)
    .eq("sales_owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, cleared: true });
}
