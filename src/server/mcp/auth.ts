import { createHash, createHmac, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPynkMcpScope, type PynkMcpScope } from "@/lib/mcp-scopes";
import type { PynkMcpAuth } from "./context";

const PREFIX = "pynk_mcp_";
export type McpTokenKind = "manual" | "oauth_access" | "oauth_refresh";
const KIND_PREFIX: Record<McpTokenKind, string> = { manual: PREFIX, oauth_access: `${PREFIX}at_`, oauth_refresh: `${PREFIX}rt_` };

function pepper() {
  const value = process.env.MCP_TOKEN_PEPPER ?? "";
  if (value.length < 32) throw new Error("MCP_TOKEN_PEPPER deve contenere almeno 32 caratteri.");
  return value;
}

export function hashMcpSecret(value: string): string {
  return createHmac("sha256", pepper()).update(value).digest("hex");
}

export function generateMcpToken(kind: McpTokenKind = "manual") {
  const token = `${KIND_PREFIX[kind]}${randomBytes(32).toString("base64url")}`;
  return { token, hash: hashMcpSecret(token), prefix: token.slice(0, PREFIX.length + 9) };
}

export function generateAuthorizationCode() {
  const code = randomBytes(32).toString("base64url");
  return { code, hash: hashMcpSecret(code) };
}

export function verifyPkce(verifier: string, challenge: string): boolean {
  return createHash("sha256").update(verifier).digest("base64url") === challenge;
}

type TokenRow = {
  id: string; siteadmin_id: string; user_id: string; name: string; scopes: string[];
  expires_at: string; revoked_at: string | null; kind: McpTokenKind; resource: string | null;
};

export async function authenticateMcpToken(service: SupabaseClient, token: string | null, resource: string): Promise<PynkMcpAuth | null> {
  if (!token?.startsWith(PREFIX)) return null;
  let hash: string;
  try { hash = hashMcpSecret(token); } catch { return null; }
  const { data } = await service.from("pynkstudio_mcp_tokens").select("id,siteadmin_id,user_id,name,scopes,expires_at,revoked_at,kind,resource").eq("token_hash", hash).maybeSingle();
  const row = data as TokenRow | null;
  if (!row || row.kind === "oauth_refresh" || row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) return null;
  if (row.resource && row.resource !== resource) return null;
  const { data: admin } = await service.from("siteadmin").select("id,email,enabled").eq("id", row.siteadmin_id).eq("user_id", row.user_id).maybeSingle();
  if (!admin?.enabled) return null;
  void service.from("pynkstudio_mcp_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);
  return {
    tokenId: row.id, tokenName: row.name, userId: row.user_id, siteadminId: row.siteadmin_id,
    email: admin.email ?? null, scopes: (row.scopes ?? []).filter(isPynkMcpScope) as PynkMcpScope[],
    expiresAt: row.expires_at, principalKind: "siteadmin", tenantIds: [],
  };
}

export function bearerToken(request: Request): string | null {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : null;
}
