import "server-only";

import { createHash } from "crypto";
import { hasAdminPermission, isSiteadminRole, type SiteadminRole } from "@/lib/admin-permissions";
import { sendWebPushToSiteadmin } from "@/lib/push/send";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/database.types";

export type PlatformErrorStatus = "new" | "triage" | "in_progress" | "resolved" | "ignored";
export type PlatformErrorSeverity = "debug" | "info" | "warning" | "error" | "critical";
export type PlatformErrorSource =
  | "api"
  | "edge_function"
  | "android_app"
  | "cloud_print"
  | "webhook"
  | "cron"
  | "gestione"
  | "client"
  | "unknown";
export type PlatformErrorEnvironment = "production" | "preview" | "development";

export type PlatformErrorEvent = {
  id: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  status: PlatformErrorStatus;
  severity: PlatformErrorSeverity;
  source: PlatformErrorSource;
  environment: PlatformErrorEnvironment;
  tenant_id: string | null;
  location_id: string | null;
  flow: string;
  operation: string | null;
  title: string;
  message: string;
  error_code: string | null;
  http_status: number | null;
  fingerprint: string;
  occurrence_count: number;
  request_id: string | null;
  actor_type: string | null;
  actor_id: string | null;
  device_id: string | null;
  order_id: string | null;
  external_ref: string | null;
  stack: string | null;
  metadata: Json;
  assigned_to_siteadmin_id: string | null;
};

export type PlatformErrorInput = {
  severity?: PlatformErrorSeverity;
  source?: PlatformErrorSource;
  environment?: PlatformErrorEnvironment;
  tenantId?: string | null;
  locationId?: string | null;
  flow: string;
  operation?: string | null;
  title: string;
  message?: string | null;
  errorCode?: string | null;
  httpStatus?: number | null;
  fingerprint?: string | null;
  requestId?: string | null;
  actorType?: string | null;
  actorId?: string | null;
  deviceId?: string | null;
  orderId?: string | null;
  externalRef?: string | null;
  stack?: string | null;
  metadata?: Json;
};

type PlatformErrorInsert = {
  severity: PlatformErrorSeverity;
  source: PlatformErrorSource;
  environment: PlatformErrorEnvironment;
  tenant_id: string | null;
  location_id: string | null;
  flow: string;
  operation: string | null;
  title: string;
  message: string;
  error_code: string | null;
  http_status: number | null;
  fingerprint: string;
  request_id: string | null;
  actor_type: string | null;
  actor_id: string | null;
  device_id: string | null;
  order_id: string | null;
  external_ref: string | null;
  stack: string | null;
  metadata: Json;
};

const SELECT_COLUMNS =
  "id,created_at,updated_at,last_seen_at,resolved_at,status,severity,source,environment,tenant_id,location_id,flow,operation,title,message,error_code,http_status,fingerprint,occurrence_count,request_id,actor_type,actor_id,device_id,order_id,external_ref,stack,metadata,assigned_to_siteadmin_id";

function environmentFromNodeEnv(): PlatformErrorEnvironment {
  if (process.env.VERCEL_ENV === "preview") return "preview";
  if (process.env.NODE_ENV === "development") return "development";
  return "production";
}

function normalizeText(value: string | null | undefined, fallback = "") {
  return (value ?? fallback).trim();
}

function buildFingerprint(input: PlatformErrorInput) {
  const raw = [
    input.environment ?? environmentFromNodeEnv(),
    input.source ?? "unknown",
    input.tenantId ?? "",
    input.flow,
    input.operation ?? "",
    input.errorCode ?? "",
    input.httpStatus ?? "",
    input.title,
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 40);
}

function toInsert(input: PlatformErrorInput): PlatformErrorInsert {
  return {
    severity: input.severity ?? "error",
    source: input.source ?? "unknown",
    environment: input.environment ?? environmentFromNodeEnv(),
    tenant_id: input.tenantId ?? null,
    location_id: input.locationId ?? null,
    flow: normalizeText(input.flow, "unknown"),
    operation: normalizeText(input.operation) || null,
    title: normalizeText(input.title, "Errore operativo"),
    message: normalizeText(input.message),
    error_code: normalizeText(input.errorCode) || null,
    http_status: input.httpStatus ?? null,
    fingerprint: normalizeText(input.fingerprint) || buildFingerprint(input),
    request_id: normalizeText(input.requestId) || null,
    actor_type: normalizeText(input.actorType) || null,
    actor_id: normalizeText(input.actorId) || null,
    device_id: normalizeText(input.deviceId) || null,
    order_id: normalizeText(input.orderId) || null,
    external_ref: normalizeText(input.externalRef) || null,
    stack: normalizeText(input.stack) || null,
    metadata: input.metadata ?? {},
  };
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return String(error);
}

function errorStack(error: unknown) {
  return error instanceof Error ? error.stack ?? null : null;
}

function errorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const value = (error as { code: unknown }).code;
    return typeof value === "string" || typeof value === "number" ? String(value) : null;
  }
  return null;
}

function requestMetadata(req: Request): Record<string, Json> {
  const headers = req.headers;
  let url: URL | null = null;
  try {
    url = new URL(req.url);
  } catch {
    url = null;
  }
  return {
    method: req.method,
    url: req.url,
    path: url?.pathname ?? null,
    search: url?.search ?? null,
    host: headers.get("host"),
    referer: headers.get("referer"),
    origin: headers.get("origin"),
    userAgent: headers.get("user-agent"),
    forwardedFor: headers.get("x-forwarded-for"),
    realIp: headers.get("x-real-ip"),
    country: headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry"),
    requestId: headers.get("x-request-id") ?? headers.get("x-vercel-id"),
  };
}

async function notifyErrorEvent(event: PlatformErrorEvent, insertedOrReopened: boolean) {
  if (!insertedOrReopened) return;
  if (event.severity === "debug" || event.severity === "info") return;

  const svc = createSupabaseServiceClient();
  if (!svc) return;
  const { data } = await svc
    .from("siteadmin")
    .select("id, role")
    .eq("enabled", true);
  const admins = (data ?? []) as Array<{ id: string; role: SiteadminRole | string | null }>;
  const recipients = admins.filter((admin) =>
    isSiteadminRole(admin.role) && hasAdminPermission(admin.role, "errors:view"),
  );
  await Promise.all(
    recipients.map((admin) =>
      sendWebPushToSiteadmin(admin.id, {
        title: event.severity === "critical" ? "Errore critico Menuary" : "Nuovo errore operativo",
        body: `${event.title}${event.tenant_id ? ` · ${event.tenant_id}` : ""}`,
        url: "/admin/errori",
        tag: `platform-error-${event.id}`,
      }).catch(() => 0),
    ),
  );
}

export async function recordPlatformError(input: PlatformErrorInput): Promise<PlatformErrorEvent | null> {
  const admin = createSupabaseAdminClient();
  const row = toInsert(input);

  type ErrorTable = {
    from: (table: "platform_error_events") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: PlatformErrorEvent | null; error: { message: string } | null }>;
          };
        };
      };
      insert: (value: PlatformErrorInsert) => {
        select: (columns: string) => {
          single: () => Promise<{ data: PlatformErrorEvent | null; error: { message: string } | null }>;
        };
      };
      update: (value: Partial<PlatformErrorEvent>) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => {
            single: () => Promise<{ data: PlatformErrorEvent | null; error: { message: string } | null }>;
          };
        };
      };
    };
  };

  const table = (admin as unknown as ErrorTable).from("platform_error_events");
  const existing = await table
    .select(SELECT_COLUMNS)
    .eq("environment", row.environment)
    .eq("fingerprint", row.fingerprint)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);

  if (existing.data) {
    const reopened = existing.data.status === "resolved" || existing.data.status === "ignored";
    const updated = await table
      .update({
        ...row,
        status: reopened ? "new" : existing.data.status,
        occurrence_count: existing.data.occurrence_count + 1,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: null,
      } as Partial<PlatformErrorEvent>)
      .eq("id", existing.data.id)
      .select(SELECT_COLUMNS)
      .single();
    if (updated.error) throw new Error(updated.error.message);
    if (updated.data) void notifyErrorEvent(updated.data, reopened).catch(() => undefined);
    return updated.data;
  }

  const inserted = await table.insert(row).select(SELECT_COLUMNS).single();
  if (inserted.error) throw new Error(inserted.error.message);
  if (inserted.data) void notifyErrorEvent(inserted.data, true).catch(() => undefined);
  return inserted.data;
}

export async function recordPlatformErrorFromRequest(
  req: Request,
  input: Omit<PlatformErrorInput, "message" | "stack" | "errorCode" | "metadata"> & {
    error: unknown;
    message?: string | null;
    errorCode?: string | null;
    metadata?: Record<string, Json>;
  },
): Promise<PlatformErrorEvent | null> {
  const message = input.message ?? errorMessage(input.error);
  return recordPlatformError({
    ...input,
    message,
    errorCode: input.errorCode ?? errorCode(input.error),
    stack: errorStack(input.error),
    requestId: req.headers.get("x-request-id") ?? req.headers.get("x-vercel-id"),
    metadata: {
      ...requestMetadata(req),
      ...(input.metadata ?? {}),
    },
  });
}

export async function listPlatformErrors(): Promise<PlatformErrorEvent[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await (admin as unknown as {
    from: (table: "platform_error_events") => {
      select: (columns: string) => {
        order: (column: string, options: { ascending: boolean }) => {
          limit: (count: number) => Promise<{ data: PlatformErrorEvent[] | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("platform_error_events")
    .select(SELECT_COLUMNS)
    .order("last_seen_at", { ascending: false })
    .limit(250);

  if (error) {
    if (/platform_error_events/.test(error.message)) return [];
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function updatePlatformError(
  id: string,
  patch: {
    status?: PlatformErrorStatus;
    severity?: PlatformErrorSeverity;
    assigned_to_siteadmin_id?: string | null;
  },
): Promise<PlatformErrorEvent> {
  const admin = createSupabaseAdminClient();
  const next: Record<string, unknown> = {
    ...patch,
    updated_at: new Date().toISOString(),
  };
  if (patch.status === "resolved" || patch.status === "ignored") {
    next.resolved_at = new Date().toISOString();
  }
  if (patch.status === "new" || patch.status === "triage" || patch.status === "in_progress") {
    next.resolved_at = null;
  }

  const { data, error } = await (admin as unknown as {
    from: (table: "platform_error_events") => {
      update: (value: Record<string, unknown>) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => {
            single: () => Promise<{ data: PlatformErrorEvent | null; error: { message: string } | null }>;
          };
        };
      };
    };
  })
    .from("platform_error_events")
    .update(next)
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Evento non trovato");
  return data;
}
