import type { ContractBrand } from "@/lib/contracts/menuary-contract";

type PaymentStatus = "success" | "failed" | "cancelled" | "processing";

export function paymentRedirectUrl(
  status: PaymentStatus,
  brand: ContractBrand,
  siteUrl?: string,
): string {
  const base = siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuary.it";
  return `${base}/payment?status=${status}&brand=${brand}`;
}

export function paymentRedirectUrlWithRef(
  status: PaymentStatus,
  brand: ContractBrand,
  ref: string,
  siteUrl?: string,
): string {
  return `${paymentRedirectUrl(status, brand, siteUrl)}&ref=${encodeURIComponent(ref)}`;
}

export function stripeSuccessUrl(brand: ContractBrand, ref?: string): string {
  return ref
    ? paymentRedirectUrlWithRef("success", brand, ref)
    : paymentRedirectUrl("success", brand);
}

export function stripeCancelUrl(brand: ContractBrand, ref?: string): string {
  return ref
    ? paymentRedirectUrlWithRef("cancelled", brand, ref)
    : paymentRedirectUrl("cancelled", brand);
}
