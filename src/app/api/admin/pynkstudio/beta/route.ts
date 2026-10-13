import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireSiteadmin } from "@/lib/pynkstudio/crm-admin";
import { parseBetaInput, slugify } from "./beta-input";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

/** Tutto il beta manager in una chiamata: i volumi sono piccoli (centinaia di righe). */
export async function GET() {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  const [betas, testers, requests, notifications, feedback] = await Promise.all([
    svc.from("pynkstudio_betas").select("*").order("created_at", { ascending: false }).limit(500),
    svc
      .from("pynkstudio_beta_testers")
      .select("id, first_name, last_name, email, phone, devices, apple_id_email, google_account_email, email_verified_at, notify_enabled, notify_categories, notify_languages, notify_kinds, last_seen_at, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    svc.from("pynkstudio_beta_requests").select("*").order("created_at", { ascending: false }).limit(5000),
    svc.from("pynkstudio_beta_notifications").select("beta_id").limit(20000),
    svc.from("pynkstudio_beta_feedback").select("*").order("created_at", { ascending: false }).limit(2000),
  ]);
  if (betas.error || testers.error || requests.error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  const notifiedByBeta: Record<string, number> = {};
  for (const n of notifications.data ?? []) notifiedByBeta[n.beta_id] = (notifiedByBeta[n.beta_id] ?? 0) + 1;

  return NextResponse.json({
    betas: betas.data,
    testers: testers.data,
    requests: requests.data,
    notifiedByBeta,
    feedback: feedback.data ?? [],
  });
}

export async function POST(request: Request) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const input = parseBetaInput(body);
  if (!input.name) return NextResponse.json({ error: "name_required" }, { status: 400 });
  const slug = (input.slug as string | undefined) || slugify(input.name as string);
  if (!slug) return NextResponse.json({ error: "invalid_slug" }, { status: 400 });

  const status = (input.status as string | undefined) ?? "draft";
  const { data, error } = await svc
    .from("pynkstudio_betas")
    .insert({
      ...(input as Partial<Database["public"]["Tables"]["pynkstudio_betas"]["Insert"]>),
      name: input.name as string,
      slug,
      status,
      published_at: status === "draft" ? null : new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error?.code === "23505") return NextResponse.json({ error: "slug_exists" }, { status: 409 });
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ beta: data }, { status: 201 });
}
