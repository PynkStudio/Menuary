import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = ["lead", "prospect", "client", "lost"] as const;

async function requireSiteadmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("siteadmin")
    .select("id")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return data?.id ? user : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSiteadmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  type CrmUpdate = Database["public"]["Tables"]["pynkstudio_crm"]["Update"];
  const patch: CrmUpdate = { updated_at: new Date().toISOString() };

  if (typeof body.company === "string") patch.company = body.company.trim() || null;
  if (body.employees_count !== undefined) {
    const n = body.employees_count === null ? null : Number(body.employees_count);
    patch.employees_count = n !== null && !Number.isNaN(n) ? n : null;
  }
  if (typeof body.industry === "string") patch.industry = body.industry.trim() || null;
  if (typeof body.address === "string") patch.address = body.address.trim() || null;
  if (typeof body.work_hours === "string") patch.work_hours = body.work_hours.trim() || null;
  if (typeof body.notes === "string") patch.notes = body.notes.trim() || null;
  if (Array.isArray(body.tags)) {
    patch.tags = (body.tags as unknown[]).filter((t): t is string => typeof t === "string" && t.trim() !== "").map((t) => t.trim());
  }
  if (typeof body.status === "string" && ALLOWED_STATUS.includes(body.status as typeof ALLOWED_STATUS[number])) {
    patch.status = body.status;
  }
  // Permettiamo anche di aggiornare nome e telefono (correzioni manuali)
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.phone === "string") patch.phone = body.phone.trim();

  const { error } = await svc.from("pynkstudio_crm").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
