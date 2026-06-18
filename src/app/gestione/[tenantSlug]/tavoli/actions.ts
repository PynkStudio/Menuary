"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";

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
  const location = await requireActiveGestioneLocation(tenantSlug);

  const { data: table } = await svc
    .from("tables")
    .select("id")
    .eq("id", tableId)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id)
    .maybeSingle();
  if (!table) throw new Error("table_location_mismatch");

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
  const location = await requireActiveGestioneLocation(tenantSlug);
  const { data: session } = await svc
    .from("table_sessions")
    .select("table_id")
    .eq("id", sessionId)
    .eq("tenant_id", tenantSlug)
    .maybeSingle();
  if (!session) throw new Error("table_session_not_found");
  const { data: table } = await svc
    .from("tables")
    .select("id")
    .eq("id", session.table_id)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id)
    .maybeSingle();
  if (!table) throw new Error("table_session_location_mismatch");

  const { error } = await svc
    .from("table_sessions")
    .update({ status: "chiusa", closed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("tenant_id", tenantSlug);
  if (error) throw new Error(error.message);

  revalidatePath(`/gestione/${tenantSlug}/tavoli`);
}
