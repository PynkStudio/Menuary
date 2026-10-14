import type { SupabaseClient } from "@supabase/supabase-js";
import type { PynkMcpScope } from "@/lib/mcp-scopes";

export type McpPrincipalKind = "siteadmin" | "tenant";

export interface PynkMcpAuth {
  tokenId: string;
  tokenName: string;
  userId: string;
  siteadminId: string;
  email: string | null;
  scopes: PynkMcpScope[];
  expiresAt: string;
  principalKind: McpPrincipalKind;
  tenantIds: string[];
}

export interface PynkMcpContext {
  auth: PynkMcpAuth;
  service: SupabaseClient;
  origin: string;
}

export class PynkMcpToolError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "PynkMcpToolError";
  }
}

export function requireMcpScope(ctx: PynkMcpContext, scope: PynkMcpScope) {
  if (!ctx.auth.scopes.includes(scope)) {
    throw new PynkMcpToolError("missing_scope", `Il token non dispone dello scope ${scope}. Modifica i permessi MCP dal portale PynkStudio.`);
  }
}
