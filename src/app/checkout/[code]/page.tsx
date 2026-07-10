import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { extendPublicCheckoutWindowOnOpen, getPublicCheckoutOrder } from "@/lib/orders/public-checkout";
import { loadCheckoutUpsellSuggestions } from "@/lib/orders/checkout-upsell";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import { shouldUseStripeSandbox } from "@/lib/payments/stripe/sandbox-policy";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export default async function PublicCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ t?: string; status?: string }>;
}) {
  const [{ code }, { t, status }] = await Promise.all([params, searchParams]);
  const h = await headers();

  if (!t) notFound();

  const host = h.get("host");
  const tenant = resolveTenantFromHost(host);

  let order = await getPublicCheckoutOrder({
    tenantId: tenant.id,
    code,
    token: t,
  });

  if (!order) notFound();
  await extendPublicCheckoutWindowOnOpen({ tenantId: tenant.id, code, token: t }).catch(() => undefined);
  order = await getPublicCheckoutOrder({ tenantId: tenant.id, code, token: t });
  if (!order) notFound();

  // Disclosure aggiuntiva richiesta solo per ordini provenienti da canali AI
  // (registrazioni voce Retell, conversazioni WA gestite da assistente).
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
