import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { suggestUpsellsForOrder } from "@/lib/upselling-engine";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import type { MenuOrderChannel } from "@/lib/types";
import { CheckoutClient } from "../../../checkout/[code]/checkout-client";

export const dynamic = "force-dynamic";

// Checkout ordine tenant-aware servito sotto lo slug del tenant in preview
// (es. demo.menuary.it/kimos/checkout/<code>?t=<token>). Gemello della route
// root /checkout/[code], ma il tenant è risolto dallo slug invece che dall'host.
export default async function PreviewOrderCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ previewSlug: string; code: string }>;
  searchParams: Promise<{ t?: string; status?: string }>;
}) {
  const [{ previewSlug, code }, { t, status }] = await Promise.all([params, searchParams]);
  const h = await headers();

  if (!t) notFound();

  const host = h.get("host");
  const mode = getPlatformModeFromHost(host);
  if (mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo") notFound();

  const tenant = resolveTenantFromPreviewSlug(previewSlug, host);
  if (tenant.previewSlug !== previewSlug) notFound();

  const order = await getPublicCheckoutOrder({ tenantId: tenant.id, code, token: t });
  if (!order) notFound();

  const isAiSource = order.source === "retell" || order.source === "whatsapp";
  const [upsellSuggestions, paymentAccount] = await Promise.all([
    tenant.features.upselling ? loadCheckoutUpsellSuggestions(tenant.id, order) : Promise.resolve([]),
    getTenantPaymentAccount(tenant.id),
  ]);
  const stripeEnabled = Boolean(paymentAccount?.chargesEnabled);

  return (
    <div style={tenantThemeCssVars(tenant.theme) as React.CSSProperties} data-tenant-surface={tenant.id}>
      <CheckoutClient
        tenantId={tenant.id}
        tenantName={tenant.label}
        tenantVertical={tenant.vertical}
        order={{ ...order, menuaryUserId: null }}
        token={t}
        paymentStatus={status ?? null}
        isAiSource={isAiSource}
        upsellSuggestions={upsellSuggestions}
        stripeEnabled={stripeEnabled}
      />
    </div>
  );
}

async function loadCheckoutUpsellSuggestions(
  tenantId: string,
  order: NonNullable<Awaited<ReturnType<typeof getPublicCheckoutOrder>>>,
): Promise<string[]> {
  const itemCodes = order.lines.map((line) => line.itemId).filter(Boolean);
  if (itemCodes.length === 0) return [];
  const db = createSupabaseServiceClient();
  if (!db) return [];

  const auth = await createSupabaseServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  try {
    const suggestions = await suggestUpsellsForOrder(db, {
      tenantId,
      itemCodes: [...new Set(itemCodes)],
      channel: checkoutOrderChannel(order),
      tableId: order.tableId,
      userId: user?.id ?? order.menuaryUserId,
    });
    return suggestions.map((suggestion) => suggestion.text).slice(0, 3);
  } catch {
    return [];
  }
}

function checkoutOrderChannel(
  order: NonNullable<Awaited<ReturnType<typeof getPublicCheckoutOrder>>>,
): MenuOrderChannel {
  if (order.source === "retell") return "phone";
  if (order.source === "whatsapp") return "whatsapp";
  if (order.type === "tavolo") return "table";
  return "online";
}
