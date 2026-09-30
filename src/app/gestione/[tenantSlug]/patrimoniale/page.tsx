import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { PynkPatrimoniale } from "@/components/admin-pynkstudio/pynk-patrimoniale";

export const dynamic = "force-dynamic";

export default async function GestionePatrimonialePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  const access = tenant ? getGestioneModuleAccess(tenant.features) : null;
  if (!tenant || !access?.canManagePatrimoniale) notFound();

  return <PynkPatrimoniale />;
}
