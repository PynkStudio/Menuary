import { sendWebPush } from "@/lib/push/send";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const FOREGROUND_WINDOW_SECONDS = 25;

type LooseSelectResult = Promise<{ data: Array<{ id: string }> | null }>;
type LooseSelectQuery = {
  eq: (key: string, value: string | boolean) => LooseSelectQuery;
  gte: (key: string, value: string) => LooseSelectQuery;
  limit: (n: number) => LooseSelectResult;
  then: LooseSelectResult["then"];
};
type LoosePresenceTable = {
  select: (columns: string) => LooseSelectQuery;
};

async function hasForegroundOrdersPortal(tenantId: string, locationId?: string | null): Promise<boolean> {
  const svc = createSupabaseServiceClient();
  if (!svc) return false;
  const db = svc as unknown as { from: (table: string) => LoosePresenceTable };
  const cutoff = new Date(Date.now() - FOREGROUND_WINDOW_SECONDS * 1000).toISOString();
  let q = db
    .from("operational_portal_presence")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("portal", "ordini")
    .eq("visible", true)
    .gte("last_seen_at", cutoff);

  if (locationId) q = q.eq("location_id", locationId);

  const { data } = await q.limit(1);
  return Boolean(data?.length);
}

export async function notifyOperationalNewOrder(input: {
  tenantId: string;
  orderCode: string;
  status: string;
  customerName?: string | null;
  locationId?: string | null;
}): Promise<void> {
  const visible = await hasForegroundOrdersPortal(input.tenantId, input.locationId);
  if (visible) return;

  await sendWebPush(input.tenantId, {
    title: input.status === "pending_confirmation" ? "Ordine da confermare" : "Nuovo ordine",
    body: `${input.orderCode}${input.customerName ? ` · ${input.customerName}` : ""}`,
    url: `/operativo/${encodeURIComponent(input.tenantId)}/ordini?f=${
      input.status === "pending_confirmation" ? "pending" : "live"
    }`,
    tag: `order-${input.tenantId}-${input.orderCode}`,
  });
}
