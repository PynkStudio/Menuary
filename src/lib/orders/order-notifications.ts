import "server-only";

import { enqueueOutboundMessage } from "@/lib/outbound/messages";
import { findTenantById } from "@/lib/tenant-registry";

export type OrderNotificationKind =
  | "created"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "out_for_delivery"
  | "updated";

function originFromRequest(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function buildMessageBody(input: {
  tenantName: string;
  code: string;
  kind: OrderNotificationKind;
  reason?: string | null;
  checkoutUrl?: string | null;
}): string {
  const { tenantName, code, kind, reason, checkoutUrl } = input;

  switch (kind) {
    case "created":
      return [
        `${tenantName}: abbiamo ricevuto il tuo ordine *${code}* ed è in attesa di conferma.`,
        `Ti avviseremo appena verrà accettato.`,
        checkoutUrl ? `\nSegui lo stato del tuo ordine qui:\n${checkoutUrl}` : null,
      ].filter(Boolean).join("\n");

    case "confirmed":
      return [
        `${tenantName}: il tuo ordine *${code}* è stato accettato! ✅`,
        `Lo stiamo preparando. Ti aggiorneremo sui prossimi passaggi.`,
        checkoutUrl ? `\nSegui lo stato del tuo ordine qui:\n${checkoutUrl}` : null,
      ].filter(Boolean).join("\n");

    case "rejected":
      return [
        `${tenantName}: purtroppo il tuo ordine *${code}* non è stato confermato.`,
        reason ? `Motivo: ${reason}` : null,
        `Ci scusiamo per il disagio. Puoi effettuare un nuovo ordine in qualsiasi momento.`,
        checkoutUrl ? `\nDettagli ordine:\n${checkoutUrl}` : null,
      ].filter(Boolean).join("\n");

    case "cancelled":
      return [
        `${tenantName}: il tuo ordine *${code}* è stato annullato.`,
        reason ? `Motivo: ${reason}` : null,
        `Se hai già effettuato un pagamento, il rimborso verrà gestito automaticamente.`,
        `Ci scusiamo per il disagio. Puoi effettuare un nuovo ordine in qualsiasi momento.`,
        checkoutUrl ? `\nDettagli ordine:\n${checkoutUrl}` : null,
      ].filter(Boolean).join("\n");

    case "out_for_delivery":
      return [
        `${tenantName}: il tuo ordine *${code}* è in consegna! 🛵`,
        `Il rider è partito e sta arrivando da te.`,
        checkoutUrl ? `\nSegui lo stato del tuo ordine qui:\n${checkoutUrl}` : null,
      ].filter(Boolean).join("\n");

    default:
      return [
        `${tenantName}: il tuo ordine *${code}* è stato aggiornato.`,
        checkoutUrl ? `\nSegui lo stato del tuo ordine qui:\n${checkoutUrl}` : null,
      ].filter(Boolean).join("\n");
  }
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
  /** Fonte ordine (es. "web", "hubrise"). Gli ordini hubrise non ricevono notifiche WA. */
  orderSource?: string | null;
  /** Tipo ordine ("asporto" | "tavolo"). Notifiche WA solo per asporto (takeaway + delivery), esclusi tavolo. */
  orderType?: string | null;
}): Promise<void> {
  const phone = input.customerPhone?.trim();
  if (!phone) return;

  if (input.orderSource === "hubrise") return;
  if (input.orderType && input.orderType !== "asporto") return;

  const tenant = findTenantById(input.tenantId);
  const tenantName = tenant?.name ?? input.tenantId;
  const url =
    input.checkoutUrl ??
    (input.req ? publicCheckoutUrl({ req: input.req, code: input.code, token: input.publicToken }) : null);

  const body = buildMessageBody({
    tenantName,
    code: input.code,
    kind: input.kind,
    reason: input.reason,
    checkoutUrl: url,
  });

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
