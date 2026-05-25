import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole, type SiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAiPhoneSettings,
  listAiPhoneSettings,
  upsertAiPhoneSettings,
  type AiPhoneSettingsPatch,
} from "@/lib/retell/settings";

async function requirePermission() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autenticato.", status: 401 as const };

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  const role = isSiteadminRole(siteadmin?.role) ? siteadmin.role as SiteadminRole : null;
  if (!hasAdminPermission(role, "tenant:manage")) {
    return { error: "Non autorizzato.", status: 403 as const };
  }
  return { error: null, status: 200 as const };
}

export async function GET(req: NextRequest) {
  const auth = await requirePermission();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const tenantId = req.nextUrl.searchParams.get("tenantId");
    if (tenantId) return NextResponse.json({ settings: await getAiPhoneSettings(tenantId) });
    return NextResponse.json({ settings: await listAiPhoneSettings() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "settings_load_failed" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requirePermission();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => null)) as ({ tenantId?: string } & AiPhoneSettingsPatch) | null;
  if (!body?.tenantId) return NextResponse.json({ error: "tenantId obbligatorio." }, { status: 400 });

  try {
    const { tenantId, ...patch } = body;
    return NextResponse.json({ settings: await upsertAiPhoneSettings(tenantId, patch) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "settings_save_failed" },
      { status: 500 },
    );
  }
}
