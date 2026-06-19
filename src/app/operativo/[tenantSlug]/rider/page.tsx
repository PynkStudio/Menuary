import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { getRiderSession } from "@/lib/rider-session";
import { RiderLogin } from "@/components/modules/rider/rider-login";
import { RiderOrderList } from "@/components/modules/rider/rider-order-list";

export default async function RiderPortalPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant) notFound();
  if (!tenant.features.rider) notFound();

  const session = await getRiderSession();

  // Sessione non valida o per tenant diverso → login
  if (!session || session.tenantId !== tenantSlug) {
    return <RiderLogin tenantId={tenantSlug} tenantName={tenant.name} />;
  }

  return <RiderOrderList riderName={session.riderName} tenantId={tenantSlug} />;
}
