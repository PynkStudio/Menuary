import { NextResponse } from "next/server";
import {
  hasAdminPermission,
  isSiteadminRole,
  type SiteadminRole,
} from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_MARKET, normalizeMarketCode } from "@/lib/markets";
import type {
  LeadSource,
  LeadStage,
  LeadStatus,
  LeadTemperature,
  PlatformLead,
} from "@/lib/platform-crm-types";

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
  business_vertical?: "food" | "services" | "creative";
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

type PlatformLeadRow = {
  id: string;
  business_name: string;
  business_slug: string | null;
  business_vertical: string | null;
  business_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  billing_name: string | null;
  billing_vat: string | null;
  billing_cf: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_province: string | null;
  billing_postal_code: string | null;
  billing_sdi: string | null;
  billing_pec: string | null;
  status: string | null;
  stage: string | null;
  temperature: string | null;
  source: string | null;
  notes: string | null;
  requested_services: string[] | null;
  pain_points: string[] | null;
  whatsapp_qualification: Record<string, unknown> | null;
  whatsapp_inferred_vertical: string | null;
  whatsapp_vertical_confidence: number | null;
  last_whatsapp_at: string | null;
  demo_url: string | null;
  demo_pr_url: string | null;
  official_domain: string | null;
  official_domain_active: boolean | null;
  proposed_package_slug: string | null;
  proposed_addons: string[] | null;
  proposed_extra_modules: string[] | null;
  proposed_billing_cycle: string | null;
  proposed_setup_amount: number | null;
  proposed_recurring_amount: number | null;
  proposal_updated_at: string | null;
  tenant_id: string | null;
  converted_at: string | null;
  sales_owner_id: string | null;
  sales_owner_name: string | null;
  attention_kind: string | null;
  attention_for_user_id: string | null;
  attention_updated_at: string | null;
  created_by_id: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
};

type PlatformLeadLocationRow = {
  id: string;
  lead_id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  is_primary: boolean | null;
};

function normalizeLeadStatus(value: string | null): LeadStatus {
  return value === "prospect" || value === "active" || value === "churned" ? value : "lead";
}

function normalizeLeadStage(value: string | null): LeadStage {
  return value === "contacted" ||
    value === "qualified" ||
    value === "demo" ||
    value === "proposal" ||
    value === "contract" ||
    value === "tenant" ||
    value === "lost"
    ? value
    : "new";
}

function normalizeLeadTemperature(value: string | null): LeadTemperature {
  return value === "warm" || value === "hot" ? value : "cold";
}

function normalizeLeadSource(value: string | null): LeadSource | null {
  return value === "form_web" ||
    value === "referral" ||
    value === "diretto" ||
    value === "evento" ||
    value === "manuale" ||
    value === "altro"
    ? value
    : null;
}

function mapLead(row: PlatformLeadRow, locations: PlatformLeadLocationRow[]): PlatformLead {
  return {
    id: row.id,
    business_name: row.business_name,
    business_slug: row.business_slug,
    business_vertical:
      row.business_vertical === "creative"
        ? "creative"
        : row.business_vertical === "services"
          ? "services"
          : "food",
    business_type: row.business_type,
    contact_name: row.contact_name,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    address: row.address,
    city: row.city,
    province: row.province,
    postal_code: row.postal_code,
    country: row.country ?? DEFAULT_MARKET,
    billing_name: row.billing_name,
    billing_vat: row.billing_vat,
    billing_cf: row.billing_cf,
    billing_address: row.billing_address,
    billing_city: row.billing_city,
    billing_province: row.billing_province,
    billing_postal_code: row.billing_postal_code,
    billing_sdi: row.billing_sdi,
    billing_pec: row.billing_pec,
    status: normalizeLeadStatus(row.status),
    stage: normalizeLeadStage(row.stage),
    temperature: normalizeLeadTemperature(row.temperature),
    source: normalizeLeadSource(row.source),
    notes: row.notes,
    requested_services: row.requested_services ?? [],
    pain_points: row.pain_points ?? [],
    whatsapp_qualification: row.whatsapp_qualification ?? {},
    whatsapp_inferred_vertical:
      row.whatsapp_inferred_vertical === "food" ||
      row.whatsapp_inferred_vertical === "services" ||
      row.whatsapp_inferred_vertical === "creative" ||
      row.whatsapp_inferred_vertical === "other"
        ? row.whatsapp_inferred_vertical
        : "unknown",
    whatsapp_vertical_confidence: row.whatsapp_vertical_confidence ?? 0,
    last_whatsapp_at: row.last_whatsapp_at,
    locations: locations.map((loc) => ({
      id: loc.id,
      name: loc.name ?? "Sede",
      address: loc.address,
      city: loc.city,
      province: loc.province,
      postal_code: loc.postal_code,
      country: loc.country ?? row.country ?? DEFAULT_MARKET,
      is_primary: loc.is_primary ?? false,
    })),
    demo_url: row.demo_url,
    demo_pr_url: row.demo_pr_url,
    official_domain: row.official_domain,
    official_domain_active: row.official_domain_active ?? false,
    proposed_package_slug: row.proposed_package_slug,
    proposed_addons: row.proposed_addons ?? [],
    proposed_extra_modules: (row.proposed_extra_modules ?? []) as PlatformLead["proposed_extra_modules"],
    proposed_billing_cycle:
      row.proposed_billing_cycle === "yearly" || row.proposed_billing_cycle === "monthly"
        ? row.proposed_billing_cycle
        : null,
    proposed_setup_amount: row.proposed_setup_amount,
    proposed_recurring_amount: row.proposed_recurring_amount,
    proposal_updated_at: row.proposal_updated_at,
    tenant_id: row.tenant_id,
    converted_at: row.converted_at,
    sales_owner_id: row.sales_owner_id,
    sales_owner_name: row.sales_owner_name,
    attention_kind:
      row.attention_kind === "new" || row.attention_kind === "updated"
        ? row.attention_kind
        : null,
    attention_for_user_id: row.attention_for_user_id,
    attention_updated_at: row.attention_updated_at,
    created_by_id: row.created_by_id,
    created_by_name: row.created_by_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
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
    .select("role,display_name")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  const role = isSiteadminRole(siteadmin?.role) ? (siteadmin.role as SiteadminRole) : null;
  if (!hasAdminPermission(role, permission)) {
    return { error: "Non autorizzato.", status: 403 as const };
  }
  return {
    error: null,
    status: 200 as const,
    user: { id: user.id, email: user.email ?? null },
    siteadmin: {
      role,
      name: (siteadmin as { display_name?: string | null } | null)?.display_name ?? user.email ?? null,
    },
  };
}

export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope");
  const auth = await requirePermission(
    scope === "contracts" ? "subscriptions:view" : "crm:view",
  );
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createSupabaseAdminClient();
  const { data: leadRows, error: leadsError } = await admin
    .from("platform_leads")
    .select("*")
    .order("updated_at", { ascending: false });

  if (leadsError) return NextResponse.json({ error: leadsError.message }, { status: 500 });

  const leadIds = ((leadRows ?? []) as unknown as PlatformLeadRow[]).map((lead) => lead.id);
  const { data: locationRows, error: locationsError } = leadIds.length
    ? await admin
        .from("platform_lead_locations" as never)
        .select("*")
        .in("lead_id", leadIds)
        .order("is_primary", { ascending: false })
    : { data: [], error: null };

  if (locationsError) {
    return NextResponse.json({ error: locationsError.message }, { status: 500 });
  }

  const locationsByLead = ((locationRows ?? []) as unknown as PlatformLeadLocationRow[]).reduce(
    (acc, location) => {
      acc.set(location.lead_id, [...(acc.get(location.lead_id) ?? []), location]);
      return acc;
    },
    new Map<string, PlatformLeadLocationRow[]>(),
  );

  const leads = ((leadRows ?? []) as unknown as PlatformLeadRow[]).map((lead) =>
    mapLead(lead, locationsByLead.get(lead.id) ?? []),
  );

  return NextResponse.json({ leads });
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

  const vertical =
    body.business_vertical === "creative"
      ? "creative"
      : body.business_vertical === "services"
        ? "services"
        : "food";
  const businessSlug = `${slugify(businessName) || "lead"}-${Date.now().toString(36)}`;

  // Resolve contact_name from explicit field or first+last name
  const composedName =
    [normalizeText(body.contact_first_name), normalizeText(body.contact_last_name)]
      .filter(Boolean)
      .join(" ") || null;
  const contactName = normalizeText(body.contact_name) ?? composedName;

  // Orpheo represents people/creative identities, not physical venues.
  const locationsInput: LocationInput[] =
    vertical === "creative"
      ? []
      : Array.isArray(body.locations) && body.locations.length > 0
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
  const legacyAddress = vertical === "creative"
    ? null
    : [firstStreet, firstStreetNum].filter(Boolean).join(" ") || normalizeText(body.address);
  const legacyCity = vertical === "creative"
    ? null
    : normalizeText(firstLoc?.city) ?? normalizeText(body.city);
  const legacyCountry = normalizeMarketCode(firstLoc?.country ?? body.country) ?? DEFAULT_MARKET;
  const autoAssignToCreator =
    auth.siteadmin?.role === "admin" || auth.siteadmin?.role === "venditore";

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
      province: vertical === "creative" ? null : normalizeText(body.province),
      postal_code: vertical === "creative" ? null : normalizeText(body.postal_code),
      country: legacyCountry,
      sales_owner_id: autoAssignToCreator ? auth.user?.id ?? null : null,
      sales_owner_name: autoAssignToCreator ? auth.siteadmin?.name ?? null : null,
      created_by_id: auth.user?.id ?? null,
      created_by_name: auth.siteadmin?.name ?? null,
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

  if (locationRows.length > 0) {
    const { error: locationError } = await admin
      .from("platform_lead_locations" as never)
      .insert(locationRows);

    if (locationError) return NextResponse.json({ error: locationError.message }, { status: 500 });
  }

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
