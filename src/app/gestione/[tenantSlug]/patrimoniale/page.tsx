import { PynkPatrimoniale } from "@/components/admin-pynkstudio/pynk-patrimoniale";
import { requireGestioneSection } from "@/lib/gestione-page";

export const dynamic = "force-dynamic";

export default async function GestionePatrimonialePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await requireGestioneSection(tenantSlug, "patrimoniale");
  return <PynkPatrimoniale />;
}
