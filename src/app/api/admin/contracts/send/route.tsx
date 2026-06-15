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
  resolveDocumensoSignerEmail,
  type DocumensoProvider,
} from "@/lib/contracts/documenso";
import { sendEmail, PLATFORM_BRANDS, resolveSenderForVertical } from "@/lib/email/sender";
import { buildMarketingEmail } from "@/lib/email/templates/marketing";

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

  const subject = `Firma contratto ${data.numero} ${BRAND_INFO[data.brand].platformName}`;
  const message = `Gentile ${signerName}, clicchi il link per visionare e firmare elettronicamente il contratto ${data.numero}.`;

  try {
    documensoProvider = await resolveDocumensoProviderForSend();
    const fornitoreSignerEmail = resolveDocumensoSignerEmail(
      documensoProvider,
      FORNITORE.email,
    );
    const recipients = buildSignatureFields(
      pdfBuffer,
      signerEmail,
      signerName,
      fornitoreSignerEmail,
      FORNITORE.legaleRappresentante,
    );
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
      urls.find((s) => s.email === fornitoreSignerEmail)?.signingUrl ??
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
    counterparty_signing_url: fornitoreSigningUrl,
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

  const bonificoBlock =
    data.economiche.metodoPagamento === "bonifico"
      ? `<table role="presentation" width="100%" style="margin:16px 0;">
          <tr>
            <td style="padding:12px 16px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;">
              <p style="margin:0;font-size:13px;color:#92400e;"><strong>Bonifico</strong></p>
              <p style="margin:4px 0 0;font-size:13px;color:#92400e;"><strong>IBAN:</strong> ${FORNITORE.iban} — Massimo Pernozzoli</p>
              <p style="margin:2px 0 0;font-size:13px;color:#92400e;"><strong>Causale:</strong> ${paymentDescription}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#92400e;"><strong>Primo pagamento:</strong> ${formatEUR(firstPayment)}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#92400e;"><strong>Pagamenti successivi:</strong> ${formatEUR(recurringPayment)} / ${annuale ? "anno" : "mese"}</p>
            </td>
          </tr>
        </table>`
      : "";

  const economicSummary = `<table role="presentation" width="100%" style="margin:24px 0;">
    <tr>
      <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
        <h3 style="margin:0 0 12px;font-size:14px;color:${brand.text};">Riepilogo condizioni economiche</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;line-height:1.8;">
          <tr><td style="padding:2px 0;color:#6b7280;width:120px;">Piano</td><td style="padding:2px 0;font-weight:600;">${data.servizio.pianoNome}</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280;">Setup</td><td style="padding:2px 0;">${formatEUR(data.economiche.setup)} ${sTax}${data.economiche.setupRateale && data.economiche.setupRate.length > 1 ? ` (rateizzato in ${data.economiche.setupRate.length} mensilità)` : ""}</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280;">Canone</td><td style="padding:2px 0;">${canone}</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280;">Pagamento</td><td style="padding:2px 0;">${paymentMethodLabel(data.economiche.metodoPagamento)}</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280;">Durata</td><td style="padding:2px 0;">12 mesi con rinnovo tacito</td></tr>
        </table>
      </td>
    </tr>
  </table>
  ${bonificoBlock}`;

  const body = `<p>Gentile ${saluto},</p>
<p>come da accordi intercorsi, le inviamo la proposta contrattuale n. <strong>${data.numero}</strong> per l'attivazione del servizio "<strong>${data.servizio.pianoNome}</strong>" sulla piattaforma ${brand.name}.</p>
<p>In allegato trova la copia PDF completa del contratto, comprensiva degli allegati tecnici e regolamentari.</p>
<p style="font-size:13px;color:${brand.muted};">Il link di firma elettronica è valido per <strong>5 giorni lavorativi</strong>. Trascorso il termine, la proposta decadrà automaticamente.</p>`;

  return buildMarketingEmail({
    brand,
    preheader: `Contratto ${data.numero} da firmare — ${data.servizio.pianoNome}`,
    title: `Proposta contrattuale n. ${data.numero}`,
    body,
    cta: signingUrl ? { label: "Firma il contratto elettronicamente", url: signingUrl } : undefined,
    extraSections: economicSummary,
  });
}
