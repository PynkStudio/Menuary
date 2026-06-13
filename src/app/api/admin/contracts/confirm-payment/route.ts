import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { getContract, updateContract } from "@/lib/contracts/contract-queries";

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

export async function POST(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const contractId = body?.contractId as string | undefined;
  if (!contractId) {
    return NextResponse.json(
      { error: "contractId obbligatorio" },
      { status: 400 },
    );
  }

  const contract = await getContract(contractId);
  if (!contract) {
    return NextResponse.json(
      { error: "Contratto non trovato" },
      { status: 404 },
    );
  }

  if (contract.status !== "signed" && contract.status !== "countersigned") {
    return NextResponse.json(
      { error: `Il contratto deve essere in stato "signed" o "countersigned", attuale: "${contract.status}"` },
      { status: 400 },
    );
  }

  // Update contract: payment confirmed + countersigned
  await updateContract(contractId, {
    payment_status: "paid",
    paid_at: new Date().toISOString(),
    status: "countersigned",
  });

  // Activate tenant if linked
  const tenantSlug = contract.contract_data?.servizio?.tenantSlug;
  if (tenantSlug) {
    const db = createSupabaseServiceClient();
    if (db) {
      await db
        .from("tenants")
        .update({
          enabled: true,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tenantSlug);

      await updateContract(contractId, {
        tenant_id: tenantSlug,
        tenant_activated_at: new Date().toISOString(),
      });
    }
  }

  const updated = await getContract(contractId);
  return NextResponse.json({ contract: updated });
}
