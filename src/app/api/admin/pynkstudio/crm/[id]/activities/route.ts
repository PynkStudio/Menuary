import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireSiteadmin } from "@/lib/pynkstudio/crm-admin";
import { addCrmActivity } from "@/lib/pynkstudio/crm";
import { CRM_ACTIVITY_LABELS, CRM_MANUAL_ACTIVITY_TYPES, type CrmActivityType } from "@/lib/pynkstudio/crm-shared";

export const dynamic = "force-dynamic";

/** Registra a mano una nota, una telefonata, un'email o un WhatsApp sul contatto. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const { id } = await params;

  let body: { type?: string; body?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const type = (body.type ?? "note") as CrmActivityType;
  const text = (body.body ?? "").trim();
  if (!CRM_MANUAL_ACTIVITY_TYPES.includes(type) || !text) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { data: contact } = await svc.from("pynkstudio_crm").select("id").eq("id", id).maybeSingle();
  if (!contact) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await addCrmActivity(svc, id, type, (body.title ?? "").trim() || CRM_ACTIVITY_LABELS[type], text, "admin");
  const now = new Date().toISOString();
  await svc.from("pynkstudio_crm").update({ last_activity_at: now, updated_at: now }).eq("id", id);

  const { data: activities } = await svc
    .from("pynkstudio_crm_activities")
    .select("*")
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .limit(200);
  return NextResponse.json({ activities: activities ?? [], last_activity_at: now });
}
