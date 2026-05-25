import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/lib/supabase/types";

type Db = SupabaseClient<Database>;

export type CustomerIdentity = {
  customerId: string;
  menuaryUserId: string | null;
  registered: boolean;
  phone: string;
};

type CustomerRow = {
  id: string;
  tenant_id: string;
  menuary_user_id: string | null;
  phone: string | null;
  display_name: string | null;
  tags: string[];
};

function db(): Db {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client;
}

export function normalizePhone(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (hasPlus) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("3")) return `+39${digits}`;
  return `+${digits}`;
}

function mergeTags(existing: string[], next: string[]) {
  return Array.from(new Set([...existing, ...next]));
}

async function findTenantCustomer(tenantId: string, phone: string): Promise<CustomerRow | null> {
  const { data } = await db()
    .from("customers")
    .select("id,tenant_id,menuary_user_id,phone,display_name,tags")
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .order("menuary_user_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CustomerRow | null) ?? null;
}

async function findRegisteredMenuaryUserByPhone(phone: string): Promise<string | null> {
  const { data } = await db()
    .from("customers")
    .select("menuary_user_id")
    .eq("phone", phone)
    .not("menuary_user_id", "is", null)
    .limit(1)
    .maybeSingle();
  return (data?.menuary_user_id as string | null | undefined) ?? null;
}

export async function resolveCustomerIdentity(input: {
  tenantId: string;
  phone?: string | null;
  displayName?: string | null;
  source: "retell" | "whatsapp" | "web" | "kiosk" | "manual";
}): Promise<CustomerIdentity | null> {
  const phone = normalizePhone(input.phone);
  if (!phone) return null;

  const now = new Date().toISOString();
  const existing = await findTenantCustomer(input.tenantId, phone);
  const registeredUserId = existing?.menuary_user_id ?? await findRegisteredMenuaryUserByPhone(phone);
  const registered = Boolean(registeredUserId);
  const sourceTag = `source:${input.source}`;
  const registrationTag = registered ? "menuary_registered" : "guest_contact";

  if (existing) {
    const tags = mergeTags(existing.tags ?? [], [sourceTag, registrationTag]);
    await db()
      .from("customers")
      .update({
        display_name: existing.display_name ?? input.displayName ?? null,
        menuary_user_id: existing.menuary_user_id ?? registeredUserId,
        tags,
        updated_at: now,
      })
      .eq("id", existing.id);
    return {
      customerId: existing.id,
      menuaryUserId: existing.menuary_user_id ?? registeredUserId,
      registered,
      phone,
    };
  }

  const { data, error } = await db()
    .from("customers")
    .insert({
      tenant_id: input.tenantId,
      phone,
      display_name: input.displayName?.trim() || null,
      menuary_user_id: registeredUserId,
      tags: [sourceTag, registrationTag],
    })
    .select("id,menuary_user_id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "customer_create_failed");

  return {
    customerId: data.id,
    menuaryUserId: data.menuary_user_id ?? null,
    registered,
    phone,
  };
}

export async function recordCustomerEvent(input: {
  tenantId: string;
  customerId: string;
  eventKind: string;
  refId?: string | null;
  meta?: Record<string, Json>;
}) {
  await db()
    .from("customer_events")
    .insert({
      tenant_id: input.tenantId,
      customer_id: input.customerId,
      event_kind: input.eventKind,
      ref_id: input.refId ?? null,
      meta: (input.meta ?? {}) as Json,
    });
}
