import { NextResponse } from "next/server";
import {
  hasAdminPermission,
  isSiteadminRole,
  type SiteadminRole,
} from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_MARKET, normalizeMarketCode } from "@/lib/markets";

type LocationInput = {
  name?: string | null;
  street?: string | null;
  street_number?: string | null;
  city?: string | null;
  country?: string | null;
  is_primary?: boolean;
};

type LeadCreateBody = {
  // Required
  business_name?: string;
  // Vertical & type
  business_vertical?: "food" | "services";
  business_type?: string | null;
  // Contacts (all optional)
  contact_name?: string | null;
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  // Meta
  source?: string | null;
  temperature?: "cold" | "warm" | "hot";
  notes?: string | null;
  // Digital presence
  has_website?: boolean | null;
  website_url?: string | null;
  website_score_beauty?: number | null;
  website_score_functionality?: number | null;
  website_score_clarity?: number | null;
  website_score_updated?: number | null;
  has_google_maps?: boolean | null;
  maps_ownership_claimed?: boolean | null;
  maps_profile_complete?: boolean | null;
  // Scores (computed client-side, stored as-is)
  matching_score?: number | null;
  priority_score?: number | null;
  // Multi-sede (new wizard)
  locations?: LocationInput[];
  // Legacy single-location fields (old form backward compat)
  location_name?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value;
}

function normalizeBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function requirePermission(permission: Parameters<typeof hasAdminPermission>[1]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Non autenticato.", status: 401 as const };

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  const role = isSiteadminRole(siteadmin?.role) ? (siteadmin.role as SiteadminRole) : null;
  if (!hasAdminPermission(role, permission)) {
    return { error: "Non autorizzato.", status: 403 as const };
  }
  return { error: null, status: 200 as const };
}

export async function POST(request: Request) {
  const auth = await requirePermission("crm:create");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as LeadCreateBody | null;
  if (!body) return NextResponse.json({ error: "Body non valido." }, { status: 400 });

  const businessName = normalizeText(body.business_name);
  if (!businessName) {
    return NextResponse.json({ error: "Il nome dell'attività è obbligatorio." }, { status: 400 });
  }

  const vertical = body.business_vertical === "services" ? "services" : "food";
  const businessSlug = `${slugify(businessName) || "lead"}-${Date.now().toString(36)}`;

  // Resolve contact_name from explicit field or first+last name
  const composedName =
    [normalizeText(body.contact_first_name), normalizeText(body.contact_last_name)]
      .filter(Boolean)
      .join(" ") || null;
  const contactName = normalizeText(body.contact_name) ?? composedName;

  // Build locations list — prefer new multi-sede format, fall back to legacy single fields
  const locationsInput: LocationInput[] =
    Array.isArray(body.locations) && body.locations.length > 0
      ? body.locations
      : [
          {
            name: normalizeText(body.location_name) ?? "Sede principale",
            street: null,
            street_number: null,
            city: normalizeText(body.city),
            country: "IT",
            is_primary: true,
          },
        ];

  // Derive legacy address fields for platform_leads from primary location
  const firstLoc = locationsInput[0];
  const firstStreet = normalizeText(firstLoc?.street);
  const firstStreetNum = normalizeText(firstLoc?.street_number);
  const legacyAddress =
    [firstStreet, firstStreetNum].filter(Boolean).join(" ") || normalizeText(body.address);
  const legacyCity = normalizeText(firstLoc?.city) ?? normalizeText(body.city);
  const legacyCountry = normalizeMarketCode(firstLoc?.country ?? body.country) ?? DEFAULT_MARKET;

  const admin = createSupabaseAdminClient();

  const { data: lead, error: leadError } = await admin
    .from("platform_leads")
    .insert({
      business_name: businessName,
      business_slug: businessSlug,
      business_vertical: vertical,
      business_type: normalizeText(body.business_type),
      contact_name: contactName,
      contact_first_name: normalizeText(body.contact_first_name),
      contact_last_name: normalizeText(body.contact_last_name),
      contact_email: normalizeText(body.contact_email)?.toLowerCase() ?? null,
      contact_phone: normalizeText(body.contact_phone),
      source: normalizeText(body.source) ?? "manuale",
      status: "lead",
      stage: "new",
      temperature: body.temperature ?? "cold",
      notes: normalizeText(body.notes),
      // Digital presence
      has_website: normalizeBool(body.has_website),
      website_url: normalizeText(body.website_url),
      website_score_beauty: normalizeInt(body.website_score_beauty),
      website_score_functionality: normalizeInt(body.website_score_functionality),
      website_score_clarity: normalizeInt(body.website_score_clarity),
      website_score_updated: normalizeInt(body.website_score_updated),
      has_google_maps: normalizeBool(body.has_google_maps),
      maps_ownership_claimed: normalizeBool(body.maps_ownership_claimed),
      maps_profile_complete: normalizeBool(body.maps_profile_complete),
      // Scores
      matching_score: normalizeInt(body.matching_score),
      priority_score: normalizeInt(body.priority_score),
      // Legacy single-address fields (derived from first location)
      address: legacyAddress,
      city: legacyCity,
      province: normalizeText(body.province),
      postal_code: normalizeText(body.postal_code),
      country: legacyCountry,
    } as never)
    .select("id")
    .single();

  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 });

  // Insert all locations
  const locationRows = locationsInput.map((loc, idx) => {
    const street = normalizeText(loc.street);
    const streetNum = normalizeText(loc.street_number);
    const city = normalizeText(loc.city);
    const address = [street, streetNum].filter(Boolean).join(" ") || null;
    const country = normalizeMarketCode(loc.country) ?? legacyCountry;
    return {
      lead_id: lead.id,
      name: normalizeText(loc.name) ?? (idx === 0 ? "Sede principale" : `Sede ${idx + 1}`),
      street,
      street_number: streetNum,
      address,
      city,
      country,
      is_primary: loc.is_primary ?? idx === 0,
    } as never;
  });

  const { error: locationError } = await admin
    .from("platform_lead_locations" as never)
    .insert(locationRows);

  if (locationError) return NextResponse.json({ error: locationError.message }, { status: 500 });

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
