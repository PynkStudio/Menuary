import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { recordPlatformError, type PlatformErrorInput } from "@/lib/platform-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasIngestToken(request: Request) {
  const expected = process.env.SUPPORT_INGEST_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}` || request.headers.get("x-support-ingest-token") === expected;
}

async function hasSiteadminAccess() {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(data?.role) && hasAdminPermission(data.role, "errors:manage");
}

function sanitizePayload(payload: unknown): PlatformErrorInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  if (typeof value.flow !== "string" || typeof value.title !== "string") return null;
  return {
    severity: typeof value.severity === "string" ? value.severity as PlatformErrorInput["severity"] : undefined,
    source: typeof value.source === "string" ? value.source as PlatformErrorInput["source"] : undefined,
    environment: typeof value.environment === "string" ? value.environment as PlatformErrorInput["environment"] : undefined,
    tenantId: typeof value.tenantId === "string" ? value.tenantId : null,
    locationId: typeof value.locationId === "string" ? value.locationId : null,
    flow: value.flow,
    operation: typeof value.operation === "string" ? value.operation : null,
    title: value.title,
    message: typeof value.message === "string" ? value.message : null,
    errorCode: typeof value.errorCode === "string" ? value.errorCode : null,
    httpStatus: typeof value.httpStatus === "number" ? value.httpStatus : null,
    fingerprint: typeof value.fingerprint === "string" ? value.fingerprint : null,
    requestId: typeof value.requestId === "string" ? value.requestId : null,
    actorType: typeof value.actorType === "string" ? value.actorType : null,
    actorId: typeof value.actorId === "string" ? value.actorId : null,
    deviceId: typeof value.deviceId === "string" ? value.deviceId : null,
    orderId: typeof value.orderId === "string" ? value.orderId : null,
    externalRef: typeof value.externalRef === "string" ? value.externalRef : null,
    stack: typeof value.stack === "string" ? value.stack : null,
    metadata: value.metadata && typeof value.metadata === "object" ? value.metadata as PlatformErrorInput["metadata"] : {},
  };
}

export async function POST(request: Request) {
  if (!hasIngestToken(request) && !await hasSiteadminAccess()) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const payload = sanitizePayload(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ error: "Payload non valido: flow e title sono obbligatori." }, { status: 400 });
  }

  const event = await recordPlatformError(payload);
  return NextResponse.json({ event }, { status: 201 });
}
