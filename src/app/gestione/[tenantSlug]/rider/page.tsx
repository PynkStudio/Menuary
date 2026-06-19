import { notFound } from "next/navigation";
import { authorizeGestione } from "@/lib/gestione-auth";
import { findTenantById } from "@/lib/tenant-registry";
import { RiderPanel } from "@/components/gestione/rider-panel";

export default async function RiderPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();

  const tenant = findTenantById(tenantSlug);
  if (!tenant?.features.rider) notFound();

  return <RiderPanel tenantId={tenantSlug} />;
}
