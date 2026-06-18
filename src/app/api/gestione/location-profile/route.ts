import { NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type Body = {
  tenantId?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const tenantId = body?.tenantId?.trim() ?? "";
  if (!tenantId || !body) {
    return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
  }

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.isDemo) return NextResponse.json({ ok: true });

  const location = await requireActiveGestioneLocation(tenantId);
  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "DB non disponibile" }, { status: 503 });

  const { error } = await db
    .from("locations")
    .update({
      address: body.address?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", location.id)
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, locationId: location.id });
}
