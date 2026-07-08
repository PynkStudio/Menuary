import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Registra una Web Push subscription per il portale corrente.
 * Riusabile per qualsiasi feature che debba notificare via push:
 *   - { scope: "tenant", tenantId }    → subscription legata a un tenant (agenda, ordini, ecc.)
 *   - { scope: "siteadmin" }           → subscription legata all'utente siteadmin autenticato (pannello admin)
 * Il tenantId è retrocompatibile: se `scope` è assente ma `tenantId` è presente, si assume "tenant".
 */
type Body = {
  scope?: "tenant" | "siteadmin";
  tenantId?: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
  /** Id dispositivo generato lato client (localStorage), per correlare filtri per-dispositivo (es. mail tenant). */
  deviceId?: string;
  /** Pagina da cui ci si è iscritti, usata come fallback del click-through se il payload non specifica un url. */
  pageUrl?: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
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

  const scope = body.scope ?? (body.tenantId ? "tenant" : null);
  if (!scope || !body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let tenantId: string | null = null;
  let siteadminId: string | null = null;

  if (scope === "tenant") {
    if (!body.tenantId) return NextResponse.json({ error: "missing_tenant_id" }, { status: 400 });
    tenantId = body.tenantId;
  } else {
    // Non ci si fida di un eventuale id lato client: si deriva sempre dall'utente autenticato.
    const { data: siteadmin, error: siteadminError } = await svc
      .from("siteadmin")
      .select("id")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .maybeSingle();
    if (siteadminError) return NextResponse.json({ error: siteadminError.message }, { status: 500 });
    if (!siteadmin) return NextResponse.json({ error: "not_a_siteadmin" }, { status: 403 });
    siteadminId = siteadmin.id;
  }

  const { error } = await svc.from("push_subscriptions").upsert(
    {
      tenant_id: tenantId,
      siteadmin_id: siteadminId,
      user_id: user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      user_agent: body.userAgent ?? null,
      device_id: body.deviceId ?? null,
      page_url: body.pageUrl ?? null,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
