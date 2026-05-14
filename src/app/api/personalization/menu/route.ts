import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Ranking menu lato server: usa profilo utente (se loggato) + menu tenant.
 */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId || !findTenantById(tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "supabase_service_unconfigured" }, { status: 503 });
  }

  const { data: items, error: me } = await svc
    .from("menu_items")
    .select("id,name,tags,available")
    .eq("tenant_id", tenantId)
    .eq("available", true);

  if (me) {
    return NextResponse.json({ error: me.message }, { status: 500 });
  }

  const list = items ?? [];
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      personalized: false,
      headline: null,
      itemIds: list.map((i) => i.id),
    });
  }

  const { data: profile } = await svc
    .from("user_profiles")
    .select("is_vegetarian,diet_notes,preferred_language")
    .eq("user_id", user.id)
    .maybeSingle();

  const veg = profile?.is_vegetarian === true;
  const score = (tags: string[] | null) => {
    const t = tags ?? [];
    const lower = t.map((x) => x.toLowerCase());
    if (!veg) return 0;
    if (lower.some((x) => x.includes("veg") || x.includes("veget"))) return 2;
    return 0;
  };

  const ranked = [...list].sort((a, b) => score(b.tags) - score(a.tags));

  return NextResponse.json({
    personalized: veg,
    headline: veg ? "Abbiamo pensato a te: piatti adatti al vegetariano" : null,
    itemIds: ranked.map((i) => i.id),
  });
}
