import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { gestioneLocationCookieName } from "@/lib/gestione-location";

type Body = {
  tenantId?: string;
  locationId?: string;
  remember?: boolean;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const tenantId = body?.tenantId?.trim() ?? "";
  const locationId = body?.locationId?.trim() ?? "";
  if (!tenantId || !locationId) {
    return NextResponse.json({ error: "tenantId e locationId sono obbligatori" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: siteadmin }, { data: tenantadmin }, { data: employee }, { data: adminUser }] = await Promise.all([
    supabase.from("siteadmin").select("id").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    supabase.from("tenantadmin").select("id").eq("user_id", user.id).eq("tenant_id", tenantId).eq("enabled", true).maybeSingle(),
    supabase.from("employee").select("id").eq("user_id", user.id).eq("tenant_id", tenantId).eq("enabled", true).maybeSingle(),
    supabase.from("admin_users").select("id").eq("auth_user_id", user.id).eq("tenant_id", tenantId).eq("enabled", true).maybeSingle(),
  ]);
  if (!siteadmin && !tenantadmin && !employee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!location) return NextResponse.json({ error: "Sede non valida" }, { status: 404 });

  if (!siteadmin && !tenantadmin && adminUser) {
    const { data: restrictions } = await supabase
      .from("staff_locations")
      .select("location_id")
      .eq("admin_user_id", adminUser.id);
    if (restrictions?.length && !restrictions.some((row) => row.location_id === locationId)) {
      return NextResponse.json({ error: "Sede non autorizzata" }, { status: 403 });
    }
  }

  const response = NextResponse.json({ ok: true });
  const cookieName = gestioneLocationCookieName(tenantId);
  const rememberCookieName = `${cookieName}_remember`;
  const remember = body?.remember ?? request.cookies.get(rememberCookieName)?.value === "1";
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 180 } : {}),
  } as const;
  response.cookies.set(cookieName, locationId, cookieOptions);
  response.cookies.set(rememberCookieName, remember ? "1" : "0", cookieOptions);
  return response;
}
