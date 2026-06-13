import { NextRequest, NextResponse } from "next/server";
import {
  verifyDocumensoWebhook,
  downloadSignedDocument,
  type DocumensoWebhookPayload,
} from "@/lib/contracts/documenso";
import {
  getContractByEnvelopeId,
  updateContract,
} from "@/lib/contracts/contract-queries";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createContractPayment } from "@/lib/contracts/contract-checkout";
import { sendEmail, PLATFORM_BRANDS } from "@/lib/email/sender";
import { BRAND_INFO, FORNITORE, type ContractBrand } from "@/lib/contracts/menuary-contract";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-documenso-secret");
  if (!verifyDocumensoWebhook(secret)) {
    return NextResponse.json({ error: "invalid_secret" }, { status: 401 });
  }

  let payload: DocumensoWebhookPayload;
  try {
    payload = (await req.json()) as DocumensoWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  console.log("[documenso-webhook]", payload.event, payload.payload?.id);

  if (payload.event !== "DOCUMENT_COMPLETED") {
    return NextResponse.json({ received: true, handled: false });
  }

  const envelopeId = payload.payload?.externalId
    ? null
    : String(payload.payload?.id);

  const contract = payload.payload?.externalId
    ? await getContractByEnvelopeId(
        // externalId was set to the contract UUID, but documenso_envelope_id stores the envelope id
        // Try both approaches
        payload.payload.externalId,
      ).then((c) => c ?? getContractByEnvelopeIdFallback(payload))
    : await getContractByEnvelopeIdFallback(payload);

  if (!contract) {
    console.warn("[documenso-webhook] Contract not found for envelope", payload.payload?.id);
    return NextResponse.json({ received: true, error: "contract_not_found" });
  }

  // Download signed PDF
  let signedDocPath: string | null = null;
  if (contract.documenso_item_id) {
    try {
      const signedPdf = await downloadSignedDocument(contract.documenso_item_id);
      signedDocPath = await uploadSignedPdf(
        contract.id,
        contract.numero,
        signedPdf,
      );
    } catch (err) {
      console.error("[documenso-webhook] Download signed PDF failed", err);
    }
  }

  // Update contract status
  await updateContract(contract.id, {
    status: "signed",
    signed_at: new Date().toISOString(),
    signed_document_path: signedDocPath,
  });

  // Route payment based on contract method
  await handlePaymentByMethod(contract.id, contract.contract_data, contract.numero);

  return NextResponse.json({ received: true, handled: true });
}

async function getContractByEnvelopeIdFallback(
  payload: DocumensoWebhookPayload,
) {
  const docId = String(payload.payload?.id);
  // Documenso sends numeric IDs but we store the envelope_xxx format
  // Try matching both
  const byExact = await getContractByEnvelopeId(docId);
  if (byExact) return byExact;

  const withPrefix = `envelope_${docId}`;
  return getContractByEnvelopeId(withPrefix);
}

async function uploadSignedPdf(
  contractId: string,
  numero: string,
  pdfBuffer: Buffer,
): Promise<string> {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");

  const path = `contracts/${contractId}/firmato-${numero}.pdf`;
  const { error } = await db.storage
    .from("platform-documents")
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (error) throw new Error(error.message);
  return path;
}

async function handlePaymentByMethod(
  contractId: string,
  data: import("@/lib/contracts/menuary-contract").ContractData,
  numero: string,
) {
  try {
    const result = await createContractPayment(contractId, data);
    const brandMeta = BRAND_INFO[data.brand as ContractBrand];
    const emailBrand = PLATFORM_BRANDS[brandMeta.vertical];
    const signerEmail = data.cliente.email || data.cliente.pec;

    switch (result.provider) {
      case "stripe": {
        if (result.sessionId) {
          await updateContract(contractId, {
            stripe_checkout_session_id: result.sessionId,
          });
        }
        if (signerEmail && result.checkoutUrl) {
          await sendEmail({
            to: signerEmail,
            subject: `Pagamento contratto ${numero} — ${emailBrand.name}`,
            html: buildPaymentEmailHtml(data, result.checkoutUrl, numero),
          });
        }
        break;
      }

      case "bunq": {
        if (result.bunqShareUrl && signerEmail) {
          await sendEmail({
            to: signerEmail,
            subject: `Pagamento contratto ${numero} — ${emailBrand.name}`,
            html: buildPaymentEmailHtml(data, result.bunqShareUrl, numero),
          });
        }
        break;
      }

      case "bonifico": {
        await sendEmail({
          to: FORNITORE.email,
          subject: `[${emailBrand.name}] Contratto ${numero} firmato — in attesa di bonifico`,
          html: `<p>Il contratto <strong>${numero}</strong> di <strong>${data.cliente.ragioneSociale}</strong> è stato firmato elettronicamente.</p>
                 <p>Metodo di pagamento: <strong>bonifico</strong>. Il webhook Bunq aggiornerà lo stato automaticamente quando il pagamento verrà ricevuto.</p>`,
        });
        break;
      }
    }
  } catch (err) {
    console.error("[documenso-webhook] Payment creation failed", err);
  }
}

function buildPaymentEmailHtml(
  data: import("@/lib/contracts/menuary-contract").ContractData,
  checkoutUrl: string,
  numero: string,
): string {
  const brandMeta = BRAND_INFO[data.brand as ContractBrand];
  const brand = PLATFORM_BRANDS[brandMeta.vertical];
  const { formatEUR, computeFirstPaymentTotal } =
    require("@/lib/contracts/menuary-contract") as typeof import("@/lib/contracts/menuary-contract");
  const firstPayment = computeFirstPaymentTotal(data.economiche);

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,system-ui,sans-serif;background:${brand.bg};color:${brand.text}">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
  <span style="display:inline-block;padding:4px 12px;background:${brand.primary};color:#fff;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase">${brand.name}</span>

  <h2 style="margin-top:20px">Contratto firmato — procedi al pagamento</h2>

  <p>Grazie per aver firmato il contratto <strong>${numero}</strong>!</p>

  <p>Per completare l'attivazione del servizio, proceda al pagamento del primo importo complessivo di <strong>${formatEUR(firstPayment)}</strong>.</p>

  <div style="margin:24px 0;text-align:center">
    <a href="${checkoutUrl}" style="display:inline-block;padding:14px 32px;background:${brand.primary};color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">
      Procedi al pagamento
    </a>
  </div>

  <p style="font-size:12px;color:${brand.muted}">Il link di pagamento è valido per 2 ore.</p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:11px;color:${brand.muted}">
    ${brand.name} · ${FORNITORE.ragioneSociale}
  </p>
</div>
</body>
</html>`;
}
