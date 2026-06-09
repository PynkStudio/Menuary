import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { AiPhoneQuickSettings } from "@/components/gestione/ai-phone-quick-settings";

export default async function GestioneAssistenteAiPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant || (!tenant.features.aiPhone && !tenant.features.aiWhatsapp)) notFound();

  return <AiPhoneQuickSettings tenantId={tenantSlug} />;
}
