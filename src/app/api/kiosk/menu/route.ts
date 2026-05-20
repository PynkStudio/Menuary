import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { resolveKioskDevice } from "@/lib/kiosk-auth";

// GET /api/kiosk/menu
// Header: X-Kiosk-Token
// Risponde con categorie + items disponibili per il tenant (e location, se valorizzata).
export async function GET(req: NextRequest) {
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const token = req.headers.get("x-kiosk-token");
  const device = await resolveKioskDevice(svc, token);
  if (!device) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tenantId = device.tenant_id;
  const locationId = device.location_id;

  const catsQ = svc
    .from("menu_categories")
    .select("id, code, title, subtitle, description, position")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  const itemsQ = svc
    .from("menu_items")
    .select("id, category_id, code, name, description, price, price_kind, image, position, available, tags, allergens, bookable, duration_minutes")
    .eq("tenant_id", tenantId)
    .eq("available", true)
    .order("position", { ascending: true });

  if (locationId) {
    // Includi sia righe globali (location_id null) sia righe specifiche di questa sede.
    catsQ.or(`location_id.is.null,location_id.eq.${locationId}`);
    itemsQ.or(`location_id.is.null,location_id.eq.${locationId}`);
  }

  const [{ data: cats }, { data: items }] = await Promise.all([catsQ, itemsQ]);

  return NextResponse.json({
    device: { id: device.id, name: device.name, config: device.config },
    categories: cats ?? [],
    items: items ?? [],
  });
}
