import { NextResponse } from "next/server";
import {
  hasAdminPermission,
  isSiteadminRole,
  type SiteadminRole,
} from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LeadCreateBody = {
  business_name?: string;
  business_vertical?: "food" | "services";
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string | null;
  source?: string | null;
  temperature?: "cold" | "warm" | "hot";
  notes?: string | null;
  location_name?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
};

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function requirePermission(permission: Parameters<typeof hasAdminPermission>[1]) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Non autenticato.", status: 401 as const, role: null };

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  const role = isSiteadminRole(siteadmin?.role) ? (siteadmin.role as SiteadminRole) : null;
  if (!hasAdminPermission(role, permission)) {
    return { error: "Non autorizzato.", status: 403 as const, role };
  }
  return { error: null, status: 200 as const, role };
}

export async function POST(request: Request) {
  const auth = await requirePermission("crm:create");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as LeadCreateBody | null;
  if (!body) return NextResponse.json({ error: "Body non valido." }, { status: 400 });

  const businessName = normalizeText(body.business_name);
  const contactName = normalizeText(body.contact_name);
  const contactEmail = normalizeText(body.contact_email)?.toLowerCase();
  if (!businessName || !contactName || !contactEmail) {
    return NextResponse.json(
      { error: "Attività, referente ed email sono obbligatori." },
      { status: 400 },
    );
  }

  const vertical = body.business_vertical === "services" ? "services" : "food";
  const address = normalizeText(body.address);
  const city = normalizeText(body.city);
  const province = normalizeText(body.province);
  const postalCode = normalizeText(body.postal_code);
  const businessSlug = `${slugify(businessName) || "lead"}-${Date.now().toString(36)}`;
  const admin = createSupabaseAdminClient();

  const { data: lead, error: leadError } = await admin
    .from("platform_leads")
    .insert({
      business_name: businessName,
      business_slug: businessSlug,
      business_vertical: vertical,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: normalizeText(body.contact_phone),
      source: normalizeText(body.source) ?? "manuale",
      status: "lead",
      stage: "new",
      temperature: body.temperature ?? "cold",
      notes: normalizeText(body.notes),
      address,
      city,
      province,
      postal_code: postalCode,
      country: "IT",
    } as never)
    .select("id")
    .single();

  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 });

  const { error: locationError } = await admin
    .from("platform_lead_locations" as never)
    .insert({
      lead_id: lead.id,
      name: normalizeText(body.location_name) ?? "Sede principale",
      address,
      city,
      province,
      postal_code: postalCode,
      country: "IT",
      is_primary: true,
    } as never);

  if (locationError) {
    return NextResponse.json({ error: locationError.message }, { status: 500 });
  }

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
