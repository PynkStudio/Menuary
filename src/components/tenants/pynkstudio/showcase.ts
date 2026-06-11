import { TENANTS } from "@/lib/tenant-registry";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TenantVertical } from "@/lib/tenant";

export type ShowcaseTenant = {
  id: string;
  name: string;
  vertical: TenantVertical;
  /** Brand di piattaforma del verticale (badge UI). */
  platform: "Menuary" | "Bizery" | "Orpheo";
  url: string;
};

const PLATFORM_BY_VERTICAL: Record<TenantVertical, ShowcaseTenant["platform"]> = {
  food: "Menuary",
  services: "Bizery",
  creative: "Orpheo",
};

/** Primo dominio pubblico reale del tenant (esclude localhost / .local / 127.0.0.1). */
function firstPublicDomain(domains: string[]): string | null {
  return (
    domains.find(
      (domain) =>
        !domain.startsWith("www.") &&
        !domain.includes("localhost") &&
        !domain.endsWith(".local") &&
        domain !== "127.0.0.1",
    ) ?? null
  );
}

/**
 * Tenant live mostrati nel portfolio PynkStudio: solo quelli effettivamente
 * online sul proprio dominio, escluso PynkStudio stesso.
 *
 * Doppio criterio per non linkare mai un sito spento o irraggiungibile:
 *  - dominio pubblico nel registry → è ciò che instrada davvero il sito tenant;
 *  - stato attivo autorevole dal DB (enabled + status active), gestito dall'admin.
 *    La RLS `tenants_public_read` espone solo i tenant abilitati, quindi un
 *    tenant messo offline sparisce in automatico.
 * La lista cresce/diminuisce da sola al variare dello stato dei tenant.
 */
export async function getActiveTenantSites(): Promise<ShowcaseTenant[]> {
  const candidates = TENANTS.flatMap((tenant) => {
    if (tenant.id === "pynkstudio") return [];
    const domain = firstPublicDomain(tenant.domains);
    if (!domain) return [];
    return [{ tenant, domain }];
  });
  if (candidates.length === 0) return [];

  let activeIds: Set<string>;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("id")
      .eq("enabled", true)
      .eq("status", "active")
      .in(
        "id",
        candidates.map((c) => c.tenant.id),
      );
    if (error) return [];
    activeIds = new Set((data ?? []).map((row) => row.id));
  } catch {
    return [];
  }

  return candidates
    .filter(({ tenant }) => activeIds.has(tenant.id))
    .map(({ tenant, domain }) => ({
      id: tenant.id,
      name: tenant.name,
      vertical: tenant.vertical,
      platform: PLATFORM_BY_VERTICAL[tenant.vertical],
      url: `https://${domain}`,
    }));
}
