import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { paginationShape, registerPynkTool } from "../registry";
import { PynkMcpToolError, type PynkMcpContext } from "../context";

const RESOURCES = {
  tenants: { table: "tenants", columns: "id,name,slug,vertical,status,created_at" },
  subscriptions: { table: "platform_subscriptions", columns: "*" },
  contracts: { table: "platform_contracts", columns: "*" },
  support_tickets: { table: "support_tickets", columns: "*" },
  packages: { table: "platform_packages", columns: "*" },
  siteadmins: { table: "siteadmin", columns: "id,email,name,role,enabled,created_at" },
} as const;

export function registerAdminTools(server: McpServer, ctx: PynkMcpContext) {
  registerPynkTool(server, ctx, {
    name: "pynk_admin_list", title: "Elenca risorse amministrative", scope: "admin:read", rate: "read",
    description: "Consulta tenant, abbonamenti, contratti, ticket, pacchetti o utenti interni del portale PynkStudio.",
    inputSchema: { ...paginationShape, resource: z.enum(["tenants","subscriptions","contracts","support_tickets","packages","siteadmins"]), query: z.string().max(100).optional() },
    async handler(args, { service }) { const config = RESOURCES[args.resource]; let q = service.from(config.table).select(config.columns, { count: "exact" }).range(args.offset, args.offset + args.limit - 1); if (args.resource === "tenants" && args.query) q = q.or(`name.ilike.%${args.query.replace(/[,()*%]/g," ")}%,slug.ilike.%${args.query.replace(/[,()*%]/g," ")}%`); const { data, count, error } = await q; if (error) throw new Error(error.message); return { text: `${count ?? 0} ${args.resource} trovati.`, data: { resource: args.resource, total: count ?? 0, count: data?.length ?? 0, offset: args.offset, has_more: (count ?? 0) > args.offset + (data?.length ?? 0), items: data ?? [] } }; },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_admin_get_tenant", title: "Leggi tenant e moduli", scope: "admin:read", rate: "read",
    description: "Restituisce profilo tenant, sedi, feature flag e abbonamenti collegati.", inputSchema: { tenant_id: z.string().min(1).max(100) },
    async handler(args, { service }) { const [{ data: tenant }, { data: locations }, { data: subscriptions }] = await Promise.all([service.from("tenants").select("*").eq("id", args.tenant_id).maybeSingle(), service.from("locations").select("*").eq("tenant_id", args.tenant_id), service.from("platform_subscriptions").select("*").eq("tenant_id", args.tenant_id)]); if (!tenant) throw new PynkMcpToolError("not_found", "Tenant non trovato."); return { text: `${tenant.name}: ${locations?.length ?? 0} sedi, ${subscriptions?.length ?? 0} abbonamenti.`, data: { tenant, locations: locations ?? [], features: tenant.features ?? {}, subscriptions: subscriptions ?? [] } }; },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_admin_capabilities", title: "Elenca capacità MCP", scope: "admin:read", rate: "read",
    description: "Descrive copertura, scope e limiti correnti del connettore PynkStudio.", inputSchema: {},
    async handler(_, { auth }) { return { text: "Il connettore gestisce marketing Menuary, CRM, posta e consultazione del portale admin. Le operazioni tenant-scoped saranno abilitate in una fase successiva.", data: { principal: auth.principalKind, scopes: auth.scopes, tenant_ids: auth.tenantIds, domains: ["marketing","crm","mail","admin"], tenant_self_service: false } }; },
  });
}
