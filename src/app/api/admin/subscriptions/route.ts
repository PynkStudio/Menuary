import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listSubscriptions } from "@/lib/platform/subscription-service";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  PLATFORM_PACKAGES,
  PLATFORM_ADDON_PACKAGES,
} from "@/lib/platform-admin-data";
import type {
  PlatformPackage,
  PlatformPayment,
  PlatformSubscription,
} from "@/lib/platform-crm-types";

export const dynamic = "force-dynamic";

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(sa?.role) && hasAdminPermission(sa.role, "crm:view")
    ? user
    : null;
}

function packageBySlug(slug: string | null): PlatformPackage | undefined {
  if (!slug) return undefined;
  return (
    PLATFORM_PACKAGES.find((p) => p.slug === slug) ??
    PLATFORM_ADDON_PACKAGES.find((p) => p.slug === slug)
  );
}

type LeadLite = {
  id: string;
  business_name: string;
  business_slug: string | null;
  tenant_id: string | null;
  sales_owner_id: string | null;
  sales_owner_name: string | null;
  created_by_id: string | null;
  created_by_name: string | null;
  converted_at: string | null;
};

export async function GET() {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createSupabaseServiceClient();
  if (!db) {
    return NextResponse.json({ subscriptions: [], payments: [] });
  }

  const subsRaw = await listSubscriptions();

  const leadIds = [...new Set(subsRaw.map((s) => s.lead_id).filter(Boolean))];
  const subIds = subsRaw.map((s) => s.id);

  const [{ data: leadRows }, { data: paymentRows }] = await Promise.all([
    leadIds.length
      ? db
          .from("platform_leads")
          .select(
            "id, business_name, business_slug, tenant_id, sales_owner_id, sales_owner_name, created_by_id, created_by_name, converted_at",
          )
          .in("id", leadIds)
      : Promise.resolve({ data: [] as LeadLite[] }),
    subIds.length
      ? db.from("platform_payments").select("*").in("subscription_id", subIds)
      : Promise.resolve({ data: [] as PlatformPayment[] }),
  ]);

  const leadsById = new Map<string, LeadLite>(
    ((leadRows ?? []) as LeadLite[]).map((l) => [l.id, l]),
  );

  const subscriptions = subsRaw.map((s) => {
    const lead = leadsById.get(s.lead_id);
    return {
      ...s,
      package: packageBySlug(s.package_slug),
      lead: lead
        ? ({
            id: lead.id,
            business_name: lead.business_name,
            business_slug: lead.business_slug,
            tenant_id: lead.tenant_id,
            sales_owner_id: lead.sales_owner_id,
            sales_owner_name: lead.sales_owner_name,
            created_by_id: lead.created_by_id,
            created_by_name: lead.created_by_name,
            converted_at: lead.converted_at,
          } as Partial<PlatformSubscription["lead"]>)
        : undefined,
    };
  }) as unknown as PlatformSubscription[];

  return NextResponse.json({
    subscriptions,
    payments: (paymentRows ?? []) as PlatformPayment[],
  });
}
