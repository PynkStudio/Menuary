import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireSiteadmin } from "@/lib/pynkstudio/crm-admin";
import { parseBetaInput } from "../beta-input";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const input = parseBetaInput(body);
  if (input.name === "" || input.slug === "") return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { data: current } = await svc.from("pynkstudio_betas").select("published_at").eq("id", id).maybeSingle();
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const publishing = !current.published_at && input.status && input.status !== "draft";

  const { data, error } = await svc
    .from("pynkstudio_betas")
    .update({
      ...input,
      ...(publishing ? { published_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error?.code === "23505") return NextResponse.json({ error: "slug_exists" }, { status: 409 });
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ beta: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const { id } = await params;
  const { error } = await svc.from("pynkstudio_betas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
