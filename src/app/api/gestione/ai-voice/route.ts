import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "missing_tenant" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (svc as any)
    .from("tenant_ai_voice")
    .select("tone, audience, keywords, do_examples, dont_examples")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return NextResponse.json(data ?? null);
}

export async function POST(req: NextRequest) {
  let body: { tenantId?: string; tone?: string; audience?: string; keywords?: string; do_examples?: string; dont_examples?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { tenantId } = body;
  if (!tenantId) return NextResponse.json({ error: "missing_tenant" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "db_unavailable" }, { status: 503 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any).from("tenant_ai_voice").upsert({
    tenant_id: tenantId,
    tone: body.tone ?? "",
    audience: body.audience ?? "",
    keywords: body.keywords ?? "",
    do_examples: body.do_examples ?? "",
    dont_examples: body.dont_examples ?? "",
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
