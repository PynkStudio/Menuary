import "server-only";

import { enqueueOutboundMessage } from "@/lib/outbound/messages";
import { findTenantById } from "@/lib/tenant-registry";

export type OrderNotificationKind = "created" | "confirmed" | "rejected" | "updated";

function originFromRequest(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function statusText(kind: OrderNotificationKind): string {
  if (kind === "created") return "ricevuto ed e in attesa di conferma";
  if (kind === "confirmed") return "confermato";
  if (kind === "rejected") return "non confermato";
  return "aggiornato";
}

export function publicCheckoutUrl(input: {
  req: Request;
  code: string;
  token: string;
}): string {
  return `${originFromRequest(input.req)}/checkout/${encodeURIComponent(input.code)}?t=${encodeURIComponent(input.token)}`;
}

export async function notifyCustomerOrderStatus(input: {
  tenantId: string;
  orderId: string;
  code: string;
  publicToken: string;
  customerPhone?: string | null;
  kind: OrderNotificationKind;
  req?: Request | null;
  checkoutUrl?: string | null;
  reason?: string | null;
}): Promise<void> {
  const phone = input.customerPhone?.trim();
  if (!phone) return;

  const tenant = findTenantById(input.tenantId);
  const tenantName = tenant?.name ?? input.tenantId;
  const url =
    input.checkoutUrl ??
    (input.req ? publicCheckoutUrl({ req: input.req, code: input.code, token: input.publicToken }) : null);

  const body = [
    `${tenantName}: ordine ${input.code} ${statusText(input.kind)}.`,
    input.reason ? `Motivo: ${input.reason}` : null,
    url ? `Segui riepilogo, pagamento e aggiornamenti qui: ${url}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await enqueueOutboundMessage({
    tenantId: input.tenantId,
    kind: input.kind === "created" ? "order_summary" : "custom",
    channel: "whatsapp",
    fallbackChannel: "sms",
    recipientPhone: phone,
    body,
    source: "order_flow",
    orderId: input.orderId,
    metadata: {
      orderCode: input.code,
      notificationKind: input.kind,
      checkoutUrl: url,
    },
  }).catch(() => {});
}
