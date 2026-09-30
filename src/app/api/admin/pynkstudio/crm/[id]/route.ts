import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireSiteadmin } from "@/lib/pynkstudio/crm-admin";
import { addCrmActivity, cleanList } from "@/lib/pynkstudio/crm";
import { CRM_STATUSES, CRM_STATUS_LABELS, parseEmployees, type CrmStatus } from "@/lib/pynkstudio/crm-shared";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const { id } = await params;

  const [contact, activities] = await Promise.all([
    svc.from("pynkstudio_crm").select("*").eq("id", id).maybeSingle(),
    svc
      .from("pynkstudio_crm_activities")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (!contact.data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ contact: contact.data, activities: activities.data ?? [] });
}

export async function PATCH(request: Request, { params }: Ctx) {
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

  const { data: before } = await svc.from("pynkstudio_crm").select("status, next_follow_up_at").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  type CrmUpdate = Database["public"]["Tables"]["pynkstudio_crm"]["Update"];
  const patch: CrmUpdate = { updated_at: new Date().toISOString() };
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) || null : undefined);

  const company = text(body.company, 160);
  if (company !== undefined) patch.company = company;
  const industry = text(body.industry, 120);
  if (industry !== undefined) patch.industry = industry;
  const address = text(body.address, 240);
  if (address !== undefined) patch.address = address;
  const workHours = text(body.work_hours, 120);
  if (workHours !== undefined) patch.work_hours = workHours;
  const notes = text(body.notes, 8000);
  if (notes !== undefined) patch.notes = notes;
  const timing = text(body.timing, 60);
  if (timing !== undefined) patch.timing = timing;
  const plan = text(body.plan_interest, 120);
  if (plan !== undefined) patch.plan_interest = plan;

  if (body.employees !== undefined) {
    const { range, count } = parseEmployees(
      typeof body.employees === "number" || typeof body.employees === "string" ? body.employees : null,
    );
    patch.employees_range = range;
    patch.employees_count = count;
  }
  if (Array.isArray(body.tags)) patch.tags = cleanList(body.tags, 30, 40);
  if (Array.isArray(body.interests)) patch.interests = cleanList(body.interests);

  if (body.next_follow_up_at !== undefined) {
    const d = body.next_follow_up_at ? new Date(String(body.next_follow_up_at)) : null;
    patch.next_follow_up_at = d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
  }
  if (body.estimated_value !== undefined) {
    const n = body.estimated_value === null || body.estimated_value === "" ? null : Number(body.estimated_value);
    patch.estimated_value = n !== null && Number.isFinite(n) && n >= 0 ? n : null;
  }
  if (typeof body.unsubscribed === "boolean") {
    patch.unsubscribed_at = body.unsubscribed ? new Date().toISOString() : null;
  }
  if (typeof body.status === "string" && CRM_STATUSES.includes(body.status as CrmStatus)) {
    patch.status = body.status;
  }
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 160);
  if (typeof body.phone === "string") patch.phone = body.phone.trim().slice(0, 40);

  const { error } = await svc.from("pynkstudio_crm").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  if (patch.status && patch.status !== before.status) {
    await addCrmActivity(
      svc, id, "status",
      `Stato: ${CRM_STATUS_LABELS[before.status as CrmStatus] ?? before.status} → ${CRM_STATUS_LABELS[patch.status as CrmStatus]}`,
      undefined, "admin",
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const { id } = await params;
  const { error } = await svc.from("pynkstudio_crm").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
