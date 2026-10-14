import type { PynkMcpContext } from "./context";

export type McpRateKind = "read" | "write" | "send";
const LIMITS: Record<McpRateKind, { max: number; seconds: number }> = {
  read: { max: 300, seconds: 3600 }, write: { max: 100, seconds: 3600 }, send: { max: 30, seconds: 3600 },
};

function redact(args: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (/body|html|token|secret|password/i.test(key)) out[key] = "[redacted]";
    else if (typeof value === "string" && value.length > 300) out[key] = `${value.slice(0, 300)}…`;
    else out[key] = value;
  }
  return out;
}

export async function beginMcpAudit(ctx: PynkMcpContext, tool: string, args: Record<string, unknown>, requestId?: string) {
  const started = Date.now();
  const { data } = await ctx.service.from("pynkstudio_mcp_audit_log").insert({ token_id: ctx.auth.tokenId, user_id: ctx.auth.userId, tool, arguments: redact(args), outcome: "pending", client_request_id: requestId ?? null }).select("id").maybeSingle();
  return { id: data?.id as string | undefined, started };
}

export async function finishMcpAudit(ctx: PynkMcpContext, audit: { id?: string; started: number }, outcome: "ok" | "error" | "denied", data?: unknown, error?: string, targetId?: string) {
  if (!audit.id) return;
  await ctx.service.from("pynkstudio_mcp_audit_log").update({ outcome, result: outcome === "ok" ? data ?? null : null, error: error ?? null, target_id: targetId ?? null, duration_ms: Date.now() - audit.started, completed_at: new Date().toISOString() }).eq("id", audit.id);
}

export async function previousMcpResult(ctx: PynkMcpContext, tool: string, requestId?: string) {
  if (!requestId) return null;
  const { data } = await ctx.service.from("pynkstudio_mcp_audit_log").select("result,target_id").eq("token_id", ctx.auth.tokenId).eq("tool", tool).eq("client_request_id", requestId).eq("outcome", "ok").maybeSingle();
  return data ?? null;
}

export async function consumeMcpLimit(ctx: PynkMcpContext, kind: McpRateKind) {
  const limit = LIMITS[kind];
  const { data, error } = await ctx.service.rpc("consume_rate_limit", { p_bucket: `pynk-mcp:${kind}`, p_identifier: ctx.auth.tokenId, p_max_requests: limit.max, p_window_seconds: limit.seconds });
  if (error) return true;
  return data !== false;
}
