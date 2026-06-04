import { NextResponse, type NextRequest } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import {
  listTenantDemoControls,
  upsertTenantDemoControl,
} from "@/lib/demo-controls";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireSiteAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(siteadmin?.role) &&
    hasAdminPermission(siteadmin.role, "tenant:manage")
    ? user
    : null;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!await requireSiteAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json({ controls: await listTenantDemoControls() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore caricamento demo" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!await requireSiteAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { tenantId, enabled, backendLive } = (body ?? {}) as {
    tenantId?: string;
    enabled?: boolean;
    backendLive?: boolean;
  };
  const tenant = tenantId ? findTenantById(tenantId) : undefined;
  const hasEnabledPatch = typeof enabled === "boolean";
  const hasBackendPatch = typeof backendLive === "boolean";

  if (!tenant?.previewSlug || (!hasEnabledPatch && !hasBackendPatch)) {
    return NextResponse.json(
      { error: "Tenant demo o patch non valido." },
      { status: 400 },
    );
  }

  try {
    const control = await upsertTenantDemoControl({
      tenantId: tenant.id,
      previewSlug: tenant.previewSlug,
      vertical: tenant.vertical,
      ...(hasEnabledPatch ? { enabled } : {}),
      ...(hasBackendPatch ? { backendLive } : {}),
    });
    return NextResponse.json({ control });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore aggiornamento demo" },
      { status: 500 },
    );
  }
}
