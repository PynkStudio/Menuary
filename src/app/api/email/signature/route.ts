import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSignature, upsertSignature, buildSignatureHtml } from "@/lib/email/signature-queries";
import type { InboundEmailBrand } from "@/lib/email/inbound-types";

/** GET /api/email/signature?brand=menuary|bizery */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  await requireComposePermission(user.id);

  const brand = (new URL(request.url).searchParams.get("brand") ?? "menuary") as InboundEmailBrand;
  const sig = await getSignature(user.id, brand);
  return NextResponse.json({ signature: sig });
}

/** PUT /api/email/signature */
export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  await requireComposePermission(user.id);

  const body = (await request.json()) as {
    brand: InboundEmailBrand;
    name: string;
    title: string;
    phone: string;
    email: string;
    website: string;
  };

  const html = buildSignatureHtml(body);

  await upsertSignature({
    user_id: user.id,
    brand: body.brand,
    name: body.name ?? "",
    title: body.title ?? "",
    phone: body.phone ?? "",
    email: body.email ?? "",
    website: body.website ?? "",
    html,
  });

  return NextResponse.json({ ok: true, html });
}

// ─── Helper autorizzazione ────────────────────────────────────────────────────

const COMPOSE_ROLES = new Set(["superadmin", "admin", "amministrazione", "venditore"]);

async function requireComposePermission(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("siteadmin")
    .select("role")
    .eq("user_id", userId)
    .eq("enabled", true)
    .maybeSingle();

  if (!data || !COMPOSE_ROLES.has(data.role as string)) {
    throw new Error("Non autorizzato.");
  }
}
