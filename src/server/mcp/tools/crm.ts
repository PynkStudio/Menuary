import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { paginationShape, registerPynkTool, requestIdShape } from "../registry";
import { PynkMcpToolError, type PynkMcpContext } from "../context";

export function registerCrmTools(server: McpServer, ctx: PynkMcpContext) {
  registerPynkTool(server, ctx, {
    name: "pynk_crm_list_contacts", title: "Elenca contatti CRM", scope: "crm:read", rate: "read",
    description: "Cerca contatti nel CRM PynkStudio e restituisce una pagina di risultati.",
    inputSchema: { ...paginationShape, query: z.string().max(100).optional(), status: z.string().max(30).optional(), source: z.string().max(50).optional() },
    async handler(args, { service }) { let q = service.from("pynkstudio_crm").select("*", { count: "exact" }).order("last_activity_at", { ascending: false }).range(args.offset, args.offset + args.limit - 1); if (args.status) q = q.eq("status", args.status); if (args.source) q = q.eq("source", args.source); if (args.query) { const term = args.query.replace(/[,()*%]/g, " "); q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%`); } const { data, count, error } = await q; if (error) throw new Error(error.message); return { text: `${count ?? 0} contatti trovati.`, data: { total: count ?? 0, count: data?.length ?? 0, offset: args.offset, has_more: (count ?? 0) > args.offset + (data?.length ?? 0), contacts: data ?? [] } }; },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_crm_get_contact", title: "Leggi scheda CRM", scope: "crm:read", rate: "read",
    description: "Restituisce contatto CRM e cronologia attività.", inputSchema: { contact_id: z.string().uuid() },
    async handler(args, { service }) { const [{ data: contact }, { data: activities }] = await Promise.all([service.from("pynkstudio_crm").select("*").eq("id", args.contact_id).maybeSingle(), service.from("pynkstudio_crm_activities").select("*").eq("contact_id", args.contact_id).order("created_at", { ascending: false }).limit(100)]); if (!contact) throw new PynkMcpToolError("not_found", "Contatto non trovato."); return { text: `${contact.name} · ${contact.status} · ${activities?.length ?? 0} attività.`, data: { contact, activities: activities ?? [] } }; },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_crm_create_contact", title: "Crea contatto CRM", scope: "crm:write", rate: "write",
    description: "Crea un contatto CRM interno senza inviare comunicazioni. Email e telefono sono opzionali: chiedine almeno uno se possibile, ma il contatto si può creare anche senza.", annotations: { idempotentHint: true },
    inputSchema: { ...requestIdShape, name: z.string().min(1).max(160), email: z.string().email().optional(), phone: z.string().max(40).optional(), company: z.string().max(160).optional(), industry: z.string().max(120).optional(), source: z.string().max(40).default("mcp"), notes: z.string().max(4000).optional(), tags: z.array(z.string().max(40)).max(20).default([]) },
    async handler(args, { service }) { const { client_request_id, ...input } = args; void client_request_id; const { data, error } = await service.from("pynkstudio_crm").insert({ ...input, email: input.email?.trim().toLowerCase() || null, phone: input.phone?.trim() ?? "", status: "lead", interests: [], last_activity_at: new Date().toISOString() }).select("*").single(); if (error?.code === "23505") throw new PynkMcpToolError("already_exists", "Esiste già un contatto con questa email."); if (error) throw new Error(error.message); return { text: `Contatto ${data.name} creato.`, data: { contact: data }, targetId: data.id }; },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_crm_update_contact", title: "Aggiorna contatto CRM", scope: "crm:write", rate: "write",
    description: "Aggiorna campi commerciali di un contatto CRM. I campi assenti restano invariati.", annotations: { idempotentHint: true },
    inputSchema: { ...requestIdShape, contact_id: z.string().uuid(), status: z.enum(["lead","prospect","client","lost"]).optional(), name: z.string().min(1).max(160).optional(), email: z.string().email().nullable().optional(), phone: z.string().max(40).optional(), company: z.string().max(160).optional(), notes: z.string().max(4000).optional(), estimated_value: z.number().min(0).max(10000000).optional(), next_follow_up_at: z.string().datetime().nullable().optional(), tags: z.array(z.string().max(40)).max(20).optional() },
    async handler(args, { service }) { const { contact_id, client_request_id, ...patch } = args; void client_request_id; if (patch.email !== undefined) patch.email = patch.email?.trim().toLowerCase() || null; const { data, error } = await service.from("pynkstudio_crm").update({ ...patch, updated_at: new Date().toISOString(), last_activity_at: new Date().toISOString() }).eq("id", contact_id).select("*").maybeSingle(); if (error) throw new Error(error.message); if (!data) throw new PynkMcpToolError("not_found", "Contatto non trovato."); return { text: `Scheda di ${data.name} aggiornata.`, data: { contact: data }, targetId: contact_id }; },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_crm_add_activity", title: "Registra attività CRM", scope: "crm:write", rate: "write",
    description: "Aggiunge una nota, email, chiamata o WhatsApp alla timeline del contatto.", annotations: { idempotentHint: true },
    inputSchema: { ...requestIdShape, contact_id: z.string().uuid(), type: z.enum(["note","call","email","whatsapp","status","system"]), title: z.string().min(1).max(200), body: z.string().max(4000).optional() },
    async handler(args, { service, auth }) { const { data, error } = await service.from("pynkstudio_crm_activities").insert({ contact_id: args.contact_id, type: args.type, title: args.title, body: args.body ?? null, created_by: auth.email ?? "MCP" }).select("*").single(); if (error) throw new Error(error.message); await service.from("pynkstudio_crm").update({ last_activity_at: new Date().toISOString() }).eq("id", args.contact_id); return { text: "Attività registrata nella timeline.", data: { activity: data }, targetId: data.id }; },
  });
}
