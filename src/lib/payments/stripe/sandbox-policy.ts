import { isDemoHostname } from "@/lib/demo-mode";

// Tenant che usano la sandbox Stripe anche fuori dall'ambiente demo (es.
// durante la trattativa, prima che abbiano un account Stripe reale).
const TENANTS_ALWAYS_ON_DEMO_SANDBOX = new Set(["cascina-errante", "kimos"]);

export function tenantUsesStripeDemoSandbox(tenantId: string | null | undefined) {
  return Boolean(tenantId && TENANTS_ALWAYS_ON_DEMO_SANDBOX.has(tenantId));
}

// Su demo.<vertical> Stripe dev'essere SEMPRE in sandbox, a prescindere dal
// tenant. Questa funzione unifica il check: true se l'host è demo OPPURE se
// il tenant è nella lista sandbox permanente.
export function shouldUseStripeSandbox(
  tenantId: string | null | undefined,
  hostname: string | null | undefined,
): boolean {
  if (hostname && isDemoHostname(hostname)) return true;
  return tenantUsesStripeDemoSandbox(tenantId);
}
