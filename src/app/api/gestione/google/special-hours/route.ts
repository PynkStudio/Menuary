import { NextResponse } from "next/server";
import { getSpecialHours, upsertSpecialHour, deleteSpecialHour } from "@/lib/data/special-hours";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");
  const locationId = url.searchParams.get("locationId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getSpecialHours(tenantId, locationId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId, locationId, date, closed, slots, label } = (await request.json()) as {
    tenantId: string;
    locationId?: string | null;
    date: string;
    closed: boolean;
    slots: string[];
    label?: string;
  };

  await upsertSpecialHour(tenantId, {
    date,
    closed,
    slots,
    label: label ?? null,
    location_id: locationId ?? null,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId, id } = (await request.json()) as { tenantId: string; id: string };
  await deleteSpecialHour(tenantId, id);
  return NextResponse.json({ ok: true });
}
