import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { suggestUpsellsForOrder } from "@/lib/upselling-engine";
import { CheckoutClient } from "./checkout-client";
import type { MenuOrderChannel } from "@/lib/types";

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
  const upsellSuggestions = tenant.features.upselling
    ? await loadCheckoutUpsellSuggestions(tenant.id, order)
    : [];

  return (
    <CheckoutClient
      tenantId={tenant.id}
      tenantName={tenant.label}
      tenantVertical={tenant.vertical}
      order={{ ...order, menuaryUserId: null }}
      token={t}
      paymentStatus={status ?? null}
      isAiSource={isAiSource}
      upsellSuggestions={upsellSuggestions}
    />
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

function checkoutOrderChannel(order: NonNullable<Awaited<ReturnType<typeof getPublicCheckoutOrder>>>): MenuOrderChannel {
  if (order.source === "product_reservation") return "product_reservation";
  if (order.source === "retell") return "phone";
  if (order.source === "whatsapp") return "whatsapp";
  if (order.type === "tavolo") return "table";
  return "online";
}
