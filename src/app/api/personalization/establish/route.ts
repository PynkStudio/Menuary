import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type Body = {
  tenantId: string;
  source: "order" | "reservation" | "table_session" | "manual";
  orderId?: string | null;
  reservationId?: string | null;
};

/**
 * Dopo ordine / prenotazione / tavolo: crea legame CRM e evento (usa service_role dopo verifica sessione).
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.tenantId || !findTenantById(body.tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "supabase_service_unconfigured" }, { status: 503 });
  }

  const { error: linkErr } = await svc.from("tenant_customer_links").upsert(
    {
      tenant_id: body.tenantId,
      user_id: user.id,
      source: body.source,
      first_order_id: body.orderId ?? null,
    },
    { onConflict: "tenant_id,user_id" },
  );

  if (linkErr) {
    return NextResponse.json({ error: linkErr.message }, { status: 500 });
  }

  const { data: existingCustomer } = await svc
    .from("customers")
    .select("id")
    .eq("tenant_id", body.tenantId)
    .eq("menuary_user_id", user.id)
    .maybeSingle();

  if (existingCustomer?.id) {
    const { error: upErr } = await svc
      .from("customers")
      .update({
        display_name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Cliente",
        email: user.email ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCustomer.id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
  } else {
    const { error: insErr } = await svc.from("customers").insert({
      tenant_id: body.tenantId,
      menuary_user_id: user.id,
      display_name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Cliente",
      email: user.email ?? null,
    });
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  const { data: customerRow } = await svc
    .from("customers")
    .select("id")
    .eq("tenant_id", body.tenantId)
    .eq("menuary_user_id", user.id)
    .maybeSingle();

  if (customerRow?.id) {
    await svc.from("customer_events").insert({
      tenant_id: body.tenantId,
      customer_id: customerRow.id,
      event_kind: `establish_${body.source}`,
      ref_id: body.orderId ?? body.reservationId ?? null,
      meta: {},
    });
  }

  await svc.from("user_tenant_events").insert({
    tenant_id: body.tenantId,
    user_id: user.id,
    event_type: "establish_relationship",
    payload: { source: body.source, orderId: body.orderId, reservationId: body.reservationId },
  });

  return NextResponse.json({ ok: true });
}
