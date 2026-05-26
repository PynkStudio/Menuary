import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole, type SiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_MARKET, normalizeMarketCode } from "@/lib/markets";

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeNullableText(value: unknown): string | null {
  return typeof value === "string" ? normalizeText(value) : null;
}

async function requireCrmPermission(permission: Parameters<typeof hasAdminPermission>[1]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { error: "Non autenticato.", status: 401 as const };

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  const role = isSiteadminRole(siteadmin?.role) ? (siteadmin!.role as SiteadminRole) : null;
  if (!hasAdminPermission(role, permission)) {
    return { error: "Non autorizzato.", status: 403 as const };
  }
  return { error: null, status: 200 as const };
}

// PATCH /api/admin/leads/[id]
// Aggiorna campi del lead CRM e, se richiesto, la sede primaria.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCrmPermission("crm:view");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID lead mancante." }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body non valido." }, { status: 400 });

  const update: Record<string, unknown> = {};

  if ("sales_owner_id" in body) update.sales_owner_id = body.sales_owner_id ?? null;
  if ("sales_owner_name" in body) update.sales_owner_name = body.sales_owner_name ?? null;
  if ("business_name" in body) {
    const businessName = normalizeText(body.business_name);
    if (!businessName) {
      return NextResponse.json({ error: "Il nome dell'attività è obbligatorio." }, { status: 400 });
    }
    update.business_name = businessName;
  }
  if ("contact_name" in body) update.contact_name = normalizeNullableText(body.contact_name);
  if ("contact_first_name" in body) update.contact_first_name = normalizeNullableText(body.contact_first_name);
  if ("contact_last_name" in body) update.contact_last_name = normalizeNullableText(body.contact_last_name);
  if ("contact_email" in body) update.contact_email = normalizeNullableText(body.contact_email)?.toLowerCase();
  if ("contact_phone" in body) update.contact_phone = normalizeNullableText(body.contact_phone);
  if ("address" in body) update.address = normalizeNullableText(body.address);
  if ("city" in body) update.city = normalizeNullableText(body.city);
  if ("province" in body) update.province = normalizeNullableText(body.province);
  if ("postal_code" in body) update.postal_code = normalizeNullableText(body.postal_code);
  if ("country" in body) update.country = normalizeMarketCode(body.country) ?? DEFAULT_MARKET;
  if ("temperature" in body && ["cold", "warm", "hot"].includes(body.temperature as string)) {
    update.temperature = body.temperature;
  }
  if (
    "stage" in body &&
    ["new", "contacted", "qualified", "demo", "proposal", "contract", "tenant", "lost"].includes(
      body.stage as string,
    )
  ) {
    update.stage = body.stage;
  }
  if (
    "status" in body &&
    ["lead", "prospect", "active", "churned"].includes(body.status as string)
  ) {
    update.status = body.status;
  }
  if ("notes" in body) update.notes = body.notes ?? null;

  const primaryLocation = body.primary_location as Record<string, unknown> | undefined;
  const hasPrimaryLocation = primaryLocation && typeof primaryLocation === "object";

  if (Object.keys(update).length === 0 && !hasPrimaryLocation) {
    return NextResponse.json({ error: "Nessun campo aggiornabile nel body." }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const admin = createSupabaseAdminClient();
  if (Object.keys(update).length > 1) {
    const { error } = await admin
      .from("platform_leads")
      .update(update as never)
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (hasPrimaryLocation) {
    const street = normalizeNullableText(primaryLocation.street);
    const streetNumber = normalizeNullableText(primaryLocation.street_number);
    const address = [street, streetNumber].filter(Boolean).join(" ") || normalizeNullableText(primaryLocation.address);
    const city = normalizeNullableText(primaryLocation.city);
    const province = normalizeNullableText(primaryLocation.province);
    const postalCode = normalizeNullableText(primaryLocation.postal_code);
    const country = normalizeMarketCode(primaryLocation.country) ?? (update.country as string | undefined) ?? DEFAULT_MARKET;

    const { data: existing, error: existingError } = await admin
      .from("platform_lead_locations" as never)
      .select("id")
      .eq("lead_id", id)
      .eq("is_primary", true)
      .maybeSingle();

    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

    if (existing) {
      const { error } = await admin
        .from("platform_lead_locations" as never)
        .update({
          street,
          street_number: streetNumber,
          address,
          city,
          province,
          postal_code: postalCode,
          country,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", (existing as { id: string }).id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await admin
        .from("platform_lead_locations" as never)
        .insert({
          lead_id: id,
          name: "Sede principale",
          street,
          street_number: streetNumber,
          address,
          city,
          province,
          postal_code: postalCode,
          country,
          is_primary: true,
        } as never);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
