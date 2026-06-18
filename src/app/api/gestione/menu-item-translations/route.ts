import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";

export const runtime = "nodejs";

async function findItemDbId(tenantId: string, locationId: string, itemId: string) {
  const svc = createSupabaseServiceClient();
  if (!svc) return null;
  const { data } = await svc
    .from("menu_items")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("location_id", locationId)
    .eq("code", itemId)
    .maybeSingle();
  return data?.id ?? null;
}

// GET ?tenantId=xxx&itemId=yyy  → tutte le traduzioni di un piatto
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tenantId = searchParams.get("tenantId");
  const itemId = searchParams.get("itemId");

  if (!tenantId || !itemId) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (auth.isDemo) return NextResponse.json([]);
  const location = await requireActiveGestioneLocation(tenantId);

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json([]);

  const itemDbId = await findItemDbId(tenantId, location.id, itemId);
  if (!itemDbId) return NextResponse.json([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (svc as any)
    .from("menu_item_translations")
    .select("locale, name, description, ingredients")
    .eq("menu_item_id", itemDbId)
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json([], { status: 200 });

  return NextResponse.json(data ?? []);
}

// POST { tenantId, itemId, locale, name, description, ingredients }
export async function POST(req: NextRequest) {
  let body: {
    tenantId?: string;
    itemId?: string;
    locale?: string;
    name?: string;
    description?: string;
    ingredients?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { tenantId, itemId, locale } = body;
  if (!tenantId || !itemId || !locale) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (auth.isDemo) return NextResponse.json({ ok: true });
  const location = await requireActiveGestioneLocation(tenantId);

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  const itemDbId = await findItemDbId(tenantId, location.id, itemId);
  if (!itemDbId) return NextResponse.json({ error: "item_not_found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any)
    .from("menu_item_translations")
    .upsert(
      {
        menu_item_id: itemDbId,
        tenant_id: tenantId,
        locale,
        name: body.name ?? "",
        description: body.description ?? null,
        ingredients: body.ingredients?.length ? body.ingredients : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "menu_item_id,locale" },
    );

  if (error) {
    console.error("[menu-item-translations POST]", error.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
