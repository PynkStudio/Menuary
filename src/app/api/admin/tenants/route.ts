import { NextResponse, type NextRequest } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { upsertTenantDemoControl } from "@/lib/demo-controls";
import { upsertTenantSupportAdminContact } from "@/lib/tenant-support/admin-contacts";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

async function requireSiteAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(sa?.role) && hasAdminPermission(sa.role, "tenant:manage") ? user : null;
}

/**
 * POST /api/admin/tenants
 * Crea un nuovo tenant + la prima sede in transazione (via RPC).
 * Body:
 *   { tenantId, name, label, vertical, status?, domains?, previewSlug?,
 *     theme, features, address, locationName?, city?, phone?, email?,
 *     ownerPhone?, ownerName? }
 *
 * Invariante: un tenant nasce sempre con almeno una sede.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!await requireSiteAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        tenantId?: string;
        name?: string;
        label?: string;
        vertical?: "food" | "services";
        status?: string;
        domains?: string[];
        previewSlug?: string;
        theme?: Record<string, unknown>;
        features?: Record<string, unknown>;
        address?: string;
        locationName?: string;
        city?: string | null;
        phone?: string | null;
        email?: string | null;
        ownerPhone?: string | null;
        ownerName?: string | null;
      }
    | null;

  if (!body) return NextResponse.json({ error: "Body mancante" }, { status: 400 });

  const {
    tenantId, name, label, vertical, status, domains, previewSlug,
    theme, features, address, locationName, city, phone, email, ownerPhone, ownerName,
  } = body;

  // Validazione minima
  if (!tenantId || !SLUG_RE.test(tenantId)) {
    return NextResponse.json({ error: "tenantId non valido (slug richiesto)." }, { status: 400 });
  }
  if (!name || !label) {
    return NextResponse.json({ error: "name e label sono obbligatori." }, { status: 400 });
  }
  if (!vertical || (vertical !== "food" && vertical !== "services")) {
    return NextResponse.json({ error: "vertical deve essere 'food' o 'services'." }, { status: 400 });
  }
  if (!address || !address.trim()) {
    return NextResponse.json(
      { error: "Indirizzo obbligatorio: ogni tenant nasce con una sede." },
      { status: 400 },
    );
  }
  if (!theme || !features) {
    return NextResponse.json({ error: "theme e features sono obbligatori." }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "DB non disponibile" }, { status: 500 });

  // Check tenantId disponibile
  const { data: existing } = await db
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `Tenant "${tenantId}" già esistente.` }, { status: 409 });
  }

  // RPC tipata in migrazione 20260526; cast finché supabase gen types non
  // viene rilanciato e tipi rigenerati.
  const { data, error } = await (db.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: { tenant_id: string; location_id: string }[] | null; error: { message: string } | null }>)("create_tenant_with_location", {
    p_tenant_id:      tenantId,
    p_name:           name,
    p_label:          label,
    p_vertical:       vertical,
    p_status:         status ?? "trial",
    p_domains:        domains ?? [],
    p_preview_slug:   previewSlug ?? tenantId,
    p_theme:          theme,
    p_features:       features,
    p_location_slug:  "principale",
    p_location_name:  locationName ?? "Sede principale",
    p_address:        address.trim(),
    p_city:           city ?? null,
    p_phone:          phone ?? null,
    p_email:          email ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const row = Array.isArray(data) ? data[0] : data;
  let demoControlError: string | null = null;
  try {
    await upsertTenantDemoControl({
      tenantId,
      previewSlug: previewSlug ?? tenantId,
      vertical,
    });
  } catch (controlErr) {
    demoControlError = controlErr instanceof Error ? controlErr.message : "tenant_demo_control_failed";
  }

  let supportContactError: string | null = null;
  try {
    await upsertTenantSupportAdminContact({
      tenantId,
      phone: ownerPhone,
      displayName: ownerName ?? label,
      permissions: { source: "admin_tenant_create" },
    });
  } catch (contactErr) {
    supportContactError = contactErr instanceof Error ? contactErr.message : "tenant_support_contact_failed";
  }

  return NextResponse.json({
    ok: true,
    tenantId: row?.tenant_id ?? tenantId,
    locationId: row?.location_id ?? null,
    demoControlError,
    supportContactError,
  });
}
