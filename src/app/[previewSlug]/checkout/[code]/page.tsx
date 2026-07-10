import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";
import { loadCheckoutUpsellSuggestions } from "@/lib/orders/checkout-upsell";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import { shouldUseStripeSandbox } from "@/lib/payments/stripe/sandbox-policy";
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

  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (!tenant || tenant.previewSlug !== previewSlug) notFound();

  const order = await getPublicCheckoutOrder({ tenantId: tenant.id, code, token: t });
  if (!order) notFound();

  const isAiSource = order.source === "retell" || order.source === "whatsapp";
  const [upsellSuggestions, paymentAccount] = await Promise.all([
    tenant.features.upselling ? loadCheckoutUpsellSuggestions(tenant.id, order) : Promise.resolve([]),
    getTenantPaymentAccount(tenant.id, { demoSandbox: shouldUseStripeSandbox(tenant.id, host) }),
  ]);
  const stripeEnabled = Boolean(paymentAccount?.chargesEnabled);

  return (
    <div style={tenantThemeCssVars(tenant.theme) as React.CSSProperties} data-tenant-surface={tenant.id}>
      <CheckoutClient
        tenantId={tenant.id}
        tenantName={tenant.name}
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
