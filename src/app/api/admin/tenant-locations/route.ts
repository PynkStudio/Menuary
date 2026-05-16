import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

/**
 * GET /api/admin/tenant-locations?tenantId=xxx
 * Ritorna il numero di sedi attuali e il limite max_locations per il tenant.
 */
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  if (!await requireSiteAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ count }, { data: tenantRow }] = await Promise.all([
    supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("tenants")
      .select("site_config")
      .eq("id", tenantId)
      .maybeSingle(),
  ]);

  const config = (tenantRow?.site_config as Record<string, unknown> | null) ?? {};
  const maxLocations = typeof config.max_locations === "number" ? config.max_locations : 1;

  return NextResponse.json({
    tenantId,
    currentCount: count ?? 0,
    maxLocations,
  });
}

/**
 * PATCH /api/admin/tenant-locations
 * Aggiorna max_locations nel site_config del tenant.
 * Solo siteadmin può chiamare questa API.
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { tenantId, maxLocations } = body as { tenantId: string; maxLocations: number };
  if (!tenantId || typeof maxLocations !== "number" || maxLocations < 1 || maxLocations > 50) {
    return NextResponse.json(
      { error: "maxLocations deve essere un numero tra 1 e 50" },
      { status: 422 },
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!await requireSiteAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Legge site_config attuale per merge non-distruttivo
  const { data: existing } = await supabase
    .from("tenants")
    .select("site_config")
    .eq("id", tenantId)
    .maybeSingle();

  const currentConfig = (existing?.site_config as Record<string, unknown> | null) ?? {};
  const newConfig = { ...currentConfig, max_locations: maxLocations };

  const { error } = await supabase
    .from("tenants")
    .update({ site_config: newConfig, updated_at: new Date().toISOString() })
    .eq("id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tenantId, maxLocations });
}
