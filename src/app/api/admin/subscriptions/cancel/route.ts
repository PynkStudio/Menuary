import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cancelSubscription } from "@/lib/platform/subscription-service";

export const dynamic = "force-dynamic";

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(sa?.role) && hasAdminPermission(sa.role, "crm:create")
    ? user
    : null;
}

// POST /api/admin/subscriptions/cancel — registra il recesso del cliente.
export async function POST(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const subscriptionId = body?.subscriptionId as string | undefined;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : undefined;
  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId obbligatorio" }, { status: 400 });
  }

  try {
    await cancelSubscription(subscriptionId, reason || undefined);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "cancel_failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
