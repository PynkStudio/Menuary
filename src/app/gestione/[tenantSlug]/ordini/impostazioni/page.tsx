import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { OrderSettingsPanel } from "@/components/gestione/order-settings-panel";

export default async function GestioneOrderSettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();

  const access = getGestioneModuleAccess(tenant.features);
  if (!access.hasOrders) notFound();

  return <OrderSettingsPanel />;
}
