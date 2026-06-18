import "server-only";

import { findTenantById } from "@/lib/tenant-registry";

// Host di preview per verticale: i tenant senza dominio custom (es. lead/demo)
// servono il checkout sotto il proprio slug sull'host demo del verticale.
const DEMO_HOST_BY_VERTICAL: Record<string, string> = {
  food: "demo.menuary.it",
  services: "demo.bizery.it",
  creative: "demo.weuseorpheo.com",
};

/**
 * URL finale del checkout, tenant-aware:
 * - tenant con dominio custom → https://<dominio>/checkout/<code>?t=<token>
 * - tenant demo (senza dominio) → https://<demo-host-verticale>/<slug>/checkout/<code>?t=<token>
 */
export function tenantCheckoutUrl(tenantId: string, code: string, token: string): string {
  const tenant = findTenantById(tenantId);
  const qs = `?t=${encodeURIComponent(token)}`;
  const domain = tenant?.domains?.[0];
  if (domain) {
    return `https://${domain}/checkout/${encodeURIComponent(code)}${qs}`;
  }
  const slug = tenant?.previewSlug ?? tenantId;
  const host = DEMO_HOST_BY_VERTICAL[tenant?.vertical ?? "food"] ?? "demo.menuary.it";
  return `https://${host}/${encodeURIComponent(slug)}/checkout/${encodeURIComponent(code)}${qs}`;
}
