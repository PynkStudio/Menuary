import { createMcpServiceClient } from "@/server/mcp/db";
import { generateMcpToken, hashMcpSecret, verifyPkce } from "@/server/mcp/auth";

async function params(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return new URLSearchParams(Object.entries(await request.json() as Record<string,string>));
  return new URLSearchParams(await request.text());
}

export async function POST(request: Request) {
  const service = createMcpServiceClient(); if (!service) return Response.json({ error: "server_error" }, { status: 503 });
  const input = await params(request); const grant = input.get("grant_type"); const clientId = input.get("client_id") ?? "";
  if (grant === "authorization_code") {
    const rawCode = input.get("code") ?? ""; const verifier = input.get("code_verifier") ?? ""; const redirectUri = input.get("redirect_uri") ?? "";
    let codeHash: string; try { codeHash = hashMcpSecret(rawCode); } catch { return Response.json({ error: "server_error" }, { status: 503 }); }
    const { data: stored } = await service.from("pynkstudio_mcp_authorization_codes").select("*").eq("code_hash", codeHash).maybeSingle();
    if (!stored || stored.client_id !== clientId || stored.redirect_uri !== redirectUri || stored.consumed_at || new Date(stored.expires_at).getTime() <= Date.now() || !verifyPkce(verifier, stored.code_challenge)) return Response.json({ error: "invalid_grant" }, { status: 400 });
    await service.from("pynkstudio_mcp_authorization_codes").update({ consumed_at: new Date().toISOString() }).eq("code_hash", stored.code_hash);
    const access = generateMcpToken("oauth_access"); const refresh = generateMcpToken("oauth_refresh");
    const accessExpiry = new Date(Date.now()+60*60_000).toISOString(); const refreshExpiry = new Date(Date.now()+90*86400_000).toISOString();
    await service.from("pynkstudio_mcp_tokens").insert([{ siteadmin_id: stored.siteadmin_id, user_id: stored.user_id, client_id: clientId, name: "Claude Cowork", token_hash: access.hash, token_prefix: access.prefix, kind: "oauth_access", scopes: stored.scopes, resource: stored.resource, expires_at: accessExpiry }, { siteadmin_id: stored.siteadmin_id, user_id: stored.user_id, client_id: clientId, name: "Claude Cowork refresh", token_hash: refresh.hash, token_prefix: refresh.prefix, kind: "oauth_refresh", scopes: stored.scopes, resource: stored.resource, expires_at: refreshExpiry }]);
    return Response.json({ access_token: access.token, token_type: "Bearer", expires_in: 3600, refresh_token: refresh.token, scope: stored.scopes.join(" "), resource: stored.resource });
  }
  if (grant === "refresh_token") {
    const raw = input.get("refresh_token") ?? ""; let refreshHash: string; try { refreshHash = hashMcpSecret(raw); } catch { return Response.json({ error: "server_error" }, { status: 503 }); } const { data: row } = await service.from("pynkstudio_mcp_tokens").select("*").eq("token_hash", refreshHash).eq("kind", "oauth_refresh").maybeSingle();
    if (!row || row.client_id !== clientId || row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) return Response.json({ error: "invalid_grant" }, { status: 400 });
    const access = generateMcpToken("oauth_access"); await service.from("pynkstudio_mcp_tokens").insert({ siteadmin_id: row.siteadmin_id, user_id: row.user_id, client_id: clientId, name: "Claude Cowork", token_hash: access.hash, token_prefix: access.prefix, kind: "oauth_access", scopes: row.scopes, resource: row.resource, expires_at: new Date(Date.now()+60*60_000).toISOString() });
    return Response.json({ access_token: access.token, token_type: "Bearer", expires_in: 3600, refresh_token: raw, scope: row.scopes.join(" "), resource: row.resource });
  }
  return Response.json({ error: "unsupported_grant_type" }, { status: 400 });
}
