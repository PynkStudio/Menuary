"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";
import type { Json } from "@/lib/database.types";

export type KioskConfig = {
  languages: string[];
  default_language: string;
  steps: {
    language_picker: boolean;
    dine_in_takeaway: boolean;
    table_number: boolean;
    customer_name: boolean;
  };
  payments: {
    cash: boolean;
    stripe_qr: boolean;
    satispay: boolean;
    pos: boolean;
  };
};

function generateCode(len = 6): string {
  // codice human-friendly: niente 0/O/1/I/L
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function guard(tenantSlug: string) {
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (!auth.isDemo && !auth.isAdmin) throw new Error("forbidden");
  return auth;
}

export async function createKioskDevice(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!tenantSlug || !name) return;

  const auth = await guard(tenantSlug);
  if (auth.isDemo) return;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const location = await requireActiveGestioneLocation(tenantSlug);

  // Tentativi per evitare collisione del pairing_code.
  let attempts = 0;
  while (attempts < 5) {
    const code = generateCode();
    const { error } = await svc.from("kiosk_devices").insert({
      tenant_id: tenantSlug,
      name,
      location_id: location.id,
      pairing_code: code,
    });
    if (!error) {
      revalidatePath(`/gestione/${tenantSlug}/kiosk`);
      return;
    }
    if (!error.message.includes("kiosk_devices_pairing_code_idx")) throw new Error(error.message);
    attempts++;
  }
  throw new Error("pairing_code_collision");
}

export async function toggleKioskDevice(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  const enable = formData.get("enable") === "true";
  if (!tenantSlug || !id) return;

  const auth = await guard(tenantSlug);
  if (auth.isDemo) return;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const location = await requireActiveGestioneLocation(tenantSlug);

  const { error } = await svc
    .from("kiosk_devices")
    .update({ enabled: enable, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/gestione/${tenantSlug}/kiosk`);
}

export async function deleteKioskDevice(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;

  const auth = await guard(tenantSlug);
  if (auth.isDemo) return;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const location = await requireActiveGestioneLocation(tenantSlug);

  const { error } = await svc.from("kiosk_devices").delete().eq("id", id).eq("tenant_id", tenantSlug).eq("location_id", location.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/gestione/${tenantSlug}/kiosk`);
}

export async function regeneratePairingCode(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;

  const auth = await guard(tenantSlug);
  if (auth.isDemo) return;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const location = await requireActiveGestioneLocation(tenantSlug);

  const code = generateCode();
  // Reset anche del token: l'eventuale device gia' accoppiato dovrà riaccoppiarsi.
  const { error } = await svc
    .from("kiosk_devices")
    .update({
      pairing_code: code,
      device_token: null,
      paired_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/gestione/${tenantSlug}/kiosk`);
}

export async function updateKioskConfig(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;

  const auth = await guard(tenantSlug);
  if (auth.isDemo) return;
  const svc = createSupabaseServiceClient();
  if (!svc) throw new Error("supabase_service_unconfigured");
  const location = await requireActiveGestioneLocation(tenantSlug);

  const { data: row } = await svc
    .from("kiosk_devices")
    .select("config")
    .eq("id", id)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id)
    .maybeSingle();
  const current = (row?.config ?? {}) as Partial<KioskConfig>;

  const config: KioskConfig = {
    languages: current.languages ?? ["it"],
    default_language: current.default_language ?? "it",
    steps: {
      language_picker: formData.get("step_language") === "on",
      dine_in_takeaway: formData.get("step_dine_in_takeaway") === "on",
      table_number: formData.get("step_table_number") === "on",
      customer_name: formData.get("step_customer_name") === "on",
    },
    payments: {
      cash: formData.get("pay_cash") === "on",
      stripe_qr: formData.get("pay_stripe_qr") === "on",
      satispay: formData.get("pay_satispay") === "on",
      pos: formData.get("pay_pos") === "on",
    },
  };

  const { error } = await svc
    .from("kiosk_devices")
    .update({ config: config as unknown as Json, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantSlug)
    .eq("location_id", location.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/gestione/${tenantSlug}/kiosk`);
}
