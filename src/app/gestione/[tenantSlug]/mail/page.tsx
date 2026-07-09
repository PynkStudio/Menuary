import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import "@/lib/mailapp-runtime";
import { MailApp } from "@pynkstudio/mailapp/react";
import { getInboundEmails, getInboxUnreadCounts, getTenantInboxUnreadCount } from "@pynkstudio/mailapp/email";
import { getSentDeliveryIssueCount, getSentEmails, buildTenantEmailScope } from "@pynkstudio/mailapp/email";
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

  // pynkstudio con companyPatrimoniale vede l'inbox globale (tutti i domini aziendali),
  // non solo la casella del tenant.
  const scope = access.canManagePatrimoniale ? undefined : buildTenantEmailScope(tenant);
  const [inbox, sent, unreadResult, deliveryIssueCount] = await Promise.all([
    getInboundEmails({ archived: false, scope }),
    getSentEmails("all", 1, scope),
    scope ? getTenantInboxUnreadCount(scope) : getInboxUnreadCounts().then((c) => c.unread_total),
    getSentDeliveryIssueCount("all", scope),
  ]);
  const unread = unreadResult;

  const isGlobalInbox = !scope;

  return (
    <div>
      <MailApp
        initialInbox={inbox}
        initialSent={sent}
        unreadTotal={unread}
        unreadMine={0}
        deliveryIssueCount={deliveryIssueCount}
        currentSiteadminId={isGlobalInbox ? (sa?.id as string | null ?? null) : null}
        canCompose={Boolean(ta || sa)}
        mode={isGlobalInbox ? undefined : "tenant"}
        scope={scope}
        tenantId={isGlobalInbox ? undefined : tenant.id}
        tenantName={isGlobalInbox ? undefined : tenant.name}
        tenantFromAddress={isGlobalInbox ? undefined : tenantFromAddress(tenant.id, tenant.domains)}
        currentUserEmail={(ta?.email as string | null | undefined) ?? user.email ?? null}
      />
    </div>
  );
}
