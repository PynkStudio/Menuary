import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { findTenantById } from "@/lib/tenant-registry";
import type { OrderStatus } from "@/lib/types";
import { HubriseError, updateOrderStatus } from "./client";
import { mapMenuaryStatusToHubrise } from "./mappers";

/**
 * Propaga il cambio di stato di un ordine verso HubRise (e quindi alla piattaforma
 * di origine: Deliveroo/JustEat/Glovo/UberEats). No-op se l'ordine non proviene da HubRise,
 * se il tenant non ha il flag attivo, o se lo stato non è mappabile.
 *
 * Best-effort: non solleva eccezioni — gli errori HubRise non devono mai bloccare l'UI dello staff.
 */
export async function pushOrderStatusToHubrise(input: {
  orderId: string;
  newStatus: OrderStatus;
}): Promise<{ pushed: boolean; reason?: string }> {
  try {
    const supabase = createSupabaseServiceClient();
    if (!supabase) return { pushed: false, reason: "supabase_unavailable" };

    const { data: order } = await supabase
      .from("orders")
      .select("id,tenant_id,location_id,source,external_order_id")
      .eq("id", input.orderId)
      .maybeSingle();

    if (!order || order.source !== "hubrise" || !order.external_order_id) {
      return { pushed: false, reason: "not_hubrise_order" };
    }

    const tenant = findTenantById(order.tenant_id);
    if (!tenant?.features.hubriseSync) {
      return { pushed: false, reason: "feature_disabled" };
    }

    const hubriseStatus = mapMenuaryStatusToHubrise(input.newStatus);
    if (!hubriseStatus) return { pushed: false, reason: "status_not_mappable" };

    // Risolvi il link giusto: stessa location dell'ordine, altrimenti unico link tenant.
    let linkQuery = supabase
      .from("hubrise_links")
      .select("location_token,location_id")
      .eq("tenant_id", order.tenant_id)
      .eq("status", "active");
    if (order.location_id) linkQuery = linkQuery.eq("location_id", order.location_id);

    const { data: links } = await linkQuery;
    const link = (links ?? []).find((l) => l.location_token);
    if (!link) return { pushed: false, reason: "no_active_link" };

    await updateOrderStatus({
      locationToken: link.location_token,
      orderId: order.external_order_id,
      status: hubriseStatus,
    });
    return { pushed: true };
  } catch (err) {
    const message =
      err instanceof HubriseError
        ? `HubRise ${err.status}`
        : err instanceof Error
          ? err.message
          : "unknown";
    return { pushed: false, reason: message };
  }
}
