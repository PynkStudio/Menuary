import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { ActivitySettingsPanel } from "@/components/gestione/activity-settings-panel";
import { GestioneSettingsPanel } from "@/components/gestione/gestione-settings-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenantDemoControl } from "@/lib/demo-controls";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { getPlatformModeFromHost, isDemoHost } from "@/lib/platform";
import { TENANTS } from "@/lib/tenant-registry";
import type { LoginFrom } from "@/lib/login-url";
import { getVerticalMeta } from "@/lib/vertical";

type SubscriptionSummary = {
  status: string;
  packageName: string | null;
  billingCycle: string;
  currency: string;
  nextRenewalAt: string | null;
  currentPeriodEnd: string | null;
  price: number | null;
};

type PlatformSubscriptionRow = {
  status: string;
  billing_cycle: string;
  currency: string;
  next_renewal_at: string | null;
  current_period_end: string | null;
  price_override: number | null;
  package: { name: string | null; price_monthly: number | null; price_monthly_billing: number | null } | null;
};

function resolveLoginFrom(host: string, tenantSlug: string): LoginFrom {
  const mode = getPlatformModeFromHost(host);
  const isDemoGestione = host === "demo.menuary.it" || host === "demo.menuary.localhost";
  if (mode === "gestione-bizery") return `gestione-bizery.${tenantSlug}`;
  if (mode === "gestione-custom") return `gestione-custom.${tenantSlug}`;
  if (isDemoGestione) return `gestione-demo.${tenantSlug}`;
  return `gestione.${tenantSlug}`;
}

function normalizeSubscription(row: PlatformSubscriptionRow | null): SubscriptionSummary | null {
  if (!row) return null;
  const packagePrice =
    row.billing_cycle === "monthly"
      ? row.package?.price_monthly_billing
      : row.package?.price_monthly;

  return {
    status: row.status,
    packageName: row.package?.name ?? null,
    billingCycle: row.billing_cycle,
    currency: row.currency,
    nextRenewalAt: row.next_renewal_at,
    currentPeriodEnd: row.current_period_end,
    price: row.price_override ?? packagePrice ?? null,
  };
}

async function loadSubscription(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  tenantSlug: string,
): Promise<SubscriptionSummary | null> {
  const { data: lead } = await supabase
    .from("platform_leads")
    .select("id")
    .eq("tenant_id", tenantSlug)
    .maybeSingle();
  if (!lead?.id) return null;

  const { data } = await supabase
    .from("platform_subscriptions")
    .select(`
      status,
      billing_cycle,
      currency,
      next_renewal_at,
      current_period_end,
      price_override,
      package:platform_packages(name, price_monthly, price_monthly_billing)
    `)
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return normalizeSubscription(data as PlatformSubscriptionRow | null);
}

export default async function GestioneSettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((item) => item.id === tenantSlug);
  if (!tenant) notFound();

  const host = (await headers()).get("host") ?? "";
  const isDemoHostname = isDemoHost(host);
  const demoControl = isDemoHostname ? await getTenantDemoControl(tenantSlug).catch(() => null) : null;
  const isDemo = isDemoHostname && !demoControl?.backendLive;
  const loginFrom = resolveLoginFrom(host, tenantSlug);
  const access = getGestioneModuleAccess(tenant.features);
  const vertical = getVerticalMeta(tenant.vertical);

  let subscription: SubscriptionSummary | null = null;

  if (!isDemoHostname || demoControl?.backendLive) {
    const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect(`https://login.menuary.it?from=${encodeURIComponent(loginFrom)}`);

    const [{ data: siteadmin }, { data: tenantadmin }, { data: employee }, { data: adminUser }] = await Promise.all([
      supabase.from("siteadmin").select("id").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
      supabase.from("tenantadmin").select("id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
      supabase.from("employee").select("id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
      supabase.from("admin_users").select("id").eq("auth_user_id", user.id).eq("tenant_id", tenantSlug).maybeSingle(),
    ]);

    if (!siteadmin && !tenantadmin && !employee && !adminUser) notFound();
    subscription = await loadSubscription(supabase, tenantSlug);
  }

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Impostazioni</span>
        <h1 className="ga-heading">Impostazioni</h1>
        <p className="ga-lead">
          {tenant.vertical === "creative"
            ? "Account, abbonamento, valuta e lingue del sito autore."
            : "Account, abbonamento, valuta, lingue e dati pubblici dell'attività."}
        </p>
      </header>

      <GestioneSettingsPanel
        tenantSlug={tenantSlug}
        tenantName={tenant.name}
        productName={vertical.productName}
        isCreative={tenant.vertical === "creative"}
        subscription={subscription}
        loginFrom={loginFrom}
        isDemo={isDemo}
      />

      {access.canManageActivity && tenant.vertical !== "creative" && (
        <div id="dati-attivita">
          <ActivitySettingsPanel />
        </div>
      )}
    </div>
  );
}
