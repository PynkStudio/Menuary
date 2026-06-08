import { NextResponse, type NextRequest } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { findTenantById } from "@/lib/tenant-registry";
import { TENANT_MODULE_BY_KEY } from "@/lib/tenant-modules";
import type { TenantFeatureFlags, TenantFeatureKey } from "@/lib/tenant";

async function requireSiteAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
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

function isTenantFeatureKey(value: unknown): value is TenantFeatureKey {
  return typeof value === "string" && value in TENANT_MODULE_BY_KEY;
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { tenantId, feature, enabled } = (body ?? {}) as {
    tenantId?: string;
    feature?: unknown;
    enabled?: boolean;
  };

  if (!tenantId || !isTenantFeatureKey(feature) || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "tenantId, feature e enabled sono obbligatori." }, { status: 400 });
  }

  const authClient = await createSupabaseServerClient();
  if (!await requireSiteAdmin(authClient)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "DB non disponibile" }, { status: 500 });

  const { data: row, error: readError } = await db
    .from("tenants")
    .select("features")
    .eq("id", tenantId)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const fallback = findTenantById(tenantId);
  if (!row && !fallback) return NextResponse.json({ error: "Tenant non trovato." }, { status: 404 });

  const dbFeatures =
    row?.features && typeof row.features === "object" && !Array.isArray(row.features)
      ? (row.features as Partial<TenantFeatureFlags>)
      : {};
  const nextFeatures: TenantFeatureFlags = {
    ...(fallback?.features ?? {}),
    ...dbFeatures,
    [feature]: enabled,
  } as TenantFeatureFlags;

  const { error: updateError } = await db
    .from("tenants")
    .update({
      features: nextFeatures,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ tenantId, features: nextFeatures });
}
