import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { getContract, updateContract } from "@/lib/contracts/contract-queries";
import {
  getEnvelope,
  downloadSignedDocument,
} from "@/lib/contracts/documenso";
import { ensureCustomerSignatureFulfillment } from "@/lib/contracts/customer-signature";
import { FORNITORE } from "@/lib/contracts/menuary-contract";

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

  if (!contract.documenso_envelope_id) {
    return NextResponse.json(
      { error: "Contratto non inviato su Documenso" },
      { status: 400 },
    );
  }

  let envelope;
  try {
    envelope = await getEnvelope(
      contract.documenso_envelope_id,
      contract.contract_data.documenso_provider ?? undefined,
    );
  } catch (err) {
    console.error("[contracts/sync] getEnvelope failed", err);
    return NextResponse.json(
      {
        error: `Errore Documenso: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 502 },
    );
  }

  const updates: Record<string, unknown> = {};
  let synced = false;
  const customerSigningUrl =
    envelope.recipients.find((recipient) => recipient.signingOrder === 1)
      ?.signingUrl ?? null;
  const counterpartySigningUrl =
    envelope.recipients.find((recipient) => recipient.signingOrder === 2)
      ?.signingUrl ?? null;
  if (!contract.signing_url && customerSigningUrl) {
    updates.signing_url = customerSigningUrl;
  }
  if (!contract.counterparty_signing_url && counterpartySigningUrl) {
    updates.counterparty_signing_url = counterpartySigningUrl;
  }
  const firstSigner =
    envelope.recipients.find((recipient) => recipient.signingOrder === 1) ??
    envelope.recipients[0];
  const customerSigned =
    firstSigner?.signingStatus === "SIGNED" ||
    envelope.status === "COMPLETED";

  if (
    customerSigned &&
    contract.status === "sent"
  ) {
    updates.status = "signed";
    updates.signed_at =
      firstSigner?.signedAt ?? envelope.completedAt ?? new Date().toISOString();
    synced = true;

    const itemId =
      contract.documenso_item_id ?? envelope.envelopeItems?.[0]?.id ?? null;

    if (itemId && !contract.signed_document_path) {
      try {
        const signedPdf = await downloadSignedDocument(
          String(itemId),
          contract.contract_data.documenso_provider ?? undefined,
        );
        const path = `contracts/${contract.id}/firmato-${contract.numero}.pdf`;
        const db = createSupabaseServiceClient();
        if (db) {
          await db.storage
            .from("platform-documents")
            .upload(path, signedPdf, {
              contentType: "application/pdf",
              upsert: true,
            });
          updates.signed_document_path = path;
        }
      } catch (err) {
        console.error("[contracts/sync] Download signed PDF failed", err);
      }
    }

    if (!contract.documenso_item_id && envelope.envelopeItems?.[0]?.id) {
      updates.documenso_item_id = String(envelope.envelopeItems[0].id);
    }
  }

  let updatedContract = contract;
  if (Object.keys(updates).length > 0) {
    updatedContract = await updateContract(contract.id, updates);
  }
  if (
    updatedContract.status === "signed" &&
    !updatedContract.subscription_id
  ) {
    try {
      await ensureCustomerSignatureFulfillment(updatedContract);
      updatedContract = (await getContract(contract.id)) ?? updatedContract;
    } catch (err) {
      console.error("[contracts/sync] Signature fulfillment failed", err);
      return NextResponse.json(
        {
          error: `Firma sincronizzata, ma pagamento non creato: ${
            err instanceof Error ? err.message : String(err)
          }`,
          contract: updatedContract,
          synced,
          envelopeStatus: envelope.status,
        },
        { status: 502 },
      );
    }
  }
  if (
    envelope.status === "COMPLETED" &&
    updatedContract.status === "signed"
  ) {
    updatedContract = await updateContract(contract.id, {
      status: "countersigned",
      contract_data: {
        ...updatedContract.contract_data,
        countersigned: {
          at: envelope.completedAt ?? new Date().toISOString(),
          by: FORNITORE.legaleRappresentante,
          documentPath: updatedContract.signed_document_path ?? "",
        },
      },
    });
    synced = true;
  }

  return NextResponse.json({
    contract: updatedContract,
    synced,
    envelopeStatus: envelope.status,
  });
}
