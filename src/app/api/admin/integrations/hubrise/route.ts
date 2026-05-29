import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { fetchLocations } from "@/lib/location";
import { listLinksForTenant } from "@/lib/hubrise/links";

export const dynamic = "force-dynamic";

/** GET /api/admin/integrations/hubrise?tenantId=...
 *  Restituisce { locations, links, logs } per la modale admin. */
export async function GET(req: NextRequest) {
  const tenantId = new URL(req.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const [locations, links] = await Promise.all([
    fetchLocations(supabase, tenantId),
    listLinksForTenant(tenantId),
  ]);

  const linkIds = links.map((l) => l.id);
  const logs =
    linkIds.length > 0
      ? (
          await supabase
            .from("hubrise_menu_sync_log")
            .select("id,link_id,status,payload_hash,error,started_at")
            .in("link_id", linkIds)
            .order("started_at", { ascending: false })
            .limit(15)
        ).data ?? []
      : [];

  return NextResponse.json({ locations, links, logs });
}
