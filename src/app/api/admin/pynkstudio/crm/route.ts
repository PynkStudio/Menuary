import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { applyCrmFilters, requireSiteadmin } from "@/lib/pynkstudio/crm-admin";
import { addCrmActivity, cleanList } from "@/lib/pynkstudio/crm";
import { CRM_STATUSES, parseEmployees, type CrmStatus } from "@/lib/pynkstudio/crm-shared";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const SORTS: Record<string, { column: string; ascending: boolean; nullsFirst?: boolean }> = {
  recent: { column: "last_activity_at", ascending: false },
  created: { column: "created_at", ascending: false },
  name: { column: "name", ascending: true },
  size: { column: "employees_count", ascending: false, nullsFirst: false },
  followup: { column: "next_follow_up_at", ascending: true, nullsFirst: false },
};

export async function GET(request: Request) {
  if (!(await requireSiteadmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  const url = new URL(request.url);
  const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
  const sort = SORTS[url.searchParams.get("sort") ?? "recent"] ?? SORTS.recent;

  const listQuery = applyCrmFilters(svc.from("pynkstudio_crm").select("*", { count: "exact" }), url)
    .order(sort.column, { ascending: sort.ascending, nullsFirst: sort.nullsFirst ?? false })
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  // Il CRM è piccolo: i conteggi per stato/sorgente si calcolano da colonne leggere, senza filtri.
  const summaryQuery = svc
    .from("pynkstudio_crm")
    .select("status, source, next_follow_up_at, created_at, unsubscribed_at, estimated_value")
    .limit(5000);

  const [list, summary] = await Promise.all([listQuery, summaryQuery]);
  if (list.error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  const rows = summary.data ?? [];
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let followUpsDue = 0;
  let newThisWeek = 0;
  let pipelineValue = 0;
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    bySource[r.source] = (bySource[r.source] ?? 0) + 1;
    if (r.next_follow_up_at && new Date(r.next_follow_up_at).getTime() <= now) followUpsDue++;
    if (new Date(r.created_at).getTime() >= weekAgo) newThisWeek++;
    if ((r.status === "lead" || r.status === "prospect") && r.estimated_value) pipelineValue += Number(r.estimated_value);
  }

  return NextResponse.json({
    contacts: list.data ?? [],
    total: list.count ?? 0,
    pageSize: PAGE_SIZE,
    stats: {
      all: rows.length,
      byStatus,
      bySource,
      followUpsDue,
      newThisWeek,
      pipelineValue,
      unsubscribed: rows.filter((r) => r.unsubscribed_at).length,
    },
  });
}

/** Inserimento manuale (telefonata in ingresso, contatto da evento, passaparola…). */
export async function POST(request: Request) {
  if (!(await requireSiteadmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const email = str(body.email, 200).toLowerCase();
  const name = str(body.name, 160);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { range, count } = parseEmployees(
    typeof body.employees === "number" || typeof body.employees === "string" ? body.employees : null,
  );
  const status = CRM_STATUSES.includes(body.status as CrmStatus) ? (body.status as CrmStatus) : "lead";
  const source = str(body.source, 40) || "manual";

  const { data, error } = await svc
    .from("pynkstudio_crm")
    .insert({
      name,
      email,
      phone: str(body.phone, 40),
      company: str(body.company, 160) || null,
      industry: str(body.industry, 120) || null,
      employees_range: range,
      employees_count: count,
      notes: str(body.notes, 4000) || null,
      interests: cleanList(body.interests),
      tags: cleanList(body.tags, 20, 40),
      status,
      source,
      last_activity_at: new Date().toISOString(),
    } satisfies Database["public"]["Tables"]["pynkstudio_crm"]["Insert"])
    .select("*")
    .single();

  if (error?.code === "23505") return NextResponse.json({ error: "email_exists" }, { status: 409 });
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });

  await addCrmActivity(svc, data.id, "system", "Contatto inserito a mano", undefined, "admin");
  return NextResponse.json({ contact: data }, { status: 201 });
}
