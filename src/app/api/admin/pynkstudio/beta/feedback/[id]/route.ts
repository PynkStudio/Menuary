import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireSiteadmin } from "@/lib/pynkstudio/crm-admin";
import { BETA_FEEDBACK_STATUSES } from "@/lib/pynkstudio/beta-shared";

export const dynamic = "force-dynamic";

/** { status?, admin_notes? } */
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
  const patch: { status?: string; admin_notes?: string | null; updated_at: string } = { updated_at: new Date().toISOString() };
  if (typeof body.status === "string") {
    if (!BETA_FEEDBACK_STATUSES.some((s) => s.id === body.status)) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    patch.status = body.status;
  }
  if (typeof body.admin_notes === "string") patch.admin_notes = body.admin_notes.trim().slice(0, 4000) || null;

  const { data, error } = await svc.from("pynkstudio_beta_feedback").update(patch).eq("id", id).select("*").single();
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ feedback: data });
}
