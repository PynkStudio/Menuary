import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export default async function PublicCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ t?: string; status?: string }>;
}) {
  const [{ code }, { t, status }, h] = await Promise.all([
    params,
    searchParams,
    headers(),
  ]);

  if (!t) notFound();

  const host = h.get("host");
  const tenant = resolveTenantFromHost(host);

  const order = await getPublicCheckoutOrder({
    tenantId: tenant.id,
    code,
    token: t,
  });

  if (!order) notFound();

  // Disclosure aggiuntiva richiesta solo per ordini provenienti da canali AI
  // (registrazioni voce Retell, conversazioni WA gestite da assistente).
  const isAiSource = order.source === "retell" || order.source === "whatsapp";

  return (
    <CheckoutClient
      tenantId={tenant.id}
      tenantName={tenant.label}
      tenantVertical={tenant.vertical}
      order={order}
      token={t}
      paymentStatus={status ?? null}
      isAiSource={isAiSource}
    />
  );
}
