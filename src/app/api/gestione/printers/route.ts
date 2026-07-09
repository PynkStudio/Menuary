import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getActiveGestioneLocation } from "@/lib/gestione-location";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { TENANTS } from "@/lib/tenant-registry";
import { loadPrinters } from "@/lib/printing/config";
import { recordPlatformErrorFromRequest } from "@/lib/platform-errors";

// Config stampanti comande (modulo printStations).
// F1: la UI gestisce UNA stampante predefinita per locale. Lo schema DB è già
// predisposto per più stampante con routing per reparto/categoria.
// TODO(multi-printer): esporre create/delete/routing di stampante aggiuntive.

type PrinterPatch = {
  tenantId?: string;
  locationId?: string | null;
  name?: string;
  connection?: string;
  qzPrinterName?: string | null;
  deviceSn?: string | null;
  charWidth?: number;
  copies?: number;
  autoPrint?: boolean;
  enabled?: boolean;
};

const VALID_CONNECTIONS = ["qz", "network_eposprint", "printnode", "sunmi_cloud", "sunmi_pos"];

function tenantFrom(req: NextRequest, body?: PrinterPatch | null) {
  return req.nextUrl.searchParams.get("tenantId") ?? body?.tenantId ?? "";
}

function locationFrom(req: NextRequest, body?: PrinterPatch | null): string | null {
  const q = req.nextUrl.searchParams.get("locationId");
  if (q) return q;
  if (body && body.locationId !== undefined) return body.locationId;
  return null;
}

function assertPrintStationsEnabled(tenantId: string) {
  const tenant = TENANTS.find((t) => t.id === tenantId);
  return Boolean(tenant && getGestioneModuleAccess(tenant.features).canManagePrintStations);
}

async function resolveLocation(tenantId: string, requested: string | null, isDemo: boolean) {
  if (isDemo) return requested;
  // Tenant senza location (es. bepork): si opera al livello "default tenant"
  // (location_id NULL), come gli ordini. getActiveGestioneLocation torna null
  // se non esiste alcuna sede, ma lancia ancora per i casi multi-sede.
  const location = await getActiveGestioneLocation(tenantId);
  return location?.id ?? null;
}

export async function GET(req: NextRequest) {
  const tenantId = tenantFrom(req);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!assertPrintStationsEnabled(tenantId) && (auth.isDemo || !auth.isPlatformAdmin)) {
    return NextResponse.json({ error: "module_disabled" }, { status: 403 });
  }

  const requested = locationFrom(req);
  const locationId = await resolveLocation(tenantId, requested, auth.isDemo).catch(async (error) => {
    await recordPlatformErrorFromRequest(req, {
      error,
      source: "gestione",
      tenantId,
      flow: "printer_settings",
      operation: "resolve_location",
      title: "Stampanti: risoluzione sede fallita",
      httpStatus: 500,
      metadata: { requestedLocationId: requested, isDemo: auth.isDemo },
    }).catch(() => undefined);
    throw error;
  });
  if (!auth.isDemo && !auth.isPlatformAdmin && requested && requested !== locationId) {
    return NextResponse.json({ error: "location_mismatch" }, { status: 403 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const printers = await loadPrinters(supabase, tenantId, locationId).catch(async (error) => {
    await recordPlatformErrorFromRequest(req, {
      error,
      source: "gestione",
      tenantId,
      locationId,
      flow: "printer_settings",
      operation: "load_printers",
      title: "Stampanti: lettura configurazione fallita",
      httpStatus: 500,
    }).catch(() => undefined);
    throw error;
  });
  return NextResponse.json({ printers });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as PrinterPatch | null;
  const tenantId = tenantFrom(req, body);
  if (!tenantId || !body) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!assertPrintStationsEnabled(tenantId) && (auth.isDemo || !auth.isPlatformAdmin)) {
    return NextResponse.json({ error: "module_disabled" }, { status: 403 });
  }

  const requested = locationFrom(req, body);
  const locationId = await resolveLocation(tenantId, requested, auth.isDemo).catch(async (error) => {
    await recordPlatformErrorFromRequest(req, {
      error,
      source: "gestione",
      tenantId,
      flow: "printer_settings",
      operation: "resolve_location",
      title: "Stampanti: risoluzione sede durante salvataggio fallita",
      httpStatus: 500,
      metadata: { requestedLocationId: requested, isDemo: auth.isDemo },
    }).catch(() => undefined);
    throw error;
  });
  if (!auth.isDemo && !auth.isPlatformAdmin && requested && requested !== locationId) {
    return NextResponse.json({ error: "location_mismatch" }, { status: 403 });
  }

  const charWidth = body.charWidth;
  if (charWidth != null && (charWidth < 24 || charWidth > 64)) {
    return NextResponse.json({ error: "charWidth deve essere tra 24 e 64" }, { status: 422 });
  }
  const copies = body.copies;
  if (copies != null && (copies < 1 || copies > 5)) {
    return NextResponse.json({ error: "copies deve essere tra 1 e 5" }, { status: 422 });
  }
  if (body.connection != null && !VALID_CONNECTIONS.includes(body.connection)) {
    return NextResponse.json({ error: "connection non valida" }, { status: 422 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  // F1: una sola stampante (default) per (tenant, location). Upsert manuale.
  const existing = (await loadPrinters(supabase, tenantId, locationId).catch(async (error) => {
    await recordPlatformErrorFromRequest(req, {
      error,
      source: "gestione",
      tenantId,
      locationId,
      flow: "printer_settings",
      operation: "load_existing_printers",
      title: "Stampanti: lettura configurazione prima del salvataggio fallita",
      httpStatus: 500,
    }).catch(() => undefined);
    throw error;
  })).find((p) => p.isDefault);

  const fields = {
    name: body.name ?? existing?.name ?? "Cucina",
    connection: body.connection ?? existing?.connection ?? "qz",
    qz_printer_name: body.qzPrinterName !== undefined ? body.qzPrinterName : existing?.qzPrinterName ?? null,
    device_sn: body.deviceSn !== undefined ? body.deviceSn : existing?.deviceSn ?? null,
    char_width: body.charWidth ?? existing?.charWidth ?? 48,
    copies: body.copies ?? existing?.copies ?? 1,
    auto_print: body.autoPrint ?? existing?.autoPrint ?? true,
    enabled: body.enabled ?? existing?.enabled ?? true,
  };

  if (existing) {
    const { error } = await supabase.from("tenant_printers").update(fields).eq("id", existing.id);
    if (error) {
      await recordPlatformErrorFromRequest(req, {
        error,
        source: "gestione",
        tenantId,
        locationId,
        flow: "printer_settings",
        operation: "update_printer",
        title: "Stampanti: aggiornamento configurazione fallito",
        httpStatus: 500,
        metadata: { printerId: existing.id, fields },
      }).catch(() => undefined);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("tenant_printers").insert({
      tenant_id: tenantId,
      location_id: locationId,
      is_default: true,
      ...fields,
    });
    if (error) {
      await recordPlatformErrorFromRequest(req, {
        error,
        source: "gestione",
        tenantId,
        locationId,
        flow: "printer_settings",
        operation: "insert_printer",
        title: "Stampanti: creazione configurazione fallita",
        httpStatus: 500,
        metadata: { fields },
      }).catch(() => undefined);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const printers = await loadPrinters(supabase, tenantId, locationId);
  return NextResponse.json({ printers });
}
