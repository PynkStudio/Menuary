import "server-only";

import { bunqRequest, accountPath } from "./client";

export type BunqPaymentRequestResponse = Array<{
  Id: { id: number };
  share_url: string;
  status: string;
  amount_inquired: { value: string; currency: string };
}>;

export type CreatePaymentRequestInput = {
  amountEur: number;
  description: string;
  counterpartyEmail: string;
  reference: string;
};

export async function createBunqPaymentRequest(
  input: CreatePaymentRequestInput,
): Promise<{ id: number; shareUrl: string }> {
  const result = await bunqRequest<BunqPaymentRequestResponse>(
    `${accountPath()}/request-inquiry`,
    {
      method: "POST",
      body: {
        amount_inquired: {
          value: input.amountEur.toFixed(2),
          currency: "EUR",
        },
        counterparty_alias: {
          type: "EMAIL",
          value: input.counterpartyEmail,
          name: input.counterpartyEmail,
        },
        description: input.description,
        allow_bunqme: true,
        redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuary.it"}/admin/contratti?payment=success`,
        event_type: "REQUEST_INQUIRY",
      },
    },
  );

  const entry = result[0];
  if (!entry?.Id?.id || !entry.share_url) {
    throw new Error("bunq_payment_request_no_url");
  }

  return {
    id: entry.Id.id,
    shareUrl: entry.share_url,
  };
}

export async function getBunqPaymentRequest(
  requestId: number,
): Promise<{
  id: number;
  status: string;
  amountValue: string;
  shareUrl: string;
}> {
  const result = await bunqRequest<BunqPaymentRequestResponse>(
    `${accountPath()}/request-inquiry/${requestId}`,
  );

  const entry = result[0];
  return {
    id: entry.Id.id,
    status: entry.status,
    amountValue: entry.amount_inquired.value,
    shareUrl: entry.share_url,
  };
}
