import { ActivitySettingsPanel } from "@/components/gestione/activity-settings-panel";
import { requireGestioneSection } from "@/lib/gestione-page";

export default async function GestioneActivityPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await requireGestioneSection(tenantSlug, "activity");
  return <ActivitySettingsPanel />;
}
