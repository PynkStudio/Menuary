import { getTenantLinktreeItems } from "@/lib/tenant-linktree";
import { LinktreeManager } from "@/components/gestione/linktree-manager";
import { requireGestioneSection } from "@/lib/gestione-page";

export default async function GestioneLinktreePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await requireGestioneSection(tenantSlug, "linktree");
  const links = await getTenantLinktreeItems(tenantSlug);
  return <LinktreeManager tenantId={tenantSlug} initialLinks={links} />;
}
