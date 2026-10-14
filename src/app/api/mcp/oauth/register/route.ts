import { randomUUID } from "node:crypto";
import { createMcpServiceClient } from "@/server/mcp/db";

function validRedirect(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" || (url.protocol === "http:" && ["localhost","127.0.0.1"].includes(url.hostname)); }
  catch { return false; }
}

export async function POST(request: Request) {
  const service = createMcpServiceClient();
  if (!service) return Response.json({ error: "server_error" }, { status: 503 });
  const body = await request.json().catch(() => null) as { client_name?: unknown; redirect_uris?: unknown; grant_types?: unknown; response_types?: unknown; token_endpoint_auth_method?: unknown } | null;
  const redirectUris = Array.isArray(body?.redirect_uris) ? body.redirect_uris.filter((v): v is string => typeof v === "string" && validRedirect(v)).slice(0, 10) : [];
  if (!redirectUris.length) return Response.json({ error: "invalid_redirect_uri" }, { status: 400 });
  const clientId = `pynk_client_${randomUUID()}`;
  const clientName = typeof body?.client_name === "string" ? body.client_name.slice(0, 160) : "Claude Cowork";
  const { error } = await service.from("pynkstudio_mcp_clients").insert({ client_id: clientId, client_name: clientName, redirect_uris: redirectUris, grant_types: ["authorization_code","refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none" });
  if (error) return Response.json({ error: "server_error" }, { status: 500 });
  return Response.json({ client_id: clientId, client_name: clientName, redirect_uris: redirectUris, grant_types: ["authorization_code","refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none", client_id_issued_at: Math.floor(Date.now()/1000) }, { status: 201 });
}
