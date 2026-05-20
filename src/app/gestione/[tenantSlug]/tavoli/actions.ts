"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";

function code(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function openTableSession(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const tableId = String(formData.get("tableId") ?? "");
  const coversRaw = formData.get("covers");
  const covers = typeof coversRaw === "string" && coversRaw.trim() !== "" ? Number(coversRaw) : null;
  if (!tenantSlug || !tableId) return;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;

  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");

  const { error } = await svc.from("table_sessions").insert({
    tenant_id: tenantSlug,
    table_id: tableId,
    code: code(),
    declared_covers: covers,
    status: "aperta",
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/gestione/${tenantSlug}/tavoli`);
}

export async function closeTableSession(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!tenantSlug || !sessionId) return;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;

  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");

  const { error } = await svc
    .from("table_sessions")
    .update({ status: "chiusa", closed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("tenant_id", tenantSlug);
  if (error) throw new Error(error.message);

  revalidatePath(`/gestione/${tenantSlug}/tavoli`);
}
