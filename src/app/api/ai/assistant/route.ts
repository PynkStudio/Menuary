import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type Body = { tenantId: string; messages: { role: "user" | "assistant"; content: string }[] };

/** Assistente menu: risposta conservativa + contesto piatti (stub senza LLM esterno). */
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

  const last = [...(body.messages ?? [])].reverse().find((m) => m.role === "user");
  const q = last?.content?.trim() ?? "";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const svc = createSupabaseServiceClient();
  let profileHint = "";
  if (user && svc) {
    const { data: prof } = await svc
      .from("users")
      .select("is_vegetarian")
      .eq("user_id", user.id)
      .maybeSingle();
    if (prof?.is_vegetarian) profileHint = " Profilo: preferenze vegetariane.";
  }

  if (!svc || !q) {
    return NextResponse.json({
      reply:
        "Ciao! Scrivi cosa ti piace (es. piccante, pesce, vegetariano) e ti oriento sul menu." +
        profileHint,
    });
  }

  const { data: hits } = await svc
    .from("menu_items")
    .select("name,tags,available")
    .eq("tenant_id", body.tenantId)
    .eq("available", true)
    .ilike("name", `%${q.slice(0, 40)}%`)
    .limit(5);

  if (hits?.length) {
    return NextResponse.json({
      reply: `Ecco alcune piste dal menu: ${hits.map((h) => h.name).join(", ")}.${profileHint}`,
    });
  }

  return NextResponse.json({
    reply:
      "Prova a descrivere ingredienti o tipo di piatto; nel frattempo sfoglia le categorie sul sito." +
      profileHint,
  });
}
