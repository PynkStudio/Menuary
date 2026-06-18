"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";

type Status = "confirmed" | "rejected" | "seated" | "no_show" | "pending_manual";

async function update(tenantSlug: string, reservationId: string, status: Status) {
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) {
    // Nessuna scrittura sul DB in demo: la UI ottimistica resta lato client.
    return;
  }

  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const location = await requireActiveGestioneLocation(tenantSlug);

  const { error } = await svc
    .from("reservation_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", reservationId)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/gestione/${tenantSlug}/prenotazioni`);
}

export async function confirmReservation(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;
  await update(tenantSlug, id, "confirmed");
}

export async function rejectReservation(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;
  await update(tenantSlug, id, "rejected");
}

export async function markSeatedReservation(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;
  await update(tenantSlug, id, "seated");
}

export async function markNoShowReservation(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;
  await update(tenantSlug, id, "no_show");
}
