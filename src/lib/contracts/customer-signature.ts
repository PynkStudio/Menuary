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
    <a href="${checkoutUrl}" style="display:inline-block;padding:14px 32px;background:${brand.primary};color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">Procedi al pagamento</a>
  </div>
  <p style="font-size:12px;color:${brand.muted}">Il pagamento verrà elaborato automaticamente alla conferma.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:11px;color:${brand.muted}">${brand.name} · ${FORNITORE.ragioneSociale}</p>
</div>
</body>
</html>`;
}
