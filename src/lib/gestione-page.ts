import "server-only";
import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { requireGestione } from "@/lib/gestione-auth";
import { getGestioneSection, type GestioneSectionKey } from "@/lib/gestione-sections";

/**
 * Guard comune delle pagine gestione: tenant dal DB (stessa fonte della shell),
 * modulo attivo e permesso del ruolo, letti dalla tabella delle sezioni.
 * Se una condizione manca la pagina risponde 404, come una voce che non esiste.
 */
export async function requireGestioneSection(tenantSlug: string, key: GestioneSectionKey) {
  const tenant = await getTenantById(tenantSlug);
  if (!tenant) notFound();

  const section = getGestioneSection(key);
  const access = getGestioneModuleAccess(tenant.features);
  if (!section.enabled({ access, features: tenant.features, vertical: tenant.vertical })) notFound();

  const auth = await requireGestione(tenantSlug, section.need);
  if (!auth.ok) notFound();

  return { tenant, access, auth };
}
