import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type Body = { tenantId: string; itemIds?: string[]; message?: string };

/**
 * Suggerimenti oculati senza LLM: abbina tag / abv del menu (modulo upselling).
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.tenantId || !findTenantById(body.tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ suggestions: [], note: "no_service_db" });
  }

  const ids = body.itemIds?.filter(Boolean) ?? [];
  if (ids.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const { data: items } = await svc
    .from("menu_items")
    .select("id,name,tags,abv")
    .eq("tenant_id", body.tenantId)
    .in("id", ids);

  const suggestions: { itemId: string; text: string }[] = [];
  for (const it of items ?? []) {
    const tags = (it.tags ?? []).map((t) => t.toLowerCase()).join(" ");
    if (tags.includes("pizza") || tags.includes("burger")) {
      if (it.abv) {
        suggestions.push({
          itemId: it.id,
          text: `Con ${it.name} sta bene una birra selezionata (${it.abv}).`,
        });
      } else {
        suggestions.push({
          itemId: it.id,
          text: `Completa con contorno o birra artigianale in lista.`,
        });
      }
    }
  }

  return NextResponse.json({ suggestions });
}
