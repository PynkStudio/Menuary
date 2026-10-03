import { NextRequest, NextResponse } from "next/server";
import { requireGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getActiveGestioneLocation } from "@/lib/gestione-location";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { TENANTS } from "@/lib/tenant-registry";
import { loadDefaultPrinter } from "@/lib/printing/config";
import { buildTestTicketEscPos } from "@/lib/printing/comanda";
import {
  bindPrinterToShop,
  getPrinterOnlineStatus,
  isSunmiConfigured,
  pushPrintContent,
} from "@/lib/printing/sunmi-cloud";

// Collega (bindShop) la stampante cloud SUNMI salvata e invia una comanda di prova.
// Il bind è ripetibile: se la stampante è già nello shop SUNMI risponde con un
// codice d'errore che non blocca il push, quindi lo riportiamo solo come esito.

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { tenantId?: string } | null;
  const tenantId = req.nextUrl.searchParams.get("tenantId") ?? body?.tenantId ?? "";
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const auth = await requireGestione(tenantId, "admin");
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  // Su host demo authorizeGestione dà isDemo=false solo con "Backend live" attivo:
  // stesso gate delle comande (isComandaPrintBlockedForHost), spento non stampa.
  if (auth.isDemo) return NextResponse.json({ error: "demo_backend_off" }, { status: 403 });
  const tenant = TENANTS.find((t) => t.id === tenantId);
  if (!(tenant && getGestioneModuleAccess(tenant.features).canManagePrintStations) && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "module_disabled" }, { status: 403 });
  }
  if (!isSunmiConfigured()) return NextResponse.json({ error: "sunmi_not_configured" }, { status: 503 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const location = await getActiveGestioneLocation(tenantId);
  const printer = await loadDefaultPrinter(supabase, tenantId, location?.id ?? null);
  if (!printer || printer.connection !== "sunmi_cloud" || !printer.deviceSn) {
    return NextResponse.json({ error: "no_sunmi_cloud_printer" }, { status: 404 });
  }

  const bind = await bindPrinterToShop(printer.deviceSn);
  const status = await getPrinterOnlineStatus(printer.deviceSn);
  const push = await pushPrintContent({
    sn: printer.deviceSn,
    tradeNo: `t${Date.now()}`,
    escpos: buildTestTicketEscPos(printer),
    orderType: 5,
  });

  return NextResponse.json({
    ok: push.ok,
    sn: printer.deviceSn,
    bind: { ok: bind.ok, code: bind.code, msg: bind.msg },
    online: status.online,
    push: { ok: push.ok, code: push.code, msg: push.msg, status: push.status },
  });
}
