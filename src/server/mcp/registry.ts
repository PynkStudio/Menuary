import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { PynkMcpScope } from "@/lib/mcp-scopes";
import { beginMcpAudit, consumeMcpLimit, finishMcpAudit, previousMcpResult, type McpRateKind } from "./audit";
import { PynkMcpToolError, requireMcpScope, type PynkMcpContext } from "./context";

export type McpToolOutcome = { text: string; data?: Record<string, unknown>; targetId?: string; preview?: boolean };
export type McpToolDefinition<Shape extends z.ZodRawShape> = {
  name: string; title: string; description: string; inputSchema: Shape; scope: PynkMcpScope;
  rate: McpRateKind; annotations?: ToolAnnotations;
  handler: (args: z.objectOutputType<Shape, z.ZodTypeAny>, ctx: PynkMcpContext) => Promise<McpToolOutcome>;
};

export const paginationShape = {
  limit: z.number().int().min(1).max(100).default(25).describe("Numero massimo di risultati."),
  offset: z.number().int().min(0).default(0).describe("Numero di risultati da saltare."),
};
export const requestIdShape = { client_request_id: z.string().min(6).max(120).optional().describe("ID univoco per rendere idempotente una scrittura.") };
export const confirmShape = { confirm: z.boolean().default(false).describe("Deve essere true per eseguire un invio o altro effetto esterno.") };

type Register = (name: string, config: Record<string, unknown>, cb: (args: Record<string, unknown>) => Promise<unknown>) => void;

export function registerPynkTool<Shape extends z.ZodRawShape>(server: McpServer, ctx: PynkMcpContext, def: McpToolDefinition<Shape>) {
  (server.registerTool as unknown as Register)(def.name, {
    title: def.title, description: def.description, inputSchema: def.inputSchema,
    annotations: { readOnlyHint: def.rate === "read", destructiveHint: false, openWorldHint: def.rate === "send", ...def.annotations },
  }, async (raw) => {
    const args = raw as z.objectOutputType<Shape, z.ZodTypeAny>;
    const requestId = (args as { client_request_id?: string }).client_request_id;
    try { requireMcpScope(ctx, def.scope); } catch (error) {
      const message = error instanceof Error ? error.message : "Permesso negato";
      const audit = await beginMcpAudit(ctx, def.name, raw, requestId);
      await finishMcpAudit(ctx, audit, "denied", undefined, message);
      return { isError: true, content: [{ type: "text", text: message }] };
    }
    if (!(await consumeMcpLimit(ctx, def.rate))) return { isError: true, content: [{ type: "text", text: "Limite orario raggiunto per questo token." }] };
    const cached = await previousMcpResult(ctx, def.name, requestId);
    if (cached) return { content: [{ type: "text", text: "Operazione già eseguita con lo stesso client_request_id." }], structuredContent: cached.result ?? {} };
    const audit = await beginMcpAudit(ctx, def.name, raw, requestId);
    try {
      const result = await def.handler(args, ctx);
      await finishMcpAudit(ctx, audit, "ok", result.preview ? undefined : result.data, undefined, result.targetId);
      return { content: [{ type: "text", text: result.text }], ...(result.data ? { structuredContent: result.data } : {}) };
    } catch (error) {
      const message = error instanceof PynkMcpToolError ? `${error.message} (${error.code})` : error instanceof Error ? error.message : "Errore inatteso";
      await finishMcpAudit(ctx, audit, "error", undefined, message);
      return { isError: true, content: [{ type: "text", text: message }] };
    }
  });
}
