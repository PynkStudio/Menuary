import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/sender";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/lib/supabase/types";

type Db = SupabaseClient<Database>;

export type WhatsappSessionStatus = "not_configured" | "pending_qr" | "connected" | "offline" | "error";
export type WhatsappSessionKind = "tenant_public";

export type WhatsappSessionRow = {
  id: string;
  tenant_id: string;
  session_kind: WhatsappSessionKind;
  session_id: string;
  phone_e164: string | null;
  status: WhatsappSessionStatus;
  qr_data_url: string | null;
  qr_updated_at: string | null;
  last_heartbeat_at: string | null;
  last_connected_at: string | null;
  last_error: string | null;
  alert_email_sent_at: string | null;
  alert_reason: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type WhatsappSessionUpdate = {
  tenantId: string;
  sessionKind?: WhatsappSessionKind;
  sessionId?: string;
  phoneE164?: string | null;
  status: Exclude<WhatsappSessionStatus, "not_configured">;
  qrDataUrl?: string | null;
  lastError?: string | null;
  metadata?: Record<string, unknown>;
};

const ALERT_THROTTLE_MS = 60 * 60_000;
const STALE_HEARTBEAT_MS = 3 * 60_000;

function db(): Db {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client;
}

function supportEmailForVertical(vertical: string | null | undefined) {
  return vertical === "services" ? "support@bizery.it" : "support@menuary.it";
}

function sessionSelect() {
  return "id,tenant_id,session_kind,session_id,phone_e164,status,qr_data_url,qr_updated_at,last_heartbeat_at,last_connected_at,last_error,alert_email_sent_at,alert_reason,metadata,created_at,updated_at";
}

export async function getTenantWhatsappSession(tenantId: string): Promise<WhatsappSessionRow | null> {
  const { data, error } = await (db() as unknown as {
    from: (table: "tenant_whatsapp_sessions") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: WhatsappSessionRow | null; error: { message: string } | null }>;
          };
        };
      };
    };
  })
    .from("tenant_whatsapp_sessions")
    .select(sessionSelect())
    .eq("tenant_id", tenantId)
    .eq("session_kind", "tenant_public")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function upsertTenantWhatsappSession(input: WhatsappSessionUpdate): Promise<WhatsappSessionRow> {
  const now = new Date().toISOString();
  const current = await getTenantWhatsappSession(input.tenantId).catch(() => null);
  const status = input.status;

  const row = {
    tenant_id: input.tenantId,
    session_kind: input.sessionKind ?? "tenant_public",
    session_id: input.sessionId ?? current?.session_id ?? `tenant-${input.tenantId}`,
    phone_e164: input.phoneE164 ?? current?.phone_e164 ?? null,
    status,
    qr_data_url: input.qrDataUrl ?? (status === "connected" ? null : current?.qr_data_url ?? null),
    qr_updated_at: input.qrDataUrl ? now : current?.qr_updated_at ?? null,
    last_heartbeat_at: now,
    last_connected_at: status === "connected" ? now : current?.last_connected_at ?? null,
    last_error: status === "error" || status === "offline" ? input.lastError ?? current?.last_error ?? null : null,
    metadata: (input.metadata ?? current?.metadata ?? {}) as Json,
    updated_at: now,
  };

  const { data, error } = await (db() as unknown as {
    from: (table: "tenant_whatsapp_sessions") => {
      upsert: (
        row: Record<string, unknown>,
        opts: { onConflict: string },
      ) => {
        select: (columns: string) => {
          single: () => Promise<{ data: WhatsappSessionRow | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("tenant_whatsapp_sessions")
    .upsert(row, { onConflict: "tenant_id,session_kind" })
    .select(sessionSelect())
    .single();

  if (error || !data) throw new Error(error?.message ?? "whatsapp_session_upsert_failed");
  if (status === "offline" || status === "error") {
    await maybeSendWhatsappSessionAlert(data, status === "offline" ? "offline" : "error");
  }
  return data;
}

async function tenantInfo(tenantId: string): Promise<{ name: string; vertical: string; adminEmails: string[] }> {
  const svc = db();
  const [{ data: tenant }, { data: admins }] = await Promise.all([
    svc.from("tenants").select("name,label,vertical").eq("id", tenantId).maybeSingle(),
    svc.from("tenantadmin").select("email").eq("tenant_id", tenantId).eq("enabled", true),
  ]);

  return {
    name: (tenant?.name || tenant?.label || tenantId) as string,
    vertical: (tenant?.vertical || "food") as string,
    adminEmails: Array.from(new Set((admins ?? []).map((row) => row.email).filter(Boolean))),
  };
}

export async function maybeSendWhatsappSessionAlert(session: WhatsappSessionRow, reason: "offline" | "error" | "stale") {
  const lastAlert = session.alert_email_sent_at ? new Date(session.alert_email_sent_at).getTime() : 0;
  const alreadySentForReason = session.alert_reason === reason && Date.now() - lastAlert < ALERT_THROTTLE_MS;
  if (alreadySentForReason) return { sent: false, reason: "throttled" as const };

  const info = await tenantInfo(session.tenant_id);
  const supportEmail = supportEmailForVertical(info.vertical);
  const recipients = Array.from(new Set([supportEmail, ...info.adminEmails]));
  if (!recipients.length) return { sent: false, reason: "no_recipients" as const };

  const reasonLabel =
    reason === "stale"
      ? "non invia heartbeat"
      : reason === "error"
        ? "ha segnalato un errore"
        : "risulta offline";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#141010">
      <h2>WhatsApp AI non operativo</h2>
      <p>La sessione WhatsApp pubblica del tenant <strong>${info.name}</strong> (${session.tenant_id}) ${reasonLabel}.</p>
      <ul>
        <li>Sessione: <code>${session.session_id}</code></li>
        <li>Stato: <strong>${session.status}</strong></li>
        <li>Ultimo heartbeat: ${session.last_heartbeat_at ?? "mai"}</li>
        ${session.last_error ? `<li>Errore: ${session.last_error}</li>` : ""}
      </ul>
      <p>Apri il pannello gestione del tenant e verifica il QR/stato nella sezione Telefono e WhatsApp.</p>
    </div>
  `;

  const result = await sendEmail({
    to: recipients,
    subject: `[WhatsApp AI] Sessione non operativa - ${info.name}`,
    html,
    tenantId: session.tenant_id,
  });

  if (result.ok) {
    await (db() as unknown as {
      from: (table: "tenant_whatsapp_sessions") => {
        update: (row: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<unknown>;
        };
      };
    })
      .from("tenant_whatsapp_sessions")
      .update({
        alert_email_sent_at: new Date().toISOString(),
        alert_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
    return { sent: true as const };
  }

  return { sent: false as const, reason: result.error };
}

export async function alertStaleWhatsappSessions() {
  const threshold = new Date(Date.now() - STALE_HEARTBEAT_MS).toISOString();
  const { data } = await (db() as unknown as {
    from: (table: "tenant_whatsapp_sessions") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          in: (column: string, values: string[]) => {
            or: (filter: string) => Promise<{ data: WhatsappSessionRow[] | null }>;
          };
        };
      };
    };
  })
    .from("tenant_whatsapp_sessions")
    .select(sessionSelect())
    .eq("session_kind", "tenant_public")
    .in("status", ["connected", "pending_qr"])
    .or(`last_heartbeat_at.is.null,last_heartbeat_at.lt.${threshold}`);

  const alerted: string[] = [];
  for (const session of data ?? []) {
    await maybeSendWhatsappSessionAlert({ ...session, status: "offline" }, "stale");
    alerted.push(session.tenant_id);
  }
  return alerted;
}
