import { NextRequest, NextResponse } from "next/server";
import { getOrderByPublicToken } from "@/lib/orders/public-checkout";
import { tenantCheckoutUrl } from "@/lib/orders/checkout-url";

export const dynamic = "force-dynamic";

// Short-link di piattaforma usato come bottone nei template WhatsApp
// (il prefisso del bottone CTA è fisso al momento dell'approvazione Meta).
// Risolve l'ordine dal public_token e reindirizza al checkout tenant-aware.
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
    // token non valido o DB non disponibile → fallback alla home piattaforma
  }
  return NextResponse.redirect("https://menuary.it", 302);
}
