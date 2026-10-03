import "server-only";
import type { TenantVertical } from "@/lib/tenant";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type TenantDemoControl = {
  tenantId: string;
  previewSlug: string;
  vertical: TenantVertical;
  enabled: boolean;
  // Quando true, gestione/* per il tenant su demo.menuary.it usa Supabase reale
  // invece dei fixture in localStorage. Leva siteadmin-only, scade da sola dopo
  // BACKEND_LIVE_WINDOW_MS: la demo e' pubblica e senza login.
  backendLive: boolean;
  backendLiveUntil: string | null;
  disabledAt: string | null;
  updatedAt: string;
};

type TenantDemoControlRow = {
  tenant_id: string;
  preview_slug: string;
  vertical: string;
  enabled: boolean;
  backend_live: boolean | null;
  backend_live_until: string | null;
  disabled_at: string | null;
  updated_at: string;
};

function getServiceClient() {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("Supabase service client non disponibile");
  return db;
}

export const BACKEND_LIVE_WINDOW_MS = 15 * 60 * 1000;

const SELECT_COLS =
  "tenant_id,preview_slug,vertical,enabled,backend_live,backend_live_until,disabled_at,updated_at";

function isBackendLiveActive(row: TenantDemoControlRow): boolean {
  if (!row.backend_live || !row.backend_live_until) return false;
  return new Date(row.backend_live_until).getTime() > Date.now();
}

function mapControl(row: TenantDemoControlRow): TenantDemoControl {
  return {
    tenantId: row.tenant_id,
    previewSlug: row.preview_slug,
    vertical: row.vertical === "creative" ? "creative" : row.vertical === "services" ? "services" : "food",
    enabled: row.enabled,
    backendLive: isBackendLiveActive(row),
    backendLiveUntil: isBackendLiveActive(row) ? row.backend_live_until : null,
    disabledAt: row.disabled_at,
    updatedAt: row.updated_at,
  };
}

export async function listTenantDemoControls(): Promise<TenantDemoControl[]> {
  const { data, error } = await getServiceClient()
    .from("tenant_demo_controls")
    .select(SELECT_COLS)
    .order("tenant_id");

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapControl);
}

export async function getTenantDemoControl(tenantId: string): Promise<TenantDemoControl | null> {
  const { data, error } = await getServiceClient()
    .from("tenant_demo_controls")
    .select(SELECT_COLS)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapControl(data) : null;
}

export async function upsertTenantDemoControl(input: {
  tenantId: string;
  previewSlug: string;
  vertical: TenantVertical;
  enabled?: boolean;
  backendLive?: boolean;
}): Promise<TenantDemoControl> {
  const now = new Date().toISOString();
  // Patch parziale: leggo lo stato attuale così PATCH su un solo campo non azzera l'altro.
  const existing = await getTenantDemoControl(input.tenantId);
  const enabled = input.enabled ?? existing?.enabled ?? true;
  const backendLive = input.backendLive ?? existing?.backendLive ?? false;
  const { data, error } = await getServiceClient()
    .from("tenant_demo_controls")
    .upsert(
      {
        tenant_id: input.tenantId,
        preview_slug: input.previewSlug,
        vertical: input.vertical,
        enabled,
        backend_live: backendLive,
        backend_live_until: backendLive
          ? input.backendLive
            ? new Date(Date.now() + BACKEND_LIVE_WINDOW_MS).toISOString()
            : existing?.backendLiveUntil ?? null
          : null,
        disabled_at: enabled ? null : (existing?.disabledAt ?? now),
        updated_at: now,
      },
      { onConflict: "tenant_id" },
    )
    .select(SELECT_COLS)
    .single();

  if (error) throw new Error(error.message);
  return mapControl(data);
}
