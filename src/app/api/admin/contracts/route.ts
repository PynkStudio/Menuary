import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import {
  listContracts,
  getContract,
  createContract,
  updateContract,
  deleteContractById,
} from "@/lib/contracts/contract-queries";
import { normalizeContractData, type ContractData } from "@/lib/contracts/menuary-contract";

export const dynamic = "force-dynamic";

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
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

export async function GET(req: NextRequest) {
  if (!await requireSiteAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const contract = await getContract(id);
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ contract });
  }
  const contracts = await listContracts();
  return NextResponse.json({ contracts });
}

export async function POST(req: NextRequest) {
  if (!await requireSiteAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.data?.numero || !body.data.cliente) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const data = normalizeContractData(body.data as ContractData);
  const contract = await createContract({
    numero: data.numero,
    brand: data.brand,
    contract_data: data,
    clause_overrides: body.overrides ?? {},
    lead_id: body.leadId ?? null,
    package_slug: body.packageSlug ?? null,
  });
  return NextResponse.json({ contract }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!await requireSiteAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const { id, ...updates } = (body ?? {}) as { id?: string } & Record<string, unknown>;
  if (!id) {
    return NextResponse.json({ error: "id obbligatorio" }, { status: 400 });
  }
  if (updates.contract_data) {
    updates.contract_data = normalizeContractData(updates.contract_data as ContractData);
  }
  const contract = await updateContract(id, updates);
  return NextResponse.json({ contract });
}

export async function DELETE(req: NextRequest) {
  if (!await requireSiteAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obbligatorio" }, { status: 400 });
  await deleteContractById(id);
  return NextResponse.json({ deleted: true });
}
