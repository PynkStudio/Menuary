import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { PynkAgenda } from "@/components/admin-pynkstudio/pynk-agenda";

export const dynamic = "force-dynamic";

export default async function GestioneAgendaPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  const access = tenant ? getGestioneModuleAccess(tenant.features) : null;
  if (!tenant || !access?.canManagePynkAgenda) notFound();

  return <PynkAgenda />;
}
