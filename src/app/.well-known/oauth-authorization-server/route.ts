import { PYNK_MCP_SCOPES } from "@/lib/mcp-scopes";
import { requestOrigin } from "@/server/mcp/http";

export function GET(request: Request) {
  const origin = requestOrigin(request);
  return Response.json({ issuer: origin, authorization_endpoint: `${origin}/mcp/authorize`, token_endpoint: `${origin}/api/mcp/oauth/token`, registration_endpoint: `${origin}/api/mcp/oauth/register`, scopes_supported: PYNK_MCP_SCOPES, response_types_supported: ["code"], response_modes_supported: ["query"], grant_types_supported: ["authorization_code","refresh_token"], token_endpoint_auth_methods_supported: ["none"], code_challenge_methods_supported: ["S256"], service_documentation: `${origin}/admin-pynkstudio/mcp` }, { headers: { "Cache-Control": "public, max-age=300" } });
}
