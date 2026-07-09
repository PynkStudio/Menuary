import type { Metadata } from "next";
import { ErrorEventsDashboard } from "@/components/support/error-events-dashboard";
import { listPlatformErrors } from "@/lib/platform-errors";
import { getCurrentSiteadmin } from "@/lib/support/admin";
import { TENANTS } from "@/lib/tenant-registry";

export const metadata: Metadata = {
  title: "Errori operativi · Menuary Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminErrorEventsPage() {
  const [siteadmin, events] = await Promise.all([
    getCurrentSiteadmin(),
    listPlatformErrors(),
  ]);
  const tenantNames = Object.fromEntries(TENANTS.map((tenant) => [tenant.id, tenant.name]));

  return (
    <ErrorEventsDashboard
      initialEvents={events}
      currentSiteadminId={siteadmin?.id ?? null}
      tenantNames={tenantNames}
    />
  );
}
