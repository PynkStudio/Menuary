import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { addCrmActivity } from "@/lib/pynkstudio/crm";

export const dynamic = "force-dynamic";

const TENANT_ID = "pynkstudio";

// Solo siteadmin abilitati possono leggere/gestire l'agenda.
async function requireSiteadmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("id")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return siteadmin?.id ? user : null;
}

export async function GET(request: Request) {
  if (!(await requireSiteadmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "missing_range" }, { status: 400 });

  const { data, error } = await svc
    .from("consultation_bookings")
    .select("id, name, email, phone, topic, starts_at, ends_at, status, created_at")
    .eq("tenant_id", TENANT_ID)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ bookings: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!(await requireSiteadmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.id || body.status !== "cancelled") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { data: cancelled, error } = await svc
    .from("consultation_bookings")
    .update({ status: "cancelled" })
    .eq("id", body.id)
    .eq("tenant_id", TENANT_ID)
    .eq("status", "confirmed")
    .select("email, topic, starts_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  // Tiene allineato il CRM: conteggio call e timeline (best-effort).
  if (cancelled) {
    try {
      const { data: contact } = await svc
        .from("pynkstudio_crm")
        .select("id, bookings_count")
        .eq("email", cancelled.email.trim().toLowerCase())
        .maybeSingle();
      if (contact) {
        await svc
          .from("pynkstudio_crm")
          .update({ bookings_count: Math.max(0, contact.bookings_count - 1), last_activity_at: new Date().toISOString() })
          .eq("id", contact.id);
        await addCrmActivity(svc, contact.id, "booking", "Call annullata", cancelled.topic, "admin", {
          booking_id: body.id,
          starts_at: cancelled.starts_at,
        });
      }
    } catch (e) {
      console.warn("[bookings] crm annullamento fallito:", e);
    }
  }
  return NextResponse.json({ ok: true });
}
