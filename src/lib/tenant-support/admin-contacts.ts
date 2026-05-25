import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/lib/supabase/types";

type Db = SupabaseClient<Database>;

export function normalizeWhatsappPhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  const digits = trimmed.replace(/\D/g, "");
  if (/^3\d{8,10}$/.test(digits)) return `+39${digits}`;
  return `+${digits}`;
}

export async function upsertTenantSupportAdminContact(params: {
  tenantId: string;
  phone: string | null | undefined;
  displayName?: string | null;
  contactRefId?: string | null;
  permissions?: Record<string, unknown>;
}): Promise<void> {
  if (!params.phone?.trim()) return;
  const db = createSupabaseServiceClient() as Db | null;
  if (!db) throw new Error("supabase_service_unconfigured");

  const phoneE164 = normalizeWhatsappPhone(params.phone);
  if (phoneE164.length < 8) return;

  const { error } = await (db as unknown as {
    from: (table: "tenant_customer_service_contacts") => {
      upsert: (
        row: Record<string, unknown>,
        opts: { onConflict: string },
      ) => Promise<{ error: { message: string } | null }>;
    };
  }).from("tenant_customer_service_contacts").upsert({
    tenant_id: params.tenantId,
    phone_e164: phoneE164,
    display_name: params.displayName ?? null,
    contact_kind: "tenantadmin",
    contact_ref_id: params.contactRefId ?? null,
    authorized_by_siteadmin_id: null,
    permissions: (params.permissions ?? {}) as Json,
    enabled: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "tenant_id,phone_e164" });

  if (error) throw new Error(error.message);
}

export async function upsertTenantSupportEmployeeGrant(params: {
  tenantId: string;
  phone: string | null | undefined;
  displayName?: string | null;
  employeeId?: string | null;
  authorizedBySiteadminId: string;
  permissions: {
    manageMenu?: boolean;
    manageSettings?: boolean;
    manageHours?: boolean;
    createSupportTickets?: boolean;
  };
}): Promise<void> {
  if (!params.phone?.trim()) return;
  const db = createSupabaseServiceClient() as Db | null;
  if (!db) throw new Error("supabase_service_unconfigured");

  const phoneE164 = normalizeWhatsappPhone(params.phone);
  if (phoneE164.length < 8) return;

  const { error } = await (db as unknown as {
    from: (table: "tenant_customer_service_contacts") => {
      upsert: (
        row: Record<string, unknown>,
        opts: { onConflict: string },
      ) => Promise<{ error: { message: string } | null }>;
    };
  }).from("tenant_customer_service_contacts").upsert({
    tenant_id: params.tenantId,
    phone_e164: phoneE164,
    display_name: params.displayName ?? null,
    contact_kind: "employee",
    contact_ref_id: params.employeeId ?? null,
    authorized_by_siteadmin_id: params.authorizedBySiteadminId,
    permissions: params.permissions as Json,
    enabled: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "tenant_id,phone_e164" });

  if (error) throw new Error(error.message);
}
