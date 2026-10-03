import { PynkAgenda } from "@/components/admin-pynkstudio/pynk-agenda";
import { requireGestioneSection } from "@/lib/gestione-page";

export const dynamic = "force-dynamic";

export default async function GestioneAgendaPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await requireGestioneSection(tenantSlug, "agenda");
  return <PynkAgenda />;
}
