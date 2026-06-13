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

  const data = contract.contract_data;
  const adminName = user.user_metadata?.full_name || user.email || FORNITORE.legaleRappresentante;
  const db = createSupabaseServiceClient();
  if (!db) {
    return NextResponse.json(
      { error: "Servizio di archiviazione non configurato" },
      { status: 500 },
    );
  }

  // Download signed PDF from Documenso
  let countersignedPath: string;
  try {
    if (!contract.documenso_item_id) {
      return NextResponse.json(
        { error: "Nessun documento Documenso associato al contratto" },
        { status: 400 },
      );
    }
    const signedPdf = await downloadSignedDocument(contract.documenso_item_id);
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

  // Update contract: countersign status + metadata
  await updateContract(contractId, {
    status: "countersigned",
    signed_document_path: countersignedPath,
  });

  // Update contract_data JSONB with countersign metadata
  const updatedData = {
    ...data,
    countersigned: {
      at: new Date().toISOString(),
      by: adminName,
      documentPath: countersignedPath,
    },
  };

  const { error: updateDataError } = await db
    .from("platform_contracts")
    .update({
      contract_data: updatedData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  if (updateDataError) {
    console.error("[countersign] Failed to update contract_data", updateDataError);
  }

  const updated = await getContract(contractId);
  return NextResponse.json({ contract: updated });
}
