import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { TENANTS } from "@/lib/tenant-registry";

const PLATFORM_ADMIN_EMAILS = new Set(["hello@menuary.it"]);

function bearerToken(req: NextRequest) {
  return req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
}

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const email = user.email?.toLowerCase() ?? "";
  const isPlatformAdmin = PLATFORM_ADMIN_EMAILS.has(email);

  if (isPlatformAdmin) {
    return NextResponse.json({
      user: { email, isPlatformAdmin: true },
      tenants: TENANTS
        .filter((t) => t.enabled)
        .map((t) => ({ id: t.id, name: t.name, label: t.label, vertical: t.vertical })),
    });
  }

  const [{ data: tenantAdmins }, { data: employees }] = await Promise.all([
    supabase
      .from("tenantadmin")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("enabled", true),
    supabase
      .from("employee")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("enabled", true),
  ]);

  const ids = new Set<string>();
  for (const row of tenantAdmins ?? []) ids.add(row.tenant_id);
  for (const row of employees ?? []) ids.add(row.tenant_id);

  return NextResponse.json({
    user: { email, isPlatformAdmin: false },
    tenants: TENANTS
      .filter((t) => ids.has(t.id))
      .map((t) => ({ id: t.id, name: t.name, label: t.label, vertical: t.vertical })),
  });
}
