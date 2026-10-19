import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { loadCallBilling } from "@/lib/retell/call-billing";

export const dynamic = "force-dynamic";

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(sa?.role) && hasAdminPermission(sa.role, "crm:view") ? user : null;
}

function currentRomeMonth(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" }).slice(0, 7);
}

// GET /api/admin/ai-phone/call-billing?month=YYYY-MM
// Chiamate Retell del mese per tenant, al netto di quelle che hanno generato solo ordini
// annullati dal locale, più l'elenco degli annullamenti con causale.
export async function GET(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const requested = req.nextUrl.searchParams.get("month") ?? "";
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : currentRomeMonth();

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ month, tenants: [], cancellations: [] });

  const billing = await loadCallBilling(db, month);
  const tenantIds = [...new Set([...billing.tenants.map((t) => t.tenantId), ...billing.cancellations.map((c) => c.tenantId)])];
  const { data: tenantRows } = tenantIds.length
    ? await db.from("tenants").select("id, name").in("id", tenantIds)
    : { data: [] as Array<{ id: string; name: string }> };
  const names = Object.fromEntries((tenantRows ?? []).map((t) => [t.id, t.name]));

  return NextResponse.json({ month, names, ...billing });
}
