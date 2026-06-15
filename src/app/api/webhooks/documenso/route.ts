import { NextRequest, NextResponse } from "next/server";
import {
  verifyDocumensoWebhook,
  downloadSignedDocument,
  type DocumensoWebhookPayload,
} from "@/lib/contracts/documenso";
import {
  getContract,
  getContractByEnvelopeId,
  updateContract,
} from "@/lib/contracts/contract-queries";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createContractPayment } from "@/lib/contracts/contract-checkout";
import {
  createPendingSubscriptionFromContract,
  attachPaymentProviderRefs,
} from "@/lib/platform/subscription-service";
import { sendEmail, PLATFORM_BRANDS, resolveSenderForVertical } from "@/lib/email/sender";
import {
  BRAND_INFO,
  FORNITORE,
  computeFirstPaymentTotal,
  formatEUR,
  type ContractBrand,
  type ContractData,
} from "@/lib/contracts/menuary-contract";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-documenso-secret");
  if (!verifyDocumensoWebhook(secret)) {
    // Diagnostica sicura: lunghezze e nomi header, MAI il valore del secret.
    console.warn(
      "[documenso-webhook] secret check FAILED — headerPresent=%s receivedLen=%d expectedConfigured=%s expectedLen=%d headers=%s",
      secret != null,
      secret?.length ?? 0,
      Boolean(process.env.DOCUMENSO_WEBHOOK_SECRET),
      process.env.DOCUMENSO_WEBHOOK_SECRET?.length ?? 0,
      JSON.stringify([...req.headers.keys()]),
    );
    return NextResponse.json({ error: "invalid_secret" }, { status: 401 });
  }

  let payload: DocumensoWebhookPayload;
  try {
    payload = (await req.json()) as DocumensoWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  console.log(
    "[documenso-webhook] event=%s id=%s externalId=%s status=%s",
    payload.event,
    payload.payload?.id,
    payload.payload?.externalId,
    payload.payload?.status,
  );

  // Documenso invia eventi tipo "DOCUMENT_COMPLETED"/"DOCUMENT_SIGNED":
  // normalizziamo gli underscore a punto per il confronto.
  const event = payload.event.toLowerCase().replace(/_/g, ".");
  if (event !== "document.completed" && event !== "document.signed") {
    return NextResponse.json({ received: true, handled: false });
  }

  const contract = payload.payload?.externalId
    ? await getContract(payload.payload.externalId)
    : await getContractByEnvelopeIdFallback(payload);
  if (!contract) {
    console.warn("[documenso-webhook] Contract not found for envelope", payload.payload?.id);
    return NextResponse.json({ received: true, error: "contract_not_found" });
  }

  let status = contract.status;

  // Fase 1 — firma del cliente (primo firmatario): il flusso va avanti.
  // Scarichiamo il PDF firmato dal cliente, marchiamo "signed" e avviamo
  // il pagamento. Idempotente: avviene solo una volta, alla transizione
  // da "sent". La firma del fornitore (secondo firmatario) non rientra qui
  // perché lo stato è già oltre "sent".
  if (status === "sent") {
    const firmatoPath = await downloadAndStore(
      contract.documenso_item_id,
      contract.id,
      `firmato-${contract.numero}.pdf`,
    );
    await updateContract(contract.id, {
      status: "signed",
      signed_at: new Date().toISOString(),
      signed_document_path: firmatoPath,
    });
    status = "signed";
    // Abbonamento "in attesa di pagamento" + pagamento pending (canone, scadenza +15gg).
    // Idempotente: parte solo alla transizione da "sent".
    let firstPaymentId: string | null = null;
    try {
      const sub = await createPendingSubscriptionFromContract(contract);
      firstPaymentId = sub?.paymentId ?? null;
    } catch (err) {
      console.error("[documenso-webhook] Subscription creation failed", err);
    }
    await handlePaymentByMethod(contract.id, contract.contract_data, contract.numero, firstPaymentId);
  }

  // Fase 2 — controfirma nostra (documento completato): nessun pagamento.
  // Salviamo la copia controfirmata e la rendiamo disponibile in
  // admin/contratti e in gestione/fatturazione del tenant. Idempotente.
  if (event === "document.completed" && status === "signed") {
    const controfirmatoPath = await downloadAndStore(
      contract.documenso_item_id,
      contract.id,
      `controfirmato-${contract.numero}.pdf`,
    );
    await updateContract(contract.id, {
      status: "countersigned",
      signed_document_path: controfirmatoPath ?? contract.signed_document_path,
      contract_data: {
        ...contract.contract_data,
        countersigned: {
          at: new Date().toISOString(),
          by: FORNITORE.legaleRappresentante,
          documentPath:
            controfirmatoPath ?? contract.signed_document_path ?? "",
        },
      },
    });
    status = "countersigned";
  }

  return NextResponse.json({ received: true, handled: true, status });
}

async function downloadAndStore(
  itemId: string | null,
  contractId: string,
  fileName: string,
): Promise<string | null> {
  if (!itemId) return null;
  try {
    const pdf = await downloadSignedDocument(itemId);
    return await uploadSignedPdf(contractId, fileName, pdf);
  } catch (err) {
    console.error("[documenso-webhook] Download/store PDF failed", fileName, err);
    return null;
  }
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
  fileName: string,
  pdfBuffer: Buffer,
): Promise<string> {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("supabase_service_unconfigured");

  const path = `contracts/${contractId}/${fileName}`;
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
  data: ContractData,
  numero: string,
  paymentId: string | null,
) {
  try {
    const result = await createContractPayment(contractId, data);
    const brandMeta = BRAND_INFO[data.brand as ContractBrand];
    const emailBrand = PLATFORM_BRANDS[brandMeta.vertical];
    const sender = resolveSenderForVertical(brandMeta.vertical);
    const signerEmail = data.cliente.email || data.cliente.pec;

    switch (result.provider) {
      case "stripe": {
        if (result.sessionId) {
          await updateContract(contractId, {
            stripe_checkout_session_id: result.sessionId,
          });
        }
        if (paymentId && result.checkoutUrl) {
          await attachPaymentProviderRefs(paymentId, { stripePaymentLink: result.checkoutUrl });
        }
        if (signerEmail && result.checkoutUrl) {
          await sendEmail({
            to: signerEmail,
            subject: `Pagamento contratto ${numero} — ${emailBrand.name}`,
            html: buildPaymentEmailHtml(data, result.checkoutUrl, numero),
            fromOverride: sender.from,
          });
        }
        break;
      }

      case "bunq": {
        if (paymentId) {
          await attachPaymentProviderRefs(paymentId, {
            bunqRequestId: result.bunqRequestId,
            bunqPaymentUrl: result.bunqShareUrl,
          });
        }
        if (result.bunqShareUrl && signerEmail) {
          await sendEmail({
            to: signerEmail,
            subject: `Pagamento contratto ${numero} — ${emailBrand.name}`,
            html: buildPaymentEmailHtml(data, result.bunqShareUrl, numero),
            fromOverride: sender.from,
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
          fromOverride: sender.from,
        });
        break;
      }
    }
  } catch (err) {
    console.error("[documenso-webhook] Payment creation failed", err);
  }
}

function buildPaymentEmailHtml(
  data: ContractData,
  checkoutUrl: string,
  numero: string,
): string {
  const brandMeta = BRAND_INFO[data.brand as ContractBrand];
  const brand = PLATFORM_BRANDS[brandMeta.vertical];
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
