import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

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

export async function GET(request: Request) {
  if (!(await requireSiteadmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status") ?? "";
  const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10));
  const limit = 50;

  let query = svc
    .from("pynkstudio_crm")
    .select("*", { count: "exact" })
    .order("last_booking_at", { ascending: false, nullsFirst: false })
    .range(page * limit, page * limit + limit - 1);

  if (status && status !== "all") query = query.eq("status", status);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ contacts: data ?? [], total: count ?? 0 });
}
