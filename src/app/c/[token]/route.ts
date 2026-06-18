import { NextRequest, NextResponse } from "next/server";
import { getOrderByPublicToken } from "@/lib/orders/public-checkout";
import { tenantCheckoutUrl } from "@/lib/orders/checkout-url";
import { findTenantByPreviewSlug } from "@/lib/tenant-registry";

export const dynamic = "force-dynamic";

// Short-link di piattaforma usato come bottone nei template WhatsApp
// (il prefisso del bottone CTA è fisso al momento dell'approvazione Meta).
// Priorità:
//   1. public_token ordine → redirect al checkout tenant-aware
//   2. previewSlug tenant → redirect alla pagina menu del tenant
//   3. fallback → home piattaforma
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    const order = await getOrderByPublicToken(token);
    if (order) {
      return NextResponse.redirect(
        tenantCheckoutUrl(order.tenantId, order.code, order.token),
        302,
      );
    }
  } catch {
    // token non valido o DB non disponibile → prova come slug
  }

  const tenant = findTenantByPreviewSlug(token);
  if (tenant?.previewSlug) {
    const platformBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuary.it";
    return NextResponse.redirect(`${platformBase}/${tenant.previewSlug}/menu`, 302);
  }

  return NextResponse.redirect("https://menuary.it", 302);
}
