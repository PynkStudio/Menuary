import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { MenuaryContractPdf } from "@/lib/contracts/menuary-contract-pdf";

import {
  normalizeContractData,
  BRAND_INFO,
  formatEUR,
  computeFirstPaymentTotal,
  computeRecurringPaymentTotal,
  computeYearlyTotal,
  contractPaymentDescription,
  taxSuffix,
  paymentMethodLabel,
  isIndividualClient,
  FORNITORE,
  type ContractData,
} from "@/lib/contracts/menuary-contract";
import { getContract, updateContract } from "@/lib/contracts/contract-queries";
import {
  createEnvelope,
  distributeEnvelope,
  getEnvelope,
  buildSignatureFields,
  rewriteDocumensoPublicUrl,
  resolveDocumensoProviderForSend,
  type DocumensoProvider,
} from "@/lib/contracts/documenso";
import { sendEmail, PLATFORM_BRANDS, resolveSenderForVertical } from "@/lib/email/sender";

export const runtime = "nodejs";
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

export async function POST(req: NextRequest) {
  const admin = await requireSiteAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const contractId = body?.contractId as string | undefined;
  if (!contractId) {
    return NextResponse.json({ error: "contractId obbligatorio" }, { status: 400 });
  }

  const contract = await getContract(contractId);
  if (!contract) {
    return NextResponse.json({ error: "Contratto non trovato" }, { status: 404 });
  }

  const data = normalizeContractData(contract.contract_data);
  const overrides = contract.clause_overrides ?? {};

  // 1. Genera PDF
  let pdfBuffer: Buffer;
  try {
    const buf = await renderToBuffer(
      <MenuaryContractPdf data={data} overrides={overrides} />,
    );
    pdfBuffer = Buffer.from(buf);
  } catch (err) {
    console.error("[contracts/send] PDF render failed", err);
    return NextResponse.json({ error: "PDF render failed" }, { status: 500 });
  }

  const pdfFileName = `Contratto-${data.numero}.pdf`;
  const signerEmail = data.cliente.email || data.cliente.pec;
  const signerName =
    data.cliente.legaleRappresentante || data.cliente.ragioneSociale || "Cliente";

  if (!signerEmail) {
    return NextResponse.json(
      { error: "Email o PEC del cliente mancante" },
      { status: 400 },
    );
  }

  // 2. Carica su Documenso e ottieni link firma
  let envelopeId: string;
  let clienteSigningUrl: string | null = null;
  let fornitoreSigningUrl: string | null = null;
  let documensoItemId: string | null = null;
  let documensoProvider: DocumensoProvider = "cloud";

  // Trova i marker XSIGN nel PDF per posizionare i campi firma di entrambe le parti
  const recipients = buildSignatureFields(
    pdfBuffer,
    signerEmail,
    signerName,
    FORNITORE.email,
    FORNITORE.legaleRappresentante,
  );

  const subject = `Firma contratto ${data.numero} ${BRAND_INFO[data.brand].platformName}`;
  const message = `Gentile ${signerName}, clicchi il link per visionare e firmare elettronicamente il contratto ${data.numero}.`;

  try {
    documensoProvider = await resolveDocumensoProviderForSend();
    const envelope = await createEnvelope({
      title: `Contratto ${data.numero} — ${data.cliente.ragioneSociale}`,
      pdfBuffer,
      pdfFileName,
      recipients,
      externalId: contractId,
      subject,
      message,
    }, documensoProvider);
    envelopeId = envelope.envelopeId;

    const distributed = await distributeEnvelope(envelopeId, documensoProvider);
    // Selezione per signingOrder, non per email: cliente e fornitore possono
    // avere la stessa email (es. test con l'email del titolare) e in quel caso
    // il match per email restituirebbe il link sbagliato → "non è il tuo turno".
    // Il cliente è sempre il primo firmatario (signingOrder 1), il fornitore il
    // secondo (signingOrder 2), come definito in buildSignatureFields.
    const urls = distributed.signingUrls;
    clienteSigningUrl =
      urls.find((s) => s.signingOrder === 1)?.signingUrl ??
      urls.find((s) => s.email === signerEmail)?.signingUrl ??
      null;
    fornitoreSigningUrl =
      urls.find((s) => s.signingOrder === 2)?.signingUrl ??
      urls.find((s) => s.email === FORNITORE.email)?.signingUrl ??
      null;
    clienteSigningUrl = rewriteDocumensoPublicUrl(clienteSigningUrl, data.brand, documensoProvider);
    fornitoreSigningUrl = rewriteDocumensoPublicUrl(fornitoreSigningUrl, data.brand, documensoProvider);

    const details = await getEnvelope(envelopeId, documensoProvider);
    documensoItemId = details.envelopeItems?.[0]?.id ?? null;
  } catch (err) {
    console.error("[contracts/send] Documenso error", err);
    return NextResponse.json(
      { error: `Documenso: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  // 3. Invia email al cliente con link firma + copia PDF allegata
  const pdfBase64 = pdfBuffer.toString("base64");
  const brand = data.brand;
  const emailHtml = buildContractEmailHtml(data, clienteSigningUrl);

  const sender = resolveSenderForVertical(BRAND_INFO[brand].vertical);
  const emailResult = await sendEmail({
    to: signerEmail,
    subject: `Contratto ${data.numero} ${BRAND_INFO[brand].platformName} — ${data.cliente.ragioneSociale || "—"}`,
    html: emailHtml,
    fromOverride: sender.from,
    attachments: [
      {
        filename: pdfFileName,
        content: pdfBase64,
        contentType: "application/pdf",
      },
    ],
  });

  if (!emailResult.ok) {
    console.error("[contracts/send] Email failed", emailResult.error);
  }

  // 4. Aggiorna stato contratto
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 5);

  const updated = await updateContract(contractId, {
    status: "sent",
    sent_at: now.toISOString(),
    expires_at: expires.toISOString(),
    documenso_envelope_id: envelopeId,
    documenso_item_id: documensoItemId,
    signing_url: clienteSigningUrl,
    payment_method: data.economiche.metodoPagamento,
    contract_data: {
      ...contract.contract_data,
      documenso_provider: documensoProvider,
    },
  });

  return NextResponse.json({
    contract: updated,
    signingUrl: clienteSigningUrl,
    fornitoreSigningUrl,
    emailSent: emailResult.ok,
    documensoProvider,
  });
}

function buildContractEmailHtml(
  data: ContractData,
  signingUrl: string | null,
): string {
  const brandMeta = BRAND_INFO[data.brand];
  const brand = PLATFORM_BRANDS[brandMeta.vertical];
  const annuale = data.economiche.cicloFatturazione === "yearly";
  const totaleAnnuale = computeYearlyTotal(
    data.economiche.canoneMensile,
    data.economiche.scontoAnnuale,
  );
  const sTax = taxSuffix(data.economiche);
  const canone = annuale
    ? `${formatEUR(totaleAnnuale)} ${sTax} / anno`
    : `${formatEUR(data.economiche.canoneMensile)} ${sTax} / mese`;
  const firstPayment = computeFirstPaymentTotal(data.economiche);
  const recurringPayment = computeRecurringPaymentTotal(data.economiche);
  const paymentDescription = contractPaymentDescription(data);
  const individual = isIndividualClient(data);

  const saluto =
    (!individual ? data.cliente.legaleRappresentante?.trim() : "") ||
    data.cliente.ragioneSociale?.trim() ||
    "Cliente";

  const signingBlock = signingUrl
    ? `<div style="margin:24px 0;text-align:center">
        <a href="${signingUrl}" style="display:inline-block;padding:14px 32px;background:${brand.primary};color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">
          Firma il contratto elettronicamente
        </a>
        <p style="margin-top:8px;font-size:12px;color:${brand.muted}">
          Cliccando il bottone sarà indirizzato alla piattaforma di firma elettronica Documenso.
        </p>
      </div>`
    : "";

  const bonificoBlock =
    data.economiche.metodoPagamento === "bonifico"
      ? `<li><strong>IBAN:</strong> ${FORNITORE.iban} — Massimo Pernozzoli</li>
         <li><strong>Causale:</strong> ${paymentDescription}</li>
         <li><strong>Primo pagamento complessivo:</strong> ${formatEUR(firstPayment)}</li>
         <li><strong>Pagamenti successivi complessivi:</strong> ${formatEUR(recurringPayment)} / ${annuale ? "anno" : "mese"}</li>`
      : "";

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,system-ui,sans-serif;background:${brand.bg};color:${brand.text}">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
  <div style="margin-bottom:24px">
    <span style="display:inline-block;padding:4px 12px;background:${brand.primary};color:#fff;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">
      ${brand.name}
    </span>
  </div>

  <p>Gentile ${saluto},</p>

  <p>come da accordi intercorsi, le inviamo la proposta contrattuale n. <strong>${data.numero}</strong> per l'attivazione del servizio "<strong>${data.servizio.pianoNome}</strong>" sulla piattaforma ${brand.name}.</p>

  ${signingBlock}

  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0">
    <h3 style="margin:0 0 12px;font-size:14px;color:${brand.text}">Riepilogo condizioni economiche</h3>
    <ul style="margin:0;padding:0 0 0 18px;font-size:13px;line-height:1.8">
      <li><strong>Piano:</strong> ${data.servizio.pianoNome}</li>
      <li><strong>Setup:</strong> ${formatEUR(data.economiche.setup)} ${sTax}${
        data.economiche.setupRateale && data.economiche.setupRate.length > 1
          ? ` (rateizzato in ${data.economiche.setupRate.length} mensilità)`
          : ""
      }</li>
      <li><strong>Canone:</strong> ${canone}</li>
      <li><strong>Pagamento:</strong> ${paymentMethodLabel(data.economiche.metodoPagamento)}</li>
      ${bonificoBlock}
      <li><strong>Durata:</strong> 12 mesi con rinnovo tacito</li>
    </ul>
  </div>

  <p style="font-size:13px">In allegato trova anche la copia PDF completa del contratto, comprensiva degli allegati tecnici e regolamentari.</p>

  <p style="font-size:13px">Il link di firma elettronica è valido per <strong>5 giorni lavorativi</strong> dalla ricezione. Trascorso il termine, la proposta decadrà automaticamente.</p>

  <p style="font-size:13px;margin-top:24px">Per qualsiasi chiarimento rimaniamo a completa disposizione.</p>

  <p style="font-size:13px">Cordialmente,<br><strong>${FORNITORE.legaleRappresentante}</strong><br>${FORNITORE.ragioneSociale}<br>PEC: ${FORNITORE.pec}</p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:11px;color:${brand.muted}">
    Questa email è stata inviata da ${brand.name}. Se non è destinata a lei, la preghiamo di ignorarla.
  </p>
</div>
</body>
</html>`;
}
