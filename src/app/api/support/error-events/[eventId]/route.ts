import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { updatePlatformError, type PlatformErrorSeverity, type PlatformErrorStatus } from "@/lib/platform-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUSES: PlatformErrorStatus[] = ["new", "triage", "in_progress", "resolved", "ignored"];
const SEVERITIES: PlatformErrorSeverity[] = ["debug", "info", "warning", "error", "critical"];

async function getSiteadmin() {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("siteadmin")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  if (!data || !isSiteadminRole(data.role) || !hasAdminPermission(data.role, "errors:manage")) return null;
  return data;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const siteadmin = await getSiteadmin();
  if (!siteadmin) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const patch: Parameters<typeof updatePlatformError>[1] = {};

  if (typeof body.status === "string" && STATUSES.includes(body.status as PlatformErrorStatus)) {
    patch.status = body.status as PlatformErrorStatus;
  }
  if (typeof body.severity === "string" && SEVERITIES.includes(body.severity as PlatformErrorSeverity)) {
    patch.severity = body.severity as PlatformErrorSeverity;
  }
  if (body.assignToMe === true) {
    patch.assigned_to_siteadmin_id = siteadmin.id;
  } else if (body.assigned_to_siteadmin_id === null || typeof body.assigned_to_siteadmin_id === "string") {
    patch.assigned_to_siteadmin_id = body.assigned_to_siteadmin_id;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nessuna modifica valida." }, { status: 400 });
  }

  const { eventId } = await params;
  const event = await updatePlatformError(eventId, patch);
  return NextResponse.json({ event });
}
