import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/lib/database.types";

export type AiPhonePauseReason =
  | "manual"
  | "busy"
  | "sold_out"
  | "kitchen_closed"
  | "custom"
  | null;

export type AiPhoneOperationalControl = {
  accepting: boolean;
  disabledUntil: string | null;
  reason: AiPhonePauseReason;
};

export type AiPhoneQuickSettings = {
  acceptNewOrders: AiPhoneOperationalControl;
  acceptReservations: AiPhoneOperationalControl;
  answerAfterHours: boolean;
  allowHumanTransfer: boolean;
  askAllergiesForOrders: boolean;
  suggestAlternatives: boolean;
  collectMarketingConsent: boolean;
  notesForAssistant: string;
};

/**
 * Metodi di pagamento accettati per ordini gestiti dall'assistente AI.
 * - online_only: il pagamento avviene sempre tramite link inviato via SMS/WA.
 *   L'agente comunica al cliente che riceverà il link.
 * - on_site_only: pagamento solo al ritiro / alla consegna. L'agente lo comunica.
 * - both: l'agente chiede al cliente quale metodo preferisce.
 */
export type AiPaymentMethodsPolicy = "online_only" | "on_site_only" | "both";

export type ChannelPaymentControls = {
  enabled: boolean;
  requireForTakeaway: boolean;
  requireForDelivery: boolean;
  /** Canale primario per inviare link pagamento/riepilogo. Default "whatsapp". */
  defaultChannel: "sms" | "whatsapp";
  /** Canale di fallback se il primario fallisce (es. WA: utente non ha WA installato). null = nessun fallback. */
  fallbackChannel: "sms" | "whatsapp" | null;
  sendAutomatically: boolean;
  /** Metodi di pagamento offerti al cliente dall'assistente AI. Default "on_site_only" se Stripe non collegato. */
  acceptedMethods: AiPaymentMethodsPolicy;
};

export type AiPhoneSettings = {
  tenantId: string;
  enabled: boolean;
  phoneNumber: string;
  retellAgentId: string;
  retellPhoneNumberId: string;
  greetingMessage: string;
  systemPrompt: string;
  handoffPhone: string;
  language: string;
  voiceLabel: string;
  humanTransferEnabled: boolean;
  confirmBeforeWrite: boolean;
  menuSyncEnabled: boolean;
  includeSpecialHours: boolean;
  afterHoursMode: "answer_and_collect" | "answer_info_only" | "closed_message";
  quickSettings: AiPhoneQuickSettings;
  paymentControls: ChannelPaymentControls;
  updatedAt: string | null;
};

type Db = SupabaseClient<Database>;

type AiPhoneSettingsRow = {
  tenant_id: string;
  enabled: boolean;
  phone_number: string | null;
  retell_agent_id: string | null;
  retell_phone_number_id: string | null;
  greeting_message: string | null;
  system_prompt: string | null;
  handoff_phone: string | null;
  language: string | null;
  voice_label: string | null;
  human_transfer_enabled: boolean | null;
  confirm_before_write: boolean | null;
  menu_sync_enabled: boolean | null;
  include_special_hours: boolean | null;
  after_hours_mode: string | null;
  order_controls: Json | null;
  reservation_controls: Json | null;
  payment_controls: Json | null;
  quick_settings: Json | null;
  updated_at: string | null;
};

export type AiPhoneSettingsPatch = Partial<
  Omit<AiPhoneSettings, "tenantId" | "quickSettings" | "updatedAt">
> & {
  quickSettings?: Partial<AiPhoneQuickSettings>;
};

const DEFAULT_CONTROL: AiPhoneOperationalControl = {
  accepting: true,
  disabledUntil: null,
  reason: null,
};

function db(): Db {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client;
}

function asObject(value: Json | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeControl(value: unknown): AiPhoneOperationalControl {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
  const disabledUntil = typeof raw.disabledUntil === "string" && raw.disabledUntil
    ? raw.disabledUntil
    : null;
  const accepting =
    typeof raw.accepting === "boolean"
      ? raw.accepting
      : disabledUntil
        ? new Date(disabledUntil).getTime() <= Date.now()
        : true;
  const reason = typeof raw.reason === "string" ? raw.reason as AiPhonePauseReason : null;
  return { accepting, disabledUntil, reason };
}

function isControlAccepting(control: AiPhoneOperationalControl, now = new Date()): boolean {
  if (control.accepting) return true;
  if (!control.disabledUntil) return false;
  return new Date(control.disabledUntil).getTime() <= now.getTime();
}

export function isAiPhoneControlAccepting(control: AiPhoneOperationalControl, now = new Date()): boolean {
  return isControlAccepting(control, now);
}

function normalizeQuickSettings(row: AiPhoneSettingsRow | null): AiPhoneQuickSettings {
  const quick = asObject(row?.quick_settings);
  return {
    acceptNewOrders: normalizeControl(row?.order_controls ?? quick.acceptNewOrders),
    acceptReservations: normalizeControl(row?.reservation_controls ?? quick.acceptReservations),
    answerAfterHours:
      typeof quick.answerAfterHours === "boolean"
        ? quick.answerAfterHours
        : row?.after_hours_mode !== "closed_message",
    allowHumanTransfer:
      typeof quick.allowHumanTransfer === "boolean"
        ? quick.allowHumanTransfer
        : row?.human_transfer_enabled !== false,
    askAllergiesForOrders:
      typeof quick.askAllergiesForOrders === "boolean" ? quick.askAllergiesForOrders : true,
    suggestAlternatives:
      typeof quick.suggestAlternatives === "boolean" ? quick.suggestAlternatives : true,
    collectMarketingConsent:
      typeof quick.collectMarketingConsent === "boolean" ? quick.collectMarketingConsent : false,
    notesForAssistant: typeof quick.notesForAssistant === "string" ? quick.notesForAssistant : "",
  };
}

function normalizePaymentControls(row: AiPhoneSettingsRow | null): ChannelPaymentControls {
  const raw = asObject(row?.payment_controls);
  const acceptedMethodsRaw = raw.acceptedMethods;
  const acceptedMethods: AiPaymentMethodsPolicy =
    acceptedMethodsRaw === "online_only" ||
    acceptedMethodsRaw === "on_site_only" ||
    acceptedMethodsRaw === "both"
      ? acceptedMethodsRaw
      : "on_site_only";
  // Default canale primario: WhatsApp (più affidabile + interattivo). Fallback automatico: SMS.
  const defaultChannel: ChannelPaymentControls["defaultChannel"] =
    raw.defaultChannel === "sms" ? "sms" : "whatsapp";
  let fallbackChannel: ChannelPaymentControls["fallbackChannel"];
  if (raw.fallbackChannel === null) {
    fallbackChannel = null;
  } else if (raw.fallbackChannel === "whatsapp" || raw.fallbackChannel === "sms") {
    fallbackChannel = raw.fallbackChannel;
  } else {
    // Default coerente col primario: se primario=WA, fallback=SMS, e viceversa.
    fallbackChannel = defaultChannel === "whatsapp" ? "sms" : "whatsapp";
  }
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : false,
    requireForTakeaway: typeof raw.requireForTakeaway === "boolean" ? raw.requireForTakeaway : false,
    requireForDelivery: typeof raw.requireForDelivery === "boolean" ? raw.requireForDelivery : false,
    defaultChannel,
    fallbackChannel,
    sendAutomatically: typeof raw.sendAutomatically === "boolean" ? raw.sendAutomatically : true,
    acceptedMethods,
  };
}

function rowToSettings(tenantId: string, row: AiPhoneSettingsRow | null): AiPhoneSettings {
  const quickSettings = normalizeQuickSettings(row);
  const paymentControls = normalizePaymentControls(row);
  return {
    tenantId,
    enabled: row?.enabled ?? true,
    phoneNumber: row?.phone_number ?? "",
    retellAgentId: row?.retell_agent_id ?? "",
    retellPhoneNumberId: row?.retell_phone_number_id ?? "",
    greetingMessage:
      row?.greeting_message ??
      "Ciao, sono l'assistente del locale. Dimmi pure come posso aiutarti.",
    systemPrompt:
      row?.system_prompt ??
      "Rispondi in modo chiaro e cordiale. Usa menu, prezzi, orari e regole operative dal contesto. Conferma sempre i dati prima di creare ordini o prenotazioni.",
    handoffPhone: row?.handoff_phone ?? "",
    language: row?.language ?? "it-IT",
    voiceLabel: row?.voice_label ?? "",
    humanTransferEnabled: row?.human_transfer_enabled ?? true,
    confirmBeforeWrite: row?.confirm_before_write ?? true,
    menuSyncEnabled: row?.menu_sync_enabled ?? true,
    includeSpecialHours: row?.include_special_hours ?? true,
    afterHoursMode: (
      row?.after_hours_mode === "answer_info_only" || row?.after_hours_mode === "closed_message"
        ? row.after_hours_mode
        : "answer_and_collect"
    ),
    quickSettings,
    paymentControls,
    updatedAt: row?.updated_at ?? null,
  };
}

function toDbPatch(patch: AiPhoneSettingsPatch, current: AiPhoneSettings) {
  const quickSettings = { ...current.quickSettings, ...patch.quickSettings };
  const paymentControls = patch.paymentControls ?? current.paymentControls;
  return {
    enabled: patch.enabled ?? current.enabled,
    phone_number: patch.phoneNumber ?? current.phoneNumber,
    retell_agent_id: patch.retellAgentId ?? current.retellAgentId,
    retell_phone_number_id: patch.retellPhoneNumberId ?? current.retellPhoneNumberId,
    greeting_message: patch.greetingMessage ?? current.greetingMessage,
    system_prompt: patch.systemPrompt ?? current.systemPrompt,
    handoff_phone: patch.handoffPhone ?? current.handoffPhone,
    language: patch.language ?? current.language,
    voice_label: patch.voiceLabel ?? current.voiceLabel,
    human_transfer_enabled: patch.humanTransferEnabled ?? current.humanTransferEnabled,
    confirm_before_write: patch.confirmBeforeWrite ?? current.confirmBeforeWrite,
    menu_sync_enabled: patch.menuSyncEnabled ?? current.menuSyncEnabled,
    include_special_hours: patch.includeSpecialHours ?? current.includeSpecialHours,
    after_hours_mode: patch.afterHoursMode ?? current.afterHoursMode,
    order_controls: quickSettings.acceptNewOrders as unknown as Json,
    reservation_controls: quickSettings.acceptReservations as unknown as Json,
    payment_controls: paymentControls as unknown as Json,
    quick_settings: quickSettings as unknown as Json,
    updated_at: new Date().toISOString(),
  };
}

export async function resolveRetellTenantByPhone(calledNumber: string): Promise<string | null> {
  const normalized = calledNumber.trim();
  if (!normalized) return null;
  const { data } = await (db() as unknown as {
    from: (table: "tenant_ai_phone_settings") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: { tenant_id: string } | null }>;
        };
      };
    };
  })
    .from("tenant_ai_phone_settings")
    .select("tenant_id")
    .eq("phone_number", normalized)
    .maybeSingle();
  return data?.tenant_id ?? null;
}

export async function getAiPhoneSettings(tenantId: string): Promise<AiPhoneSettings> {
  const { data } = await (db() as unknown as {
    from: (table: "tenant_ai_phone_settings") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: AiPhoneSettingsRow | null }>;
        };
      };
    };
  })
    .from("tenant_ai_phone_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return rowToSettings(tenantId, data);
}

export async function listAiPhoneSettings(): Promise<AiPhoneSettings[]> {
  const { data: tenants } = await db()
    .from("tenants")
    .select("id")
    .order("id", { ascending: true });
  const tenantIds = (tenants ?? []).map((tenant) => tenant.id);

  const { data: rows } = await (db() as unknown as {
    from: (table: "tenant_ai_phone_settings") => {
      select: (columns: string) => Promise<{ data: AiPhoneSettingsRow[] | null }>;
    };
  })
    .from("tenant_ai_phone_settings")
    .select("*");
  const byTenant = new Map((rows ?? []).map((row) => [row.tenant_id, row]));
  return tenantIds.map((tenantId) => rowToSettings(tenantId, byTenant.get(tenantId) ?? null));
}

export async function upsertAiPhoneSettings(
  tenantId: string,
  patch: AiPhoneSettingsPatch,
): Promise<AiPhoneSettings> {
  const current = await getAiPhoneSettings(tenantId);
  const dbPatch = toDbPatch(patch, current);
  const { data, error } = await (db() as unknown as {
    from: (table: "tenant_ai_phone_settings") => {
      upsert: (
        row: Record<string, unknown>,
        opts: { onConflict: string },
      ) => {
        select: (columns: string) => {
          single: () => Promise<{ data: AiPhoneSettingsRow | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("tenant_ai_phone_settings")
    .upsert({ tenant_id: tenantId, ...dbPatch }, { onConflict: "tenant_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToSettings(tenantId, data);
}

export function buildPauseUntil(mode: "accept" | "30m" | "day-end" | "custom" | "manual", customUntil?: string | null) {
  const now = new Date();
  if (mode === "accept") return DEFAULT_CONTROL;
  if (mode === "30m") return { accepting: false, disabledUntil: new Date(now.getTime() + 30 * 60_000).toISOString(), reason: "busy" as const };
  if (mode === "day-end") {
    const end = new Date(now);
    end.setHours(23, 59, 0, 0);
    return { accepting: false, disabledUntil: end.toISOString(), reason: "busy" as const };
  }
  if (mode === "custom" && customUntil) {
    return { accepting: false, disabledUntil: new Date(customUntil).toISOString(), reason: "custom" as const };
  }
  return { accepting: false, disabledUntil: null, reason: "manual" as const };
}
