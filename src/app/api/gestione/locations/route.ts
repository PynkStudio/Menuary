import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Slug validation: lowercase letters, numbers, hyphens. No reserved platform subdomains.
const RESERVED_SLUGS = new Set([
  "www", "app", "api", "mail", "smtp", "ftp", "admin",
  "demo", "gestione", "clienti", "login", "studio", "support",
]);
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;

function validateSlug(slug: string): string | null {
  if (!SLUG_RE.test(slug)) return "Slug non valido: usa solo lettere minuscole, numeri e trattini.";
  if (RESERVED_SLUGS.has(slug)) return `"${slug}" è riservato dalla piattaforma.`;
  return null;
}

/** GET /api/gestione/locations?tenantId=xxx — lista sedi del tenant */
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("id")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  if (!siteadmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("is_default", { ascending: false })
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** POST /api/gestione/locations — crea una nuova sede */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { tenantId, name, slug, address, city, phone, email, routingMode } = body as {
    tenantId: string;
    name: string;
    slug: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    routingMode?: string;
  };

  if (!tenantId || !name || !slug) {
    return NextResponse.json({ error: "tenantId, name e slug sono obbligatori" }, { status: 400 });
  }

  const slugError = validateSlug(slug);
  if (slugError) return NextResponse.json({ error: slugError }, { status: 422 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("id")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  if (!siteadmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Unicità slug per tenant
  const { count } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("slug", slug);
  if (count && count > 0) {
    return NextResponse.json({ error: `Lo slug "${slug}" è già usato da un'altra sede.` }, { status: 409 });
  }

  // Prima sede → is_default = true automaticamente
  const { count: existing } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  const isDefault = !existing || existing === 0;

  // Controlla il limite max_locations dal site_config del tenant
  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("site_config")
    .eq("id", tenantId)
    .maybeSingle();
  const config = (tenantRow?.site_config as Record<string, unknown> | null) ?? {};
  const maxLocations = typeof config.max_locations === "number" ? config.max_locations : 1;
  if ((existing ?? 0) >= maxLocations) {
    return NextResponse.json(
      { error: `Limite sedi raggiunto (${maxLocations}). Contatta il supporto per aumentarlo.` },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from("locations")
    .insert({
      tenant_id: tenantId,
      name,
      slug,
      address: address ?? null,
      city: city ?? null,
      phone: phone ?? null,
      email: email ?? null,
      routing_mode: routingMode ?? "both",
      is_default: isDefault,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
