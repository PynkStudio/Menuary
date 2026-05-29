import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";

type Db = SupabaseClient<Database>;

export type HubriseLink = {
  id: string;
  tenantId: string;
  locationId: string | null;
  hubriseAccountId: string | null;
  hubriseLocationId: string;
  locationName: string | null;
  locationToken: string;
  catalogId: string | null;
  customerListId: string | null;
  status: "active" | "paused" | "revoked";
  menuPushEnabled: boolean;
  ordersInboundEnabled: boolean;
  lastMenuPushAt: string | null;
  lastMenuPushHash: string | null;
};

function db(): Db {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client;
}

type LinkRow = {
  id: string;
  tenant_id: string;
  location_id: string | null;
  hubrise_account_id: string | null;
  hubrise_location_id: string;
  location_name: string | null;
  location_token: string;
  catalog_id: string | null;
  customer_list_id: string | null;
  status: HubriseLink["status"];
  menu_push_enabled: boolean;
  orders_inbound_enabled: boolean;
  last_menu_push_at: string | null;
  last_menu_push_hash: string | null;
};

function toLink(row: LinkRow): HubriseLink {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    locationId: row.location_id,
    hubriseAccountId: row.hubrise_account_id,
    hubriseLocationId: row.hubrise_location_id,
    locationName: row.location_name,
    locationToken: row.location_token,
    catalogId: row.catalog_id,
    customerListId: row.customer_list_id,
    status: row.status,
    menuPushEnabled: row.menu_push_enabled,
    ordersInboundEnabled: row.orders_inbound_enabled,
    lastMenuPushAt: row.last_menu_push_at,
    lastMenuPushHash: row.last_menu_push_hash,
  };
}

export async function listLinksForTenant(tenantId: string): Promise<HubriseLink[]> {
  const { data, error } = await db()
    .from("hubrise_links" as never)
    .select("*")
    .eq("tenant_id", tenantId);
  if (error) throw error;
  return ((data ?? []) as unknown as LinkRow[]).map(toLink);
}

export async function findLinkByHubriseLocation(hubriseLocationId: string): Promise<HubriseLink | null> {
  const { data, error } = await db()
    .from("hubrise_links" as never)
    .select("*")
    .eq("hubrise_location_id", hubriseLocationId)
    .maybeSingle();
  if (error) throw error;
  return data ? toLink(data as unknown as LinkRow) : null;
}

export async function updateLinkCatalogId(linkId: string, catalogId: string) {
  await db()
    .from("hubrise_links" as never)
    .update({ catalog_id: catalogId, updated_at: new Date().toISOString() } as never)
    .eq("id", linkId);
}

export async function markMenuPushed(linkId: string, payloadHash: string) {
  await db()
    .from("hubrise_links" as never)
    .update({
      last_menu_push_at: new Date().toISOString(),
      last_menu_push_hash: payloadHash,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", linkId);
}

export async function logMenuSync(input: {
  tenantId: string;
  linkId: string;
  status: "ok" | "error" | "skipped";
  payloadHash?: string | null;
  error?: string | null;
}) {
  const now = new Date().toISOString();
  await db()
    .from("hubrise_menu_sync_log" as never)
    .insert({
      tenant_id: input.tenantId,
      link_id: input.linkId,
      status: input.status,
      payload_hash: input.payloadHash ?? null,
      error: input.error ?? null,
      completed_at: now,
    } as never);
}
