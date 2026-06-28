import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminProfile = {
  id: string;
  user_id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  work_hours: string | null;
  signature_role: string | null;
};

const PROFILE_FIELDS =
  "id, user_id, email, role, first_name, last_name, display_name, phone, work_hours, signature_role" as const;

async function loadCurrentProfile(): Promise<AdminProfile | { status: number; error: string }> {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 401, error: "Non autenticato." };

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("siteadmin")
    .select(PROFILE_FIELDS)
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (error) return { status: 500, error: error.message };
  if (!data) return { status: 403, error: "Non autorizzato." };
  return data as AdminProfile;
}

export async function GET() {
  const result = await loadCurrentProfile();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ profile: result });
}

export async function PUT(request: Request) {
  const result = await loadCurrentProfile();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let body: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    work_hours?: string;
    signature_role?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const firstName     = (body.first_name     ?? "").trim();
  const lastName      = (body.last_name      ?? "").trim();
  const phone         = (body.phone          ?? "").trim();
  const workHours     = (body.work_hours     ?? "").trim();
  const signatureRole = (body.signature_role ?? "").trim();

  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || null;

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("siteadmin")
    .update({
      first_name:     firstName     || null,
      last_name:      lastName      || null,
      phone:          phone         || null,
      work_hours:     workHours     || null,
      signature_role: signatureRole || null,
      display_name:   displayName,
    })
    .eq("id", result.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
