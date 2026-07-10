import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { findTenantById } from "@/lib/tenant-registry";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";

/**
 * Le route pubbliche di PynkStudio (/servizi, /lavori, …) sono segmenti globali
 * dell'app dir: vanno servite solo quando l'host (o la preview) risolve sul
 * tenant pynkstudio. Per qualsiasi altro tenant la route non esiste.
 */
export async function requirePynkstudioTenant() {
  const h = await headers();
  const tenant =
    findTenantById(h.get("x-preview-tenant-id") ?? "") ?? resolveTenantFromHost(h.get("host"));
  if (!tenant || tenant.id !== "pynkstudio") notFound();
  return tenant;
}

export function isPynkstudioRequest(previewTenantId: string | null, host: string | null) {
  const tenant = findTenantById(previewTenantId ?? "") ?? resolveTenantFromHost(host);
  return tenant?.id === "pynkstudio";
}
