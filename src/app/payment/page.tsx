import type { Metadata } from "next";
import { PaymentStatusPage } from "@/components/payment/payment-status-page";
import type { PaymentAction } from "@/components/payment/payment-status-page";
import { lookupPaymentByContractRef } from "@/lib/payments/payment-lookup";

export const metadata: Metadata = {
  robots: "noindex",
  title: "Stato pagamento — Menuary",
};

type Props = {
  searchParams: Promise<{
    status?: string;
    brand?: string;
    ref?: string;
  }>;
};

export default async function PaymentPage({ searchParams }: Props) {
  const p = await searchParams;
  const status = validStatus(p.status);
  const brand = validBrand(p.brand) ?? "menuary";

  let paymentAction: PaymentAction | null = null;

  if (p.ref) {
    const lookup = await lookupPaymentByContractRef(p.ref);
    if (lookup.found) {
      paymentAction = lookup.status === "pending" ? {
        method: lookup.method,
        amount: lookup.amount,
        actionUrl: lookup.actionUrl,
        bonificoDetails: lookup.bonificoDetails,
      } : null;
    }
  }

  return (
    <PaymentStatusPage
      status={status}
      brand={brand}
      ref={p.ref}
      paymentAction={paymentAction}
    />
  );
}

function validStatus(s: string | undefined): "success" | "failed" | "cancelled" | "processing" {
  if (s === "success" || s === "failed" || s === "cancelled" || s === "processing") return s;
  return "processing";
}

function validBrand(s: string | undefined): "menuary" | "bizery" | "orpheo" | null {
  if (s === "menuary" || s === "bizery" || s === "orpheo") return s;
  return null;
}
