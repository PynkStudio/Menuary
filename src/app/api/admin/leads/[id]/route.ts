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
    .select("id,role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  const role = isSiteadminRole(siteadmin?.role) ? (siteadmin!.role as SiteadminRole) : null;
  if (!hasAdminPermission(role, permission)) {
    return { error: "Non autorizzato.", status: 403 as const };
  }
  return {
    error: null,
    status: 200 as const,
    user: { id: user.id },
    siteadmin: { id: siteadmin!.id, role },
  };
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

  const admin = createSupabaseAdminClient();
  const { data: currentLead, error: currentLeadError } = await admin
    .from("platform_leads")
    .select("business_vertical, sales_owner_id")
    .eq("id", id)
    .maybeSingle();
  if (currentLeadError) return NextResponse.json({ error: currentLeadError.message }, { status: 500 });
  if (!currentLead) return NextResponse.json({ error: "Lead non trovato." }, { status: 404 });
  const usesLocations = currentLead.business_vertical !== "creative";

  const update: Record<string, unknown> = {};

  if ("sales_owner_id" in body) {
    const ownerId = normalizeNullableText(body.sales_owner_id);
    if (!ownerId) {
      return NextResponse.json(
        { error: "Ogni lead deve essere assegnato a un responsabile operativo." },
        { status: 400 },
      );
    }
    const { data: owner, error: ownerError } = await admin
      .from("siteadmin")
      .select("user_id, display_name, email, role")
      .eq("user_id", ownerId)
      .eq("enabled", true)
      .maybeSingle();
    if (ownerError) return NextResponse.json({ error: ownerError.message }, { status: 500 });
    if (!owner || (owner.role !== "admin" && owner.role !== "venditore")) {
      return NextResponse.json(
        { error: "Il responsabile deve essere un admin o venditore operativo." },
        { status: 400 },
      );
    }
    update.sales_owner_id = owner.user_id;
    update.sales_owner_name = owner.display_name ?? owner.email;
  }
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
  if (usesLocations && "address" in body) update.address = normalizeNullableText(body.address);
  if (usesLocations && "city" in body) update.city = normalizeNullableText(body.city);
  if (usesLocations && "province" in body) update.province = normalizeNullableText(body.province);
  if (usesLocations && "postal_code" in body) update.postal_code = normalizeNullableText(body.postal_code);
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
    ["lead", "prospect", "active", "suspended", "churned", "lost"].includes(body.status as string)
  ) {
    update.status = body.status;
  }
  if ("notes" in body) update.notes = body.notes ?? null;

  // ─── Proposta commerciale (alimenta demo, contratto, abbonamento) ──────────────
  let touchesProposal = false;
  if ("proposed_package_slug" in body) {
    update.proposed_package_slug = normalizeNullableText(body.proposed_package_slug);
    touchesProposal = true;
  }
  if ("proposed_addons" in body) {
    update.proposed_addons = Array.isArray(body.proposed_addons)
      ? (body.proposed_addons as unknown[]).filter((v): v is string => typeof v === "string")
      : [];
    touchesProposal = true;
  }
  if ("proposed_extra_modules" in body) {
    update.proposed_extra_modules = Array.isArray(body.proposed_extra_modules)
      ? (body.proposed_extra_modules as unknown[]).filter((v): v is string => typeof v === "string")
      : [];
    touchesProposal = true;
  }
  if ("proposed_billing_cycle" in body) {
    update.proposed_billing_cycle =
      body.proposed_billing_cycle === "monthly" || body.proposed_billing_cycle === "yearly"
        ? body.proposed_billing_cycle
        : null;
    touchesProposal = true;
  }
  if ("proposed_setup_amount" in body) {
    update.proposed_setup_amount =
      typeof body.proposed_setup_amount === "number" ? body.proposed_setup_amount : null;
    touchesProposal = true;
  }
  if ("proposed_recurring_amount" in body) {
    update.proposed_recurring_amount =
      typeof body.proposed_recurring_amount === "number" ? body.proposed_recurring_amount : null;
    touchesProposal = true;
  }
  if (touchesProposal) update.proposal_updated_at = new Date().toISOString();

  update.last_updated_by_user_id = auth.user!.id;
  update.update_actor_at = new Date().toISOString();

  const primaryLocation = body.primary_location as Record<string, unknown> | undefined;
  const hasPrimaryLocation = primaryLocation && typeof primaryLocation === "object";

  if (Object.keys(update).length === 2 && !hasPrimaryLocation) {
    return NextResponse.json({ error: "Nessun campo aggiornabile nel body." }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  if (Object.keys(update).length > 1) {
    const { error } = await admin
      .from("platform_leads")
      .update(update as never)
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (hasPrimaryLocation) {
    if (!usesLocations) {
      const { error } = await admin
        .from("platform_lead_locations" as never)
        .delete()
        .eq("lead_id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

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

// DELETE /api/admin/leads/[id]
// Elimina il lead e i record CRM collegati tramite le foreign key in cascata.
// Un eventuale tenant convertito resta intatto.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCrmPermission("crm:delete");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID lead mancante." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: lead, error: findError } = await admin
    .from("platform_leads")
    .select("id, tenant_id")
    .eq("id", id)
    .maybeSingle();

  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
  if (!lead) return NextResponse.json({ error: "Lead non trovato." }, { status: 404 });

  const { error } = await admin
    .from("platform_leads")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    tenantPreserved: Boolean(lead.tenant_id),
  });
}
