import "server-only";
import type { TenantVertical } from "@/lib/tenant";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type TenantDemoControl = {
  tenantId: string;
  previewSlug: string;
  vertical: TenantVertical;
  enabled: boolean;
  disabledAt: string | null;
  updatedAt: string;
};

type TenantDemoControlRow = {
  tenant_id: string;
  preview_slug: string;
  vertical: string;
  enabled: boolean;
  disabled_at: string | null;
  updated_at: string;
};

function getServiceClient() {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("Supabase service client non disponibile");
  return db;
}

function mapControl(row: TenantDemoControlRow): TenantDemoControl {
  return {
    tenantId: row.tenant_id,
    previewSlug: row.preview_slug,
    vertical: row.vertical === "services" ? "services" : "food",
    enabled: row.enabled,
    disabledAt: row.disabled_at,
    updatedAt: row.updated_at,
  };
}

export async function listTenantDemoControls(): Promise<TenantDemoControl[]> {
  const { data, error } = await getServiceClient()
    .from("tenant_demo_controls")
    .select("tenant_id,preview_slug,vertical,enabled,disabled_at,updated_at")
    .order("tenant_id");

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapControl);
}

export async function upsertTenantDemoControl(input: {
  tenantId: string;
  previewSlug: string;
  vertical: TenantVertical;
  enabled?: boolean;
}): Promise<TenantDemoControl> {
  const now = new Date().toISOString();
  const enabled = input.enabled ?? true;
  const { data, error } = await getServiceClient()
    .from("tenant_demo_controls")
    .upsert(
      {
        tenant_id: input.tenantId,
        preview_slug: input.previewSlug,
        vertical: input.vertical,
        enabled,
        disabled_at: enabled ? null : now,
        updated_at: now,
      },
      { onConflict: "tenant_id" },
    )
    .select("tenant_id,preview_slug,vertical,enabled,disabled_at,updated_at")
    .single();

  if (error) throw new Error(error.message);
  return mapControl(data);
}
