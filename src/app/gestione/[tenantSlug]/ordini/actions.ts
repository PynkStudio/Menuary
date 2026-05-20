"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";
import type { Database } from "@/lib/supabase/types";

type Status = Database["public"]["Enums"]["order_status"];

async function update(tenantSlug: string, orderId: string, status: Status) {
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;

  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");

  const { error } = await svc
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("tenant_id", tenantSlug);

  if (error) throw new Error(error.message);

  revalidatePath(`/gestione/${tenantSlug}/ordini`);
}

function makeAction(status: Status) {
  return async (formData: FormData) => {
    const tenantSlug = String(formData.get("tenantSlug") ?? "");
    const id = String(formData.get("id") ?? "");
    if (!tenantSlug || !id) return;
    await update(tenantSlug, id, status);
  };
}

export const startOrder = makeAction("in_preparazione");
export const markReady = makeAction("pronto");
export const markDelivered = makeAction("consegnato");
export const cancelOrder = makeAction("annullato");
