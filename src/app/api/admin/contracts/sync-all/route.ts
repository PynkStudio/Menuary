import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import {
  listContractsNeedingDocumensoSync,
  updateContract,
} from "@/lib/contracts/contract-queries";
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

export async function POST() {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contracts = await listContractsNeedingDocumensoSync();
  if (contracts.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  let syncedCount = 0;

  for (const contract of contracts) {
    if (!contract.documenso_envelope_id) continue;

    try {
      const envelope = await getEnvelope(
        contract.documenso_envelope_id,
        contract.contract_data.documenso_provider ?? undefined,
      );
      const customerSigningUrl =
        envelope.recipients.find((recipient) => recipient.signingOrder === 1)
          ?.signingUrl ?? null;
      const counterpartySigningUrl =
        envelope.recipients.find((recipient) => recipient.signingOrder === 2)
          ?.signingUrl ?? null;
      const linkUpdates: Record<string, unknown> = {};
      if (!contract.signing_url && customerSigningUrl) {
        linkUpdates.signing_url = customerSigningUrl;
      }
      if (!contract.counterparty_signing_url && counterpartySigningUrl) {
        linkUpdates.counterparty_signing_url = counterpartySigningUrl;
      }

      if (contract.status === "signed") {
        await ensureCustomerSignatureFulfillment(contract);
        const signedUpdates: Record<string, unknown> = { ...linkUpdates };
        if (envelope.status === "COMPLETED") {
          signedUpdates.status = "countersigned";
          signedUpdates.contract_data = {
            ...contract.contract_data,
            countersigned: {
              at: envelope.completedAt ?? new Date().toISOString(),
              by: FORNITORE.legaleRappresentante,
              documentPath: contract.signed_document_path ?? "",
            },
          };
        }
        if (Object.keys(signedUpdates).length > 0) {
          await updateContract(contract.id, signedUpdates);
        }
        syncedCount++;
        continue;
      }
      const firstSigner =
        envelope.recipients.find((recipient) => recipient.signingOrder === 1) ??
        envelope.recipients[0];
      const customerSigned =
        firstSigner?.signingStatus === "SIGNED" ||
        envelope.status === "COMPLETED";
      if (!customerSigned) {
        if (Object.keys(linkUpdates).length > 0) {
          await updateContract(contract.id, linkUpdates);
        }
        continue;
      }

      const updates: Record<string, unknown> = {
        ...linkUpdates,
        status: "signed",
        signed_at:
          firstSigner?.signedAt ??
          envelope.completedAt ??
          new Date().toISOString(),
      };
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
          console.error(
            "[contracts/sync-all] Download signed PDF failed for",
            contract.numero,
            err,
          );
        }
      }

      if (!contract.documenso_item_id && envelope.envelopeItems?.[0]?.id) {
        updates.documenso_item_id = String(envelope.envelopeItems[0].id);
      }

      const updatedContract = await updateContract(contract.id, updates);
      await ensureCustomerSignatureFulfillment(updatedContract);
      syncedCount++;
    } catch (err) {
      console.error(
        "[contracts/sync-all] Failed for",
        contract.numero,
        err,
      );
    }
  }

  return NextResponse.json({ synced: syncedCount, checked: contracts.length });
}
