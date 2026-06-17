"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { TENANTS } from "@/lib/tenant-registry";

function num(formData: FormData, key: string): number {
  const raw = formData.get(key);
  const n = typeof raw === "string" ? Number(raw.replace(",", ".")) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function assertCashRegisterEnabled(tenantSlug: string) {
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant || !getGestioneModuleAccess(tenant.features).canManageCheckout) {
    throw new Error("cash_register_disabled");
  }
}

async function resolveLocationId(tenantSlug: string, locationSlug: string | null) {
  if (!locationSlug) return null;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const { data, error } = await svc
    .from("locations")
    .select("id")
    .eq("tenant_id", tenantSlug)
    .eq("slug", locationSlug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

export async function openCashSession(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const locationSlug = String(formData.get("locationSlug") ?? "") || null;
  if (!tenantSlug) return;
  assertCashRegisterEnabled(tenantSlug);
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");

  const opening = num(formData, "openingAmount");
  const locationId = await resolveLocationId(tenantSlug, locationSlug);
  const { error } = await svc.from("cash_sessions").insert({
    tenant_id: tenantSlug,
    location_id: locationId,
    opening_amount: opening,
    opened_by: auth.userId,
    status: "open",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/operativo/${tenantSlug}/cassa`);
}

export async function closeCashSession(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!tenantSlug || !sessionId) return;
  assertCashRegisterEnabled(tenantSlug);
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");

  const closing = num(formData, "closingAmount");

  // Calcolo atteso: opening + somma movimenti per metodo "cash"
  const { data: sess } = await svc
    .from("cash_sessions")
    .select("opening_amount")
    .eq("id", sessionId)
    .maybeSingle();
  const { data: movs } = await svc
    .from("cash_movements")
    .select("kind, method, amount")
    .eq("session_id", sessionId);

  let expected = Number(sess?.opening_amount ?? 0);
  for (const m of movs ?? []) {
    if (m.method !== "cash") continue;
    if (m.kind === "sale" || m.kind === "cash_in") expected += Number(m.amount);
    if (m.kind === "refund" || m.kind === "cash_out") expected -= Number(m.amount);
    if (m.kind === "adjustment") expected += Number(m.amount);
  }

  const { error } = await svc
    .from("cash_sessions")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: auth.userId,
      closing_amount: closing,
      expected_amount: expected,
    })
    .eq("id", sessionId)
    .eq("tenant_id", tenantSlug);
  if (error) throw new Error(error.message);
  revalidatePath(`/operativo/${tenantSlug}/cassa`);
}

export async function addCashMovement(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const method = String(formData.get("method") ?? "cash");
  const note = String(formData.get("note") ?? "").trim() || null;
  const amount = num(formData, "amount");

  if (!tenantSlug || !sessionId || !kind || amount <= 0) return;
  assertCashRegisterEnabled(tenantSlug);
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");

  const { error } = await svc.from("cash_movements").insert({
    tenant_id: tenantSlug,
    session_id: sessionId,
    kind,
    method,
    amount,
    note,
    created_by: auth.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/operativo/${tenantSlug}/cassa`);
}
