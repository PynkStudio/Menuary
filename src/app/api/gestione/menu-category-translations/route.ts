import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";

export const runtime = "nodejs";

async function findCategoryDbId(tenantId: string, locationId: string, categoryId: string) {
  const svc = createSupabaseServiceClient();
  if (!svc) return null;
  const { data } = await svc
    .from("menu_categories")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("location_id", locationId)
    .eq("code", categoryId)
    .maybeSingle();
  return data?.id ?? null;
}

// GET ?tenantId=xxx&categoryId=yyy -> tutte le traduzioni di una categoria
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tenantId = searchParams.get("tenantId");
  const categoryId = searchParams.get("categoryId");

  if (!tenantId || !categoryId) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (auth.isDemo) return NextResponse.json([]);
  const location = await requireActiveGestioneLocation(tenantId);

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json([]);

  const categoryDbId = await findCategoryDbId(tenantId, location.id, categoryId);
  if (!categoryDbId) return NextResponse.json([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (svc as any)
    .from("menu_category_translations")
    .select("locale, title, subtitle, description")
    .eq("menu_category_id", categoryDbId)
    .eq("tenant_id", tenantId);

  return NextResponse.json(data ?? []);
}

// POST { tenantId, categoryId, locale, title, subtitle, description }
export async function POST(req: NextRequest) {
  let body: {
    tenantId?: string;
    categoryId?: string;
    locale?: string;
    title?: string;
    subtitle?: string;
    description?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { tenantId, categoryId, locale } = body;
  if (!tenantId || !categoryId || !locale) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (auth.isDemo) return NextResponse.json({ ok: true });
  const location = await requireActiveGestioneLocation(tenantId);

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "db_unavailable" }, { status: 503 });

  const categoryDbId = await findCategoryDbId(tenantId, location.id, categoryId);
  if (!categoryDbId) return NextResponse.json({ error: "category_not_found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any)
    .from("menu_category_translations")
    .upsert(
      {
        menu_category_id: categoryDbId,
        tenant_id: tenantId,
        locale,
        title: body.title ?? "",
        subtitle: body.subtitle ?? null,
        description: body.description ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "menu_category_id,locale" },
    );

  if (error) {
    console.error("[menu-category-translations POST]", error.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
