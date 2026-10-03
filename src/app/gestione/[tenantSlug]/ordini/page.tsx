import OperativoOrdiniPage from "../../../operativo/[tenantSlug]/ordini/page";
import { requireGestioneSection } from "@/lib/gestione-page";
import { getActiveGestioneLocation } from "@/lib/gestione-location";

// La coda ordini è la stessa del portale operativo: in gestione la sede è
// quella scelta nella shell, non un parametro dell'URL.
export default async function GestioneOrdiniPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ f?: string; loc?: string; location?: string }>;
}) {
  const { tenantSlug } = await params;
  const { auth } = await requireGestioneSection(tenantSlug, "orders");
  const query = await searchParams;
  const explicit = query.loc ?? query.location;
  const active = explicit || auth.isDemo ? null : await getActiveGestioneLocation(tenantSlug);

  return (
    <OperativoOrdiniPage
      params={params}
      searchParams={Promise.resolve({ ...query, loc: explicit ?? active?.slug })}
    />
  );
}
