import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import {
  suggestIngredients,
  rewriteDescription,
  translateItem,
  type AiVoice,
} from "@/lib/menu-item-ai";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type Body = {
  action: "suggest-ingredients" | "rewrite-description" | "translate";
  tenantId: string;
  name: string;
  description?: string;
  ingredients?: string[];
  fromLang?: string;
  toLang?: string;
};

async function getVoice(tenantId: string): Promise<AiVoice | null> {
  const svc = createSupabaseServiceClient();
  if (!svc) return null;
  const { data } = await svc
    .from("tenant_ai_voice")
    .select("tone, audience, keywords, do_examples, dont_examples")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return data ?? null;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { action, tenantId, name } = body;
  if (!action || !tenantId || !name) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const voice = await getVoice(tenantId);

  try {
    switch (action) {
      case "suggest-ingredients": {
        const result = await suggestIngredients({
          name,
          description: body.description,
          voice,
        });
        return NextResponse.json(result);
      }

      case "rewrite-description": {
        const result = await rewriteDescription({
          name,
          currentDescription: body.description,
          voice,
        });
        return NextResponse.json(result);
      }

      case "translate": {
        if (!body.fromLang || !body.toLang) {
          return NextResponse.json({ error: "missing_lang" }, { status: 400 });
        }
        const result = await translateItem({
          name,
          description: body.description,
          ingredients: body.ingredients,
          fromLang: body.fromLang,
          toLang: body.toLang,
          voice,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: "unknown_action" }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("openai_api_key_missing")) {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }
    console.error("[menu-item-ai]", msg);
    return NextResponse.json({ error: "ai_error", detail: msg }, { status: 500 });
  }
}
