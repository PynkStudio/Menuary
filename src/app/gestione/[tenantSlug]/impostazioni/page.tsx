import { headers } from "next/headers";
import { GestioneSettingsPanel } from "@/components/gestione/gestione-settings-panel";
import { getPlatformModeFromHost } from "@/lib/platform";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireGestioneSection } from "@/lib/gestione-page";
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
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
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
  const { tenant, auth } = await requireGestioneSection(tenantSlug, "settings");

  const host = (await headers()).get("host") ?? "";
  const loginFrom = resolveLoginFrom(host, tenantSlug);
  const vertical = getVerticalMeta(tenant.vertical);

  // platform_leads e platform_subscriptions non hanno policy RLS: con la sessione
  // dell'utente la lettura tornava sempre vuota. Si legge col service role, ma
  // solo per chi può vedere i dati economici e mai sulla demo backend live.
  const canSeeSubscription =
    !auth.isDemo && auth.userId !== "demo" && auth.capabilities.can_view_financials;
  const service = canSeeSubscription ? createSupabaseServiceClient() : null;
  const subscription = service ? await loadSubscription(service, tenantSlug) : null;

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Impostazioni</span>
        <h1 className="ga-heading">Impostazioni</h1>
        <p className="ga-lead">
          {tenant.vertical === "creative"
            ? "Account, abbonamento, valuta e lingue del sito autore."
            : "Account, abbonamento, valuta e lingue."}
        </p>
      </header>

      <GestioneSettingsPanel
        tenantSlug={tenantSlug}
        tenantName={tenant.name}
        productName={vertical.productName}
        isCreative={tenant.vertical === "creative"}
        subscription={subscription}
        loginFrom={loginFrom}
        isDemo={auth.isDemo}
      />
    </div>
  );
}
