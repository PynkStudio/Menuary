import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PynkMcpContext } from "./context";
import { registerAdminTools } from "./tools/admin";
import { registerCrmTools } from "./tools/crm";
import { registerMailTools } from "./tools/mail";
import { registerMarketingTools } from "./tools/marketing";

export function buildPynkMcpServer(ctx: PynkMcpContext) {
  const server = new McpServer({ name: "pynkstudio-mcp-server", version: "1.0.0" });
  registerMarketingTools(server, ctx);
  registerCrmTools(server, ctx);
  registerMailTools(server, ctx);
  registerAdminTools(server, ctx);
  return server;
}
