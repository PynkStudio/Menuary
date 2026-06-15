import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { getContract, updateContract } from "@/lib/contracts/contract-queries";
import { downloadSignedDocument } from "@/lib/contracts/documenso";
import { FORNITORE } from "@/lib/contracts/menuary-contract";

export const dynamic = "force-dynamic";

async function requireAdmin() {
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
  const user = await requireAdmin();
  if (!user) {
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

  if (contract.status !== "signed") {
    return NextResponse.json(
      {
        error: `Il contratto deve essere in stato "signed", attuale: "${contract.status}"`,
      },
      { status: 400 },
    );
  }

  if (!contract.documenso_item_id) {
    return NextResponse.json(
      { error: "Nessun documento Documenso associato al contratto" },
      { status: 400 },
    );
  }

  // Download signed PDF from Documenso
  let countersignedPath: string;
  try {
    const signedPdf = await downloadSignedDocument(
      contract.documenso_item_id,
      contract.contract_data.documenso_provider ?? undefined,
    );
    const db = createSupabaseServiceClient();
    if (!db) {
      return NextResponse.json(
        { error: "Servizio di archiviazione non configurato" },
        { status: 500 },
      );
    }
    const path = `contracts/${contract.id}/controfirmato-${contract.numero}.pdf`;
    const { error: uploadError } = await db.storage
      .from("platform-documents")
      .upload(path, signedPdf, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadError) throw new Error(uploadError.message);
    countersignedPath = path;
  } catch (err) {
    return NextResponse.json(
      { error: `Download PDF firmato fallito: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  const adminName =
    user.user_metadata?.full_name || user.email || FORNITORE.legaleRappresentante;

  const updatedContractData = {
    ...contract.contract_data,
    countersigned: {
      at: new Date().toISOString(),
      by: adminName,
      documentPath: countersignedPath,
    },
  };

  const updated = await updateContract(contractId, {
    status: "countersigned",
    signed_document_path: countersignedPath,
    contract_data: updatedContractData,
  });

  return NextResponse.json({ contract: updated });
}
