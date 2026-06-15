import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { activateSubscription } from "@/lib/platform/subscription-service";

export const dynamic = "force-dynamic";

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: admin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(admin?.role) && hasAdminPermission(admin.role, "crm:create");
}

export async function POST(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const paymentId = body?.paymentId as string | undefined;
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId obbligatorio" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  if (!db) {
    return NextResponse.json({ error: "Servizio non configurato" }, { status: 503 });
  }

  const { data, error } = await db
    .from("platform_payments")
    .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", paymentId)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Pagamento non trovato" }, { status: 404 });
  }

  if ((data as { kind?: string; subscription_id?: string }).kind === "first") {
    await activateSubscription((data as { subscription_id: string }).subscription_id).catch(() => undefined);
  }

  return NextResponse.json({ payment: data });
}
