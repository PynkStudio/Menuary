import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import {
  listSentContracts,
  updateContract,
} from "@/lib/contracts/contract-queries";
import {
  getEnvelope,
  downloadSignedDocument,
} from "@/lib/contracts/documenso";

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

  const sentContracts = await listSentContracts();
  if (sentContracts.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  let syncedCount = 0;

  for (const contract of sentContracts) {
    if (!contract.documenso_envelope_id) continue;

    try {
      const envelope = await getEnvelope(
        contract.documenso_envelope_id,
        contract.contract_data.documenso_provider ?? undefined,
      );
      if (envelope.status !== "COMPLETED") continue;

      const updates: Record<string, unknown> = {
        status: "signed",
        signed_at: envelope.completedAt ?? new Date().toISOString(),
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

      await updateContract(contract.id, updates);
      syncedCount++;
    } catch (err) {
      console.error(
        "[contracts/sync-all] Failed for",
        contract.numero,
        err,
      );
    }
  }

  return NextResponse.json({ synced: syncedCount, checked: sentContracts.length });
}
