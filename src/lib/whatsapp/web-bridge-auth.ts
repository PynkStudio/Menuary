import "server-only";

export function isAuthorizedWhatsappWebBridgeRequest(request: Request): boolean {
  const configured = process.env.WHATSAPP_WEB_BRIDGE_SECRET;
  if (!configured) return true;
  return request.headers.get("x-whatsapp-web-secret") === configured;
}
