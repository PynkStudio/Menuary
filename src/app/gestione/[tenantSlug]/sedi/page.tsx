import { notFound, redirect } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";

export default async function SediPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant || !getGestioneModuleAccess(tenant.features).canManageLocations) notFound();

  redirect(`/gestione/${tenantSlug}`);
}
