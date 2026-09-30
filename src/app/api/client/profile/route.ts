import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DIETARY = new Set(["vegetariano", "vegano", "senza glutine", "senza lattosio", "halal", "kosher"]);

type Body = {
  firstName?: unknown;
  lastName?: unknown;
  birthDate?: unknown;
  allergiesNote?: unknown;
  dietaryPreferences?: unknown;
};

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PUT(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const firstName = cleanText(body.firstName, 80);
  const lastName = cleanText(body.lastName, 80);
  const allergiesNote = cleanText(body.allergiesNote, 500);
  const birthDate = cleanText(body.birthDate, 10);
  if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: "invalid_birth_date" }, { status: 400 });
  }
  const dietaryPreferences = Array.isArray(body.dietaryPreferences)
    ? [...new Set(body.dietaryPreferences.filter((value): value is string => typeof value === "string" && DIETARY.has(value)))]
    : [];
  const dietNotes = [
    allergiesNote ? `Allergie/intolleranze: ${allergiesNote}` : "",
    dietaryPreferences.length ? `Preferenze: ${dietaryPreferences.join(", ")}` : "",
  ].filter(Boolean).join("\n") || null;

  const { error: profileError } = await supabase.from("user_profiles").upsert({
    user_id: user.id,
    birth_date: birthDate || null,
    diet_notes: dietNotes,
    is_vegetarian: dietaryPreferences.includes("vegetariano") || dietaryPreferences.includes("vegano"),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (profileError) return NextResponse.json({ error: "profile_save_failed" }, { status: 500 });

  const { error: authError } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim() },
  });
  if (authError) return NextResponse.json({ error: "identity_save_failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
