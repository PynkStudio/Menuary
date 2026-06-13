import { NextResponse } from "next/server";
import { createBunqPaymentRequest } from "@/lib/payments/bunq/payment-requests";

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      amountEur: number;
      description: string;
      counterpartyEmail: string;
      reference: string;
    };

    if (!body.amountEur || !body.counterpartyEmail || !body.reference) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const result = await createBunqPaymentRequest({
      amountEur: body.amountEur,
      description: body.description || `Pagamento ${body.reference}`,
      counterpartyEmail: body.counterpartyEmail,
      reference: body.reference,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[bunq-request]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "bunq_request_failed" },
      { status: 500 },
    );
  }
}
