import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServiceClient } from "@/server/mcp/db";
import { authenticateMcpToken, bearerToken } from "@/server/mcp/auth";
import { mcpResource, requestOrigin } from "@/server/mcp/http";
import { buildPynkMcpServer } from "@/server/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  const service = createMcpServiceClient();
  if (!service) return Response.json({ error: "server_misconfigured" }, { status: 503 });
  const resource = mcpResource(request);
  const auth = await authenticateMcpToken(service, bearerToken(request), resource);
  if (!auth) return Response.json({ error: "invalid_token", message: "Autorizza nuovamente il connettore PynkStudio." }, { status: 401, headers: { "WWW-Authenticate": `Bearer resource_metadata="${requestOrigin(request)}/.well-known/oauth-protected-resource"` } });
  const server = buildPynkMcpServer({ auth, service, origin: requestOrigin(request) });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: 1_000_000 });
  await server.connect(transport);
  try { return await transport.handleRequest(request); }
  finally { await transport.close(); await server.close(); }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
