import { mcpResource, requestOrigin } from "@/server/mcp/http";

export function GET(request: Request) {
  const origin = requestOrigin(request);
  return Response.json({ resource: mcpResource(request), authorization_servers: [origin], bearer_methods_supported: ["header"], scopes_supported: ["marketing:read","marketing:write","marketing:send","crm:read","crm:write","mail:read","mail:write","mail:send","admin:read","admin:write"] }, { headers: { "Cache-Control": "public, max-age=300" } });
}
