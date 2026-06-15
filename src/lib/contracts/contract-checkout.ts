import "server-only";

import { stripeRequest } from "@/lib/payments/stripe/client";
import { createBunqPaymentRequest } from "@/lib/payments/bunq/payment-requests";
import {
  paymentRedirectUrlWithRef,
  stripeSuccessUrl,
  stripeCancelUrl,
} from "@/lib/payments/payment-urls";
import {
  computeFirstPaymentTotal,
  contractPaymentDescription,
  type ContractBrand,
  type ContractData,
} from "./menuary-contract";

export type PlatformCheckoutResult = {
  provider: "stripe" | "bunq" | "bonifico";
  sessionId?: string;
  checkoutUrl?: string;
  bunqRequestId?: number;
  bunqShareUrl?: string;
};

type StripeSession = {
  id: string;
  url: string | null;
};

export async function createContractPayment(
  contractId: string,
  data: ContractData,
): Promise<PlatformCheckoutResult> {
  const method = data.economiche.metodoPagamento;

  switch (method) {
    case "carta":
      return createStripeCheckout(contractId, data);
    case "bunq":
      return createBunqCheckout(contractId, data);
    case "bonifico":
      return { provider: "bonifico" };
  }
}

async function createStripeCheckout(
  contractId: string,
  data: ContractData,
): Promise<PlatformCheckoutResult> {
  const total = computeFirstPaymentTotal(data.economiche);
  const amountCents = Math.round(total * 100);
  const description = contractPaymentDescription(data);
  const customerEmail = data.cliente.email || data.cliente.pec;
  const brand = data.brand as ContractBrand;

  const session = await stripeRequest<StripeSession>("/checkout/sessions", {
    method: "POST",
    body: {
      mode: "payment",
      "payment_method_types[0]": "card",
      customer_email: customerEmail || undefined,
      success_url: stripeSuccessUrl(brand, contractId),
      cancel_url: stripeCancelUrl(brand, contractId),
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      metadata: {
        contract_id: contractId,
        contract_numero: data.numero,
        payment_description: description,
        source: "platform_contract",
      },
      payment_intent_data: {
        description,
        metadata: {
          contract_id: contractId,
          contract_numero: data.numero,
          payment_description: description,
          source: "platform_contract",
        },
      },
      "line_items[0]": {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: description,
            description: `Primo pagamento: setup + canone ${data.economiche.cicloFatturazione === "yearly" ? "annuale" : "mensile"}`,
          },
        },
      },
    },
  });

  if (!session.url) throw new Error("stripe_checkout_no_url");

  return {
    provider: "stripe",
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

async function createBunqCheckout(
  contractId: string,
  data: ContractData,
): Promise<PlatformCheckoutResult> {
  const totalWithTax = computeFirstPaymentTotal(data.economiche);
  const description = contractPaymentDescription(data);
  const brand = data.brand as ContractBrand;

  const customerEmail = data.cliente.email || data.cliente.pec;
  if (!customerEmail) throw new Error("bunq_no_customer_email");

  const result = await createBunqPaymentRequest({
    amountEur: totalWithTax,
    description,
    counterpartyEmail: customerEmail,
    reference: data.numero,
    redirectUrl: paymentRedirectUrlWithRef("processing", brand, contractId),
  });

  return {
    provider: "bunq",
    bunqRequestId: result.id,
    bunqShareUrl: result.shareUrl,
  };
}
