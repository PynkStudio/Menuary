import { NextRequest, NextResponse } from "next/server";
import {
  verifyDocumensoWebhook,
  downloadSignedDocument,
  type DocumensoWebhookPayload,
} from "@/lib/contracts/documenso";
import {
  getContract,
  getContractByEnvelopeId,
  getContractByNumero,
  updateContract,
} from "@/lib/contracts/contract-queries";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ensureCustomerSignatureFulfillment } from "@/lib/contracts/customer-signature";
import {
  FORNITORE,
} from "@/lib/contracts/menuary-contract";

export const dynamic = "force-dynamic";

function hasConfiguredDocumensoWebhookSecret(): boolean {
  return Boolean(
    process.env.DOCUMENSO_WEBHOOK_SECRET_SH ||
      process.env.DOCUMENSO_SELF_HOSTED_WEBHOOK_SECRET ||
      process.env.DOCUMENSO_WEBHOOK_SECRET_CLOUD ||
      process.env.DOCUMENSO_CLOUD_WEBHOOK_SECRET ||
      process.env.DOCUMENSO_WEBHOOK_SECRET,
  );
}

function longestConfiguredDocumensoWebhookSecretLength(): number {
  return Math.max(
    0,
    process.env.DOCUMENSO_WEBHOOK_SECRET_SH?.length ?? 0,
    process.env.DOCUMENSO_SELF_HOSTED_WEBHOOK_SECRET?.length ?? 0,
    process.env.DOCUMENSO_WEBHOOK_SECRET_CLOUD?.length ?? 0,
    process.env.DOCUMENSO_CLOUD_WEBHOOK_SECRET?.length ?? 0,
    process.env.DOCUMENSO_WEBHOOK_SECRET?.length ?? 0,
  );
}

export async function POST(req: NextRequest) {
  const secret =
    req.headers.get("x-documenso-secret") ??
    req.headers.get("x-pynkstudio-secret");
  if (!verifyDocumensoWebhook(secret)) {
    // Diagnostica sicura: lunghezze e nomi header, MAI il valore del secret.
    console.warn(
      "[documenso-webhook] secret check FAILED — headerPresent=%s receivedLen=%d expectedConfigured=%s expectedLen=%d headers=%s",
      secret != null,
      secret?.length ?? 0,
      hasConfiguredDocumensoWebhookSecret(),
      longestConfiguredDocumensoWebhookSecretLength(),
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
  if (
    event !== "document.completed" &&
    event !== "document.signed" &&
    event !== "document.recipient.completed" &&
    event !== "document.opened"
  ) {
    return NextResponse.json({ received: true, handled: false });
  }

  const contract = payload.payload?.externalId
    ? await getContract(payload.payload.externalId)
    : await getContractByWebhookPayload(payload);
  if (!contract) {
    console.warn("[documenso-webhook] Contract not found for envelope", payload.payload?.id);
    return NextResponse.json({ received: true, error: "contract_not_found" });
  }

  // Apertura del documento da parte del cliente: registriamo il momento senza
  // cambiare stato (resta "sent"), per mostrarlo in admin/contratti.
  if (event === "document.opened") {
    if (contract.status === "sent" && !contract.contract_data.opened_at) {
      await updateContract(contract.id, {
        contract_data: {
          ...contract.contract_data,
          opened_at: new Date().toISOString(),
        },
      });
    }
    return NextResponse.json({ received: true, handled: true, status: contract.status });
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
      contract.contract_data.documenso_provider ?? undefined,
    );
    await updateContract(contract.id, {
      status: "signed",
      signed_at: new Date().toISOString(),
      signed_document_path: firmatoPath,
    });
    status = "signed";
  }

  if (status === "signed" && !contract.subscription_id) {
    try {
      await ensureCustomerSignatureFulfillment(contract);
    } catch (err) {
      console.error("[documenso-webhook] Signature fulfillment failed", err);
    }
  }

  // Fase 2 — controfirma nostra (documento completato): nessun pagamento.
  // Salviamo la copia controfirmata e la rendiamo disponibile in
  // admin/contratti e in gestione/fatturazione del tenant. Idempotente.
  if (event === "document.completed" && status === "signed") {
    const controfirmatoPath = await downloadAndStore(
      contract.documenso_item_id,
      contract.id,
      `controfirmato-${contract.numero}.pdf`,
      contract.contract_data.documenso_provider ?? undefined,
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
  provider?: "cloud" | "sh" | null,
): Promise<string | null> {
  if (!itemId) return null;
  try {
    const pdf = await downloadSignedDocument(itemId, provider ?? undefined);
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

async function getContractByWebhookPayload(
  payload: DocumensoWebhookPayload,
) {
  const byEnvelope = await getContractByEnvelopeIdFallback(payload);
  if (byEnvelope) return byEnvelope;

  const numero = payload.payload?.title?.match(
    /\b(?:MEN|BIZ|ORP)-\d{4}-\d+\b/i,
  )?.[0];
  return numero ? getContractByNumero(numero.toUpperCase()) : null;
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
