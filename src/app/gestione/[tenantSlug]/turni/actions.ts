"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";

export async function createShift(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  const startAt = String(formData.get("startAt") ?? "");
  const endAt = String(formData.get("endAt") ?? "");
  const role = String(formData.get("role") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!tenantSlug || !employeeId || !startAt || !endAt) return;
  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) return;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");

  const { error } = await svc.from("shifts").insert({
    tenant_id: tenantSlug,
    employee_id: employeeId,
    start_at: new Date(startAt).toISOString(),
    end_at: new Date(endAt).toISOString(),
    role,
    note,
    status: "scheduled",
    created_by: auth.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/gestione/${tenantSlug}/turni`);
}

export async function deleteShift(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");

  const { error } = await svc.from("shifts").delete().eq("id", id).eq("tenant_id", tenantSlug);
  if (error) throw new Error(error.message);
  revalidatePath(`/gestione/${tenantSlug}/turni`);
}
