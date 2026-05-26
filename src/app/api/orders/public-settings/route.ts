import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { loadOrderSettings } from "@/lib/orders/order-settings";

/**
 * GET /api/orders/public-settings?tenantId=…&locationId=…
 *
 * Endpoint pubblico (no auth): espone SOLO i flag necessari al checkout
 * cliente. Niente regole auto-accept né timeout (informazioni operative
 * del locale).
 */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const locationId = req.nextUrl.searchParams.get("locationId");
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const s = await loadOrderSettings(supabase, tenantId, locationId ?? null);
  return NextResponse.json({
    takeawayEnabled: s.takeawayEnabled,
    dineInEnabled: s.dineInEnabled,
    deliveryEnabled: s.deliveryEnabled,
  });
}
