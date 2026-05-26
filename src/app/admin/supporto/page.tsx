import type { Metadata } from "next";
import { SupportAdminPage } from "@/components/admin/support/support-admin-page";
import { getCurrentSiteadmin, listSupportTicketMessages, listSupportTickets } from "@/lib/support/admin";
import { TENANTS } from "@/lib/tenant-registry";

export const metadata: Metadata = {
  title: "Supporto · Menuary Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const [siteadmin, tickets] = await Promise.all([
    getCurrentSiteadmin(),
    listSupportTickets(),
  ]);
  const messages = await listSupportTicketMessages(tickets.map((ticket) => ticket.id));
  const tenantNames = Object.fromEntries(TENANTS.map((tenant) => [tenant.id, tenant.name]));

  return (
    <SupportAdminPage
      initialTickets={tickets}
      initialMessages={messages}
      tenantNames={tenantNames}
      currentSiteadminId={siteadmin?.id ?? null}
    />
  );
}
