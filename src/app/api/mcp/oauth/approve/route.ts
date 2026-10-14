import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMcpServiceClient } from "@/server/mcp/db";
import { generateAuthorizationCode } from "@/server/mcp/auth";
import { isPynkMcpScope } from "@/lib/mcp-scopes";
import { mcpResource, requestOrigin } from "@/server/mcp/http";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== requestOrigin(request)) return Response.json({ error: "invalid_origin" }, { status: 403 });
  const session = await createSupabaseServerClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const service = createMcpServiceClient(); if (!service) return Response.json({ error: "server_error" }, { status: 503 });
  const { data: admin } = await service.from("siteadmin").select("id,enabled").eq("user_id", user.id).maybeSingle();
  if (!admin?.enabled) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const clientId = typeof body?.client_id === "string" ? body.client_id : "";
  const redirectUri = typeof body?.redirect_uri === "string" ? body.redirect_uri : "";
  const challenge = typeof body?.code_challenge === "string" ? body.code_challenge : "";
  const state = typeof body?.state === "string" ? body.state : "";
  const resource = typeof body?.resource === "string" ? body.resource : "";
  const scopes = Array.isArray(body?.scopes) ? body.scopes.filter((v): v is string => typeof v === "string" && isPynkMcpScope(v)) : [];
  const { data: client } = await service.from("pynkstudio_mcp_clients").select("redirect_uris,disabled_at").eq("client_id", clientId).maybeSingle();
  if (!client || client.disabled_at || !client.redirect_uris.includes(redirectUri) || !challenge || resource !== mcpResource(request) || !scopes.length) return Response.json({ error: "invalid_request" }, { status: 400 });
  const code = generateAuthorizationCode();
  const { error } = await service.from("pynkstudio_mcp_authorization_codes").insert({ code_hash: code.hash, client_id: clientId, siteadmin_id: admin.id, user_id: user.id, redirect_uri: redirectUri, scopes, resource, code_challenge: challenge, expires_at: new Date(Date.now()+10*60_000).toISOString() });
  if (error) return Response.json({ error: "server_error" }, { status: 500 });
  const target = new URL(redirectUri); target.searchParams.set("code", code.code); if (state) target.searchParams.set("state", state);
  return Response.json({ redirect_to: target.toString() });
}
