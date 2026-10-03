import { RiderPanel } from "@/components/gestione/rider-panel";
import { requireGestioneSection } from "@/lib/gestione-page";

export default async function RiderPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await requireGestioneSection(tenantSlug, "rider");
  return <RiderPanel tenantId={tenantSlug} />;
}
