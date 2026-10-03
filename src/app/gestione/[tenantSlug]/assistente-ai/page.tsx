import { AiPhoneQuickSettings } from "@/components/gestione/ai-phone-quick-settings";
import { requireGestioneSection } from "@/lib/gestione-page";

export default async function GestioneAssistenteAiPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await requireGestioneSection(tenantSlug, "aiAssistant");
  return <AiPhoneQuickSettings tenantId={tenantSlug} />;
}
