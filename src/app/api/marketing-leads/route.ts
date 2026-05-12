import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type LeadRequest = {
  name?: string;
  restaurantName?: string;
  email?: string;
  phone?: string;
  city?: string;
  interest?: string;
  message?: string;
  website?: string;
};

function clean(value: unknown, max = 320): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LeadRequest;
  const name = clean(body.name, 120);
  const restaurantName = clean(body.restaurantName, 160);
  const email = clean(body.email, 180).toLowerCase();
  const phone = clean(body.phone, 60);
  const city = clean(body.city, 120);
  const interest = clean(body.interest, 120);
  const message = clean(body.message, 1600);
  const website = clean(body.website, 160);

  if (website) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !restaurantName || !email) {
    return NextResponse.json(
      { ok: false, error: "Compila nome, ristorante ed email." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("marketing_leads").insert({
    name,
    restaurant_name: restaurantName,
    email,
    phone: phone || null,
    city: city || null,
    interest: interest || "demo",
    message: message || null,
    source: "menuary-marketing-site",
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Invio non riuscito. Riprova tra poco." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
