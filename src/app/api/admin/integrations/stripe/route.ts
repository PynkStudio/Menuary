import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import {
  getTenantPaymentAccount,
  markAccountDisconnected,
} from "@/lib/payments/stripe/accounts";
import {
  refreshAccountStatus,
  revokeConnectedAccount,
} from "@/lib/payments/stripe/connect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireSiteAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(sa?.role) && hasAdminPermission(sa.role, "tenant:manage") ? user : null;
}

// GET /api/admin/integrations/stripe?tenantId=...&refresh=1
//   Restituisce lo stato del collegamento Stripe per il tenant.
//   Se refresh=1 e l'account è collegato, rilegge lo stato da Stripe.
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!await requireSiteAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const refresh = url.searchParams.get("refresh") === "1";
  const demoSandbox = url.searchParams.get("demoSandbox") === "1";
  if (!tenantId) return NextResponse.json({ error: "tenantId_required" }, { status: 400 });

  try {
    let account = await getTenantPaymentAccount(tenantId, { demoSandbox });
    if (refresh && account?.stripeAccountId && account.mode === "tenant_connect") {
      account = await refreshAccountStatus({
        tenantId,
        stripeAccountId: account.stripeAccountId,
      });
    }
    return NextResponse.json({ account });
  } catch (err) {
    const message = err instanceof Error ? err.message : "lookup_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/integrations/stripe?tenantId=...
//   Revoca l'OAuth lato Stripe e marca l'account come disconnesso nel DB.
export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!await requireSiteAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId_required" }, { status: 400 });

  try {
    const account = await getTenantPaymentAccount(tenantId);
    if (account?.stripeAccountId && account.mode === "tenant_connect") {
      // Best-effort: se Stripe risponde "already revoked" lo ignoriamo.
      try {
        await revokeConnectedAccount(account.stripeAccountId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (!/already|not_connected/i.test(msg)) throw err;
      }
    }
    await markAccountDisconnected(tenantId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "disconnect_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
