import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { MailApp } from "@/components/admin/inbox/mail-app";
import { getInboundEmails, getTenantInboxUnreadCount } from "@/lib/email/inbound-queries";
import { getSentEmails } from "@/lib/email/sent-queries";
import { buildTenantEmailScope } from "@/lib/email/tenant-email-scope";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { isDemoHost } from "@/lib/platform";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenantContent } from "@/lib/tenant-content";
import { getTenantById } from "@/lib/data/tenant";

function activeMailDomain(domains: string[]): string | null {
  return domains.find((domain) =>
    !domain.includes("localhost") &&
    !domain.endsWith(".local") &&
    domain !== "127.0.0.1",
  ) ?? null;
}

function tenantFromAddress(tenantId: string, domains: string[]): string | undefined {
  const domain = activeMailDomain(domains);
  if (!domain) return undefined;

  const contactEmail = getTenantContent(tenantId).contact.email?.trim().toLowerCase();
  if (contactEmail?.endsWith(`@${domain.toLowerCase()}`)) return contactEmail;
  return `info@${domain}`;
}

export default async function GestioneMailPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  const access = tenant ? getGestioneModuleAccess(tenant.features) : null;
  if (!tenant || !access?.canManageMail) notFound();

  const host = (await headers()).get("host");
  if (isDemoHost(host)) {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Comunicazioni</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Mail</h1>
        <p className="mt-3 max-w-2xl opacity-70">
          La casella mail non è disponibile nella demo offline.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`https://login.menuary.it?from=gestione.${tenantSlug}`);

  const [{ data: sa }, { data: ta }] = await Promise.all([
    supabase.from("siteadmin").select("id").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    supabase
      .from("tenantadmin")
      .select("id,email")
      .eq("user_id", user.id)
      .eq("tenant_id", tenantSlug)
      .eq("enabled", true)
      .maybeSingle(),
  ]);

  if (!sa && !ta) notFound();

  const scope = buildTenantEmailScope(tenant);
  const [inbox, sent, unread] = await Promise.all([
    getInboundEmails({ archived: false, scope }),
    getSentEmails("all", 1, scope),
    getTenantInboxUnreadCount(scope),
  ]);

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Comunicazioni</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Mail</h1>
        <p className="mt-3 max-w-2xl opacity-70">
          Casella interna di {tenant.name}.
        </p>
      </div>

      <MailApp
        initialInbox={inbox}
        initialSent={sent}
        unreadTotal={unread}
        unreadMine={0}
        currentSiteadminId={null}
        canCompose={Boolean(ta || sa)}
        mode="tenant"
        scope={scope}
        tenantId={tenant.id}
        tenantName={tenant.name}
        tenantFromAddress={tenantFromAddress(tenant.id, tenant.domains)}
        currentUserEmail={(ta?.email as string | null | undefined) ?? user.email ?? null}
      />
    </div>
  );
}
