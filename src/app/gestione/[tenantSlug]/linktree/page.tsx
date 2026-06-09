import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { getTenantLinktreeItems } from "@/lib/tenant-linktree";
import { LinktreeManager } from "@/components/gestione/linktree-manager";

export default async function GestioneLinktreePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant || !tenant.features.linktree) notFound();

  const links = await getTenantLinktreeItems(tenantSlug);
  return <LinktreeManager tenantId={tenantSlug} initialLinks={links} />;
}
