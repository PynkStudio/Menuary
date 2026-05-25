import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { AiPhoneQuickSettings } from "@/components/gestione/ai-phone-quick-settings";

export default async function GestioneAssistenteAiPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((item) => item.id === tenantSlug);
  if (!tenant) notFound();

  return <AiPhoneQuickSettings tenantId={tenantSlug} />;
}
