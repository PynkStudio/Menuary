import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type Body = {
  tenantId?: string;
  portal?: "ordini" | "cassa" | "cucina" | "kiosk" | "rider";
  locationId?: string | null;
  visible?: boolean;
};

type LoosePostgrestResult = Promise<{ data: Array<{ id: string }> | null; error: { message: string } | null }>;
type LoosePostgrestQuery = {
  eq: (key: string, value: string) => LoosePostgrestQuery;
  is: (key: string, value: null) => LoosePostgrestQuery;
  select: (columns: string) => LoosePostgrestQuery;
  limit: (n: number) => LoosePostgrestResult;
  then: LoosePostgrestResult["then"];
};
type LoosePostgrestTable = {
  update: (row: Record<string, unknown>) => LoosePostgrestQuery;
  insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.tenantId || !body.portal) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
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
  const db = svc as unknown as { from: (table: string) => LoosePostgrestTable };

  const row = {
      tenant_id: body.tenantId,
      user_id: user.id,
      portal: body.portal,
      location_id: body.locationId ?? null,
      visible: Boolean(body.visible),
      last_seen_at: new Date().toISOString(),
      user_agent: req.headers.get("user-agent"),
    } as never;

  let update = db
    .from("operational_portal_presence")
    .update(row)
    .eq("tenant_id", body.tenantId)
    .eq("portal", body.portal)
    .eq("user_id", user.id);

  update = body.locationId ? update.eq("location_id", body.locationId) : update.is("location_id", null);
  const { data: updated, error: updateError } = await update.select("id").limit(1);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (updated?.length) return NextResponse.json({ ok: true });

  const { error } = await db.from("operational_portal_presence").insert(row);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
