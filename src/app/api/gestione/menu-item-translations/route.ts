import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

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

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json([]);

  // menu_item_id è uuid nel DB, itemId è la stringa dell'ID client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (svc as any)
    .from("menu_item_translations")
    .select("locale, name, description, ingredients")
    .eq("menu_item_id", itemId)
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

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "db_unavailable" }, { status: 503 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any)
    .from("menu_item_translations")
    .upsert(
      {
        menu_item_id: itemId,
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
