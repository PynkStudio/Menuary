import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantPrinter } from "@/lib/types";

// Caricamento configurazione stampanti (server-side, service client).
// Risoluzione sede→default tenant come per le altre impostazioni: prima le righe
// della sede, poi quelle con location_id NULL.

type PrinterRow = {
  id: string;
  tenant_id: string;
  location_id: string | null;
  name: string;
  connection: string;
  qz_printer_name: string | null;
  device_sn: string | null;
  station: string | null;
  categories: string[] | null;
  char_width: number;
  copies: number;
  auto_print: boolean;
  is_default: boolean;
  enabled: boolean;
};

export function mapPrinterRow(row: PrinterRow): TenantPrinter {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    locationId: row.location_id,
    name: row.name,
    connection: (row.connection as TenantPrinter["connection"]) ?? "qz",
    qzPrinterName: row.qz_printer_name,
    deviceSn: row.device_sn,
    station: (row.station as TenantPrinter["station"]) ?? null,
    categories: row.categories,
    charWidth: row.char_width ?? 48,
    copies: row.copies ?? 1,
    autoPrint: row.auto_print,
    isDefault: row.is_default,
    enabled: row.enabled,
  };
}

/**
 * Stampanti effettive per (tenant, location): se la sede ha righe proprie usa
 * quelle, altrimenti il fallback con location_id NULL (default tenant).
 */
export async function loadPrinters(
  supabase: SupabaseClient,
  tenantId: string,
  locationId: string | null,
): Promise<TenantPrinter[]> {
  const { data, error } = await supabase
    .from("tenant_printers")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error || !data) return [];

  const rows = data as PrinterRow[];
  const forLocation = locationId ? rows.filter((r) => r.location_id === locationId) : [];
  const chosen = forLocation.length > 0 ? forLocation : rows.filter((r) => r.location_id === null);
  return chosen.map(mapPrinterRow);
}

/** La stampante predefinita attiva per (tenant, location), se esiste. */
export async function loadDefaultPrinter(
  supabase: SupabaseClient,
  tenantId: string,
  locationId: string | null,
): Promise<TenantPrinter | null> {
  const printers = (await loadPrinters(supabase, tenantId, locationId)).filter((p) => p.enabled);
  return printers.find((p) => p.isDefault) ?? printers[0] ?? null;
}
