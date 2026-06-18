import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/lib/database.types";

type Db = SupabaseClient<Database>;

export type CustomerIdentity = {
  customerId: string;
  menuaryUserId: string | null;
  registered: boolean;
  phone: string | null;
  email: string | null;
};

type CustomerRow = {
  id: string;
  tenant_id: string;
  menuary_user_id: string | null;
  phone: string | null;
  email: string | null;
  display_name: string | null;
  language: string | null;
  tags: string[];
  hubrise_customer_id: string | null;
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

const CUSTOMER_COLS = "id,tenant_id,menuary_user_id,phone,email,display_name,language,tags,hubrise_customer_id";

async function findTenantCustomer(tenantId: string, phone: string): Promise<CustomerRow | null> {
  const { data } = await db()
    .from("customers")
    .select(CUSTOMER_COLS)
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .order("menuary_user_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CustomerRow | null) ?? null;
}

async function findTenantCustomerByEmail(tenantId: string, email: string): Promise<CustomerRow | null> {
  const { data } = await db()
    .from("customers")
    .select(CUSTOMER_COLS)
    .eq("tenant_id", tenantId)
    .ilike("email", email)
    .order("menuary_user_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CustomerRow | null) ?? null;
}

async function findTenantCustomerByHubriseId(tenantId: string, hubriseId: string): Promise<CustomerRow | null> {
  const { data } = await db()
    .from("customers")
    .select(CUSTOMER_COLS)
    .eq("tenant_id", tenantId)
    .eq("hubrise_customer_id", hubriseId)
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
      email: existing.email ?? null,
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
    .select("id,menuary_user_id,email")
    .single();
  if (error || !data) throw new Error(error?.message ?? "customer_create_failed");

  return {
    customerId: data.id,
    menuaryUserId: data.menuary_user_id ?? null,
    registered,
    phone,
    email: (data as { email: string | null }).email ?? null,
  };
}

/**
 * Resolve/create customer da ordine HubRise. Match in ordine:
 * 1) hubrise_customer_id, 2) phone normalizzato, 3) email (case-insensitive).
 * Su match: aggiorna i campi mancanti (link hubrise_customer_id, email, phone).
 * Su miss: crea customer con source = "hubrise:<platform>".
 */
export async function resolveHubriseCustomer(input: {
  tenantId: string;
  hubriseCustomerId?: string | null;
  phone?: string | null;
  email?: string | null;
  displayName?: string | null;
  platform?: string | null;
}): Promise<CustomerIdentity | null> {
  const phone = normalizePhone(input.phone);
  const email = input.email?.trim().toLowerCase() || null;
  const hubriseId = input.hubriseCustomerId?.trim() || null;

  if (!phone && !email && !hubriseId) return null;

  const now = new Date().toISOString();
  const source = `hubrise:${input.platform ?? "unknown"}`;

  let existing: CustomerRow | null = null;
  if (hubriseId) existing = await findTenantCustomerByHubriseId(input.tenantId, hubriseId);
  if (!existing && phone) existing = await findTenantCustomer(input.tenantId, phone);
  if (!existing && email) existing = await findTenantCustomerByEmail(input.tenantId, email);

  const registeredUserId =
    existing?.menuary_user_id ?? (phone ? await findRegisteredMenuaryUserByPhone(phone) : null);
  const registered = Boolean(registeredUserId);
  const tagsBase = [`source:hubrise`, input.platform ? `platform:${input.platform}` : null].filter(
    (t): t is string => Boolean(t),
  );

  if (existing) {
    const tags = mergeTags(existing.tags ?? [], tagsBase);
    await db()
      .from("customers")
      .update({
        display_name: existing.display_name ?? input.displayName ?? null,
        phone: existing.phone ?? phone,
        email: existing.email ?? email,
        hubrise_customer_id: existing.hubrise_customer_id ?? hubriseId,
        menuary_user_id: existing.menuary_user_id ?? registeredUserId,
        tags,
        updated_at: now,
      } as never)
      .eq("id", existing.id);
    return {
      customerId: existing.id,
      menuaryUserId: existing.menuary_user_id ?? registeredUserId,
      registered,
      phone: existing.phone ?? phone,
      email: existing.email ?? email,
    };
  }

  const { data, error } = await db()
    .from("customers")
    .insert({
      tenant_id: input.tenantId,
      phone,
      email,
      hubrise_customer_id: hubriseId,
      display_name: input.displayName?.trim() || null,
      menuary_user_id: registeredUserId,
      tags: tagsBase,
      source,
    } as never)
    .select("id,menuary_user_id,phone,email")
    .single();
  if (error || !data) throw new Error(error?.message ?? "customer_create_failed");

  const row = data as { id: string; menuary_user_id: string | null; phone: string | null; email: string | null };
  return {
    customerId: row.id,
    menuaryUserId: row.menuary_user_id ?? null,
    registered,
    phone: row.phone,
    email: row.email,
  };
}

/**
 * Aggiorna un cliente esistente nel CRM tenant dai dati arrivati con un evento customer/update HubRise.
 * Cerca prima per hubrise_customer_id, poi per email come fallback (caso in cui il customer è stato
 * creato manualmente o da web prima di apparire su HubRise). No-op se nessun match.
 */
export async function updateExistingHubriseCustomer(input: {
  tenantId: string;
  hubriseCustomerId: string;
  phone?: string | null;
  email?: string | null;
  displayName?: string | null;
}): Promise<{ updated: boolean; customerId?: string }> {
  const phone = normalizePhone(input.phone);
  const email = input.email?.trim().toLowerCase() || null;

  let existing = await findTenantCustomerByHubriseId(input.tenantId, input.hubriseCustomerId);
  if (!existing && email) existing = await findTenantCustomerByEmail(input.tenantId, email);
  if (!existing) return { updated: false };

  await db()
    .from("customers")
    .update({
      // Manteniamo i valori più recenti senza sovrascrivere con stringhe vuote.
      display_name: input.displayName?.trim() || existing.display_name,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      hubrise_customer_id: existing.hubrise_customer_id ?? input.hubriseCustomerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  return { updated: true, customerId: existing.id };
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
