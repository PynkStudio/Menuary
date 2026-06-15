import "server-only";

import { createContractPayment } from "@/lib/contracts/contract-checkout";
import {
  updateContract,
  type PlatformContract,
} from "@/lib/contracts/contract-queries";
import {
  BRAND_INFO,
  FORNITORE,
  computeFirstPaymentTotal,
  formatEUR,
  type ContractBrand,
  type ContractData,
} from "@/lib/contracts/menuary-contract";
import { paymentRedirectUrlWithRef } from "@/lib/payments/payment-urls";
import { sendEmail, PLATFORM_BRANDS, resolveSenderForVertical } from "@/lib/email/sender";
import {
  attachPaymentProviderRefs,
  createPendingSubscriptionFromContract,
} from "@/lib/platform/subscription-service";
import { buildMarketingEmail } from "@/lib/email/templates/marketing";

export async function ensureCustomerSignatureFulfillment(
  contract: PlatformContract,
): Promise<void> {
  if (contract.subscription_id) return;

  const sub = await createPendingSubscriptionFromContract(contract);
  const paymentId = sub?.paymentId ?? null;
  await handlePaymentByMethod(
    contract.id,
    contract.contract_data,
    contract.numero,
    paymentId,
  );
}

async function handlePaymentByMethod(
  contractId: string,
  data: ContractData,
  numero: string,
  paymentId: string | null,
) {
  const result = await createContractPayment(contractId, data);
  const brandMeta = BRAND_INFO[data.brand as ContractBrand];
  const emailBrand = PLATFORM_BRANDS[brandMeta.vertical];
  const sender = resolveSenderForVertical(brandMeta.vertical);
  const signerEmail = data.cliente.email || data.cliente.pec;

  const brand = data.brand as ContractBrand;
  const paymentUrl = paymentRedirectUrlWithRef("processing", brand, contractId);

  switch (result.provider) {
    case "stripe": {
      if (result.sessionId) {
        await updateContract(contractId, {
          stripe_checkout_session_id: result.sessionId,
        });
      }
      if (paymentId && result.checkoutUrl) {
        await attachPaymentProviderRefs(paymentId, {
          stripePaymentLink: result.checkoutUrl,
        });
      }
      if (signerEmail && result.checkoutUrl) {
        await sendEmail({
          to: signerEmail,
          subject: `Pagamento contratto ${numero} — ${emailBrand.name}`,
          html: buildPaymentEmailHtml(data, paymentUrl, numero),
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
          html: buildPaymentEmailHtml(data, paymentUrl, numero),
          fromOverride: sender.from,
        });
      }
      break;
    }

    case "bonifico": {
      if (signerEmail) {
        const firstPayment = computeFirstPaymentTotal(data.economiche);
        await sendEmail({
          to: signerEmail,
          subject: `Pagamento contratto ${numero} — ${emailBrand.name}`,
          html: buildMarketingEmail({
            brand: emailBrand,
            preheader: `Istruzioni bonifico — contratto ${numero}`,
            title: "Contratto firmato — procedi al pagamento",
            body: `<p>Grazie per aver firmato il contratto <strong>${numero}</strong>!</p>
<p>Per completare l'attivazione del servizio, effettua un bonifico di <strong>${formatEUR(firstPayment)}</strong> con i seguenti dati:</p>
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;font-size:14px;margin:16px 0">
  <strong>Intestatario:</strong> ${FORNITORE.ragioneSociale}<br>
  <strong>IBAN:</strong> ${FORNITORE.iban}<br>
  <strong>Causale:</strong> Contratto ${numero} — ${data.cliente.ragioneSociale}
</div>`,
          }),
          fromOverride: sender.from,
        });
      }
      break;
    }
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

  return buildMarketingEmail({
    brand,
    preheader: `Procedi al pagamento — contratto ${numero}`,
    title: "Contratto firmato — procedi al pagamento",
    body: `<p>Grazie per aver firmato il contratto <strong>${numero}</strong>!</p>
<p>Per completare l'attivazione del servizio, proceda al pagamento del primo importo complessivo di <strong>${formatEUR(firstPayment)}</strong>.</p>
<p style="font-size:13px;color:${brand.muted}">Il pagamento verrà elaborato automaticamente alla conferma.</p>`,
    cta: { label: "Procedi al pagamento", url: checkoutUrl },
  });
}
