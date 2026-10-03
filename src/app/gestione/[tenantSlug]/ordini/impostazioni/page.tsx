import { OrderSettingsPanel } from "@/components/gestione/order-settings-panel";
import { requireGestioneSection } from "@/lib/gestione-page";

export default async function GestioneOrderSettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await requireGestioneSection(tenantSlug, "orderSettings");
  return <OrderSettingsPanel />;
}
