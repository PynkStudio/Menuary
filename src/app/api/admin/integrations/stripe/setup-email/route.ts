import { NextResponse, type NextRequest } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import type { TenantSetupModule } from "@/lib/payments/stripe/setup-link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { TenantFeatureFlags, TenantVertical } from "@/lib/tenant";
import { sendTenantSetupEmail } from "@/lib/tenant-setup/email";
import { findTenantById } from "@/lib/tenant-registry";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireSiteAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(sa?.role) && hasAdminPermission(sa.role, "tenant:manage") ? user : null;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!await requireSiteAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as
    | { tenantId?: string; email?: string; modules?: TenantSetupModule[] }
    | null;

  const tenantId = body?.tenantId?.trim();
  const email = body?.email?.trim().toLowerCase();
  if (!tenantId || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "tenantId ed email valida sono obbligatori." }, { status: 400 });
  }

  const fallback = findTenantById(tenantId);
  const db = createSupabaseServiceClient();
  const { data: tenantRow, error: tenantError } = db
    ? await db
        .from("tenants")
        .select("id,name,label,vertical,features")
        .eq("id", tenantId)
        .maybeSingle()
    : { data: null, error: null };

  if (tenantError) return NextResponse.json({ error: tenantError.message }, { status: 500 });
  if (!tenantRow && !fallback) {
    return NextResponse.json({ error: "Tenant non trovato." }, { status: 404 });
  }

  const modules = (body?.modules?.length ? body.modules : ["stripe"])
    .filter((item): item is TenantSetupModule => item === "stripe" || item === "hubrise");
  if (!modules.length) {
    return NextResponse.json({ error: "Nessun modulo configurabile richiesto." }, { status: 400 });
  }

  const features =
    tenantRow?.features && typeof tenantRow.features === "object" && !Array.isArray(tenantRow.features)
      ? (tenantRow.features as Partial<TenantFeatureFlags>)
      : fallback?.features;
  if (modules.includes("stripe") && !features?.payments) {
    return NextResponse.json({ error: "Attiva prima il modulo Pagamenti Stripe." }, { status: 409 });
  }
  if (modules.includes("hubrise") && !features?.hubriseSync) {
    return NextResponse.json({ error: "Attiva prima il modulo HubRise." }, { status: 409 });
  }

  const vertical = ((tenantRow?.vertical as TenantVertical | undefined) ?? fallback?.vertical ?? "food");
  const tenantName = tenantRow?.name ?? tenantRow?.label ?? fallback?.name ?? tenantId;
  const result = await sendTenantSetupEmail({
    tenantId,
    tenantName,
    email,
    vertical,
    modules,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    email,
    setupUrl: result.setupUrl,
    messageId: result.messageId,
  });
}
