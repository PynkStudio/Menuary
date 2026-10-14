import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sendEmail } from "@/lib/email/sender";
import { confirmShape, paginationShape, registerPynkTool, requestIdShape } from "../registry";
import { PynkMcpToolError, type PynkMcpContext } from "../context";

function escape(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

export function registerMailTools(server: McpServer, ctx: PynkMcpContext) {
  registerPynkTool(server, ctx, {
    name: "pynk_mail_list", title: "Elenca posta in arrivo", scope: "mail:read", rate: "read",
    description: "Elenca le email del portale amministrativo filtrabili per brand e stato.",
    inputSchema: { ...paginationShape, brand: z.enum(["menuary","bizery","orpheo","pynkstudio"]).optional(), unread_only: z.boolean().default(false), starred_only: z.boolean().default(false), archived: z.boolean().default(false), spam: z.boolean().default(false) },
    async handler(args, { service }) { let q = service.from("inbound_emails").select("id,brand,from_address,from_name,to_addresses,subject,preview,read,starred,archived,spam,assigned_to_user_id,created_at", { count: "exact" }).order("created_at", { ascending: false }).range(args.offset, args.offset + args.limit - 1); if (args.brand) q = q.eq("brand", args.brand); if (args.unread_only) q = q.eq("read", false); if (args.starred_only) q = q.eq("starred", true); q = q.eq("archived", args.archived).eq("spam", args.spam); const { data, count, error } = await q; if (error) throw new Error(error.message); return { text: `${count ?? 0} email trovate.`, data: { total: count ?? 0, count: data?.length ?? 0, offset: args.offset, has_more: (count ?? 0) > args.offset + (data?.length ?? 0), emails: data ?? [] } }; },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_mail_get", title: "Leggi email", scope: "mail:read", rate: "read",
    description: "Restituisce intestazioni, testo e allegati dichiarati di una email amministrativa.", inputSchema: { email_id: z.string().uuid() },
    async handler(args, { service }) { const { data, error } = await service.from("inbound_emails").select("*").eq("id", args.email_id).maybeSingle(); if (error) throw new Error(error.message); if (!data) throw new PynkMcpToolError("not_found", "Email non trovata."); return { text: `${data.from_name ?? data.from_address}: ${data.subject}`, data: { email: data } }; },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_mail_update", title: "Aggiorna stato email", scope: "mail:write", rate: "write",
    description: "Segna una email come letta, preferita, archiviata o la assegna a un siteadmin.", annotations: { idempotentHint: true },
    inputSchema: { ...requestIdShape, email_id: z.string().uuid(), read: z.boolean().optional(), starred: z.boolean().optional(), archived: z.boolean().optional(), assigned_to_siteadmin_id: z.string().uuid().nullable().optional() },
    async handler(args, { service }) { const { email_id, client_request_id, ...patch } = args; void client_request_id; if (!Object.keys(patch).length) throw new PynkMcpToolError("empty_patch", "Indica almeno un campo da aggiornare."); const { data, error } = await service.from("inbound_emails").update(patch).eq("id", email_id).select("id,read,starred,archived,assigned_to_user_id").maybeSingle(); if (error) throw new Error(error.message); if (!data) throw new PynkMcpToolError("not_found", "Email non trovata."); return { text: "Stato email aggiornato.", data: { email: data }, targetId: email_id }; },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_mail_send", title: "Invia email", scope: "mail:send", rate: "send",
    description: "Mostra l'anteprima o invia una nuova email dal brand scelto. Richiede confirm=true.", annotations: { idempotentHint: true, openWorldHint: true },
    inputSchema: { ...requestIdShape, ...confirmShape, to: z.string().email(), subject: z.string().min(1).max(240), body_text: z.string().min(1).max(20000), brand: z.enum(["menuary","bizery","orpheo","pynkstudio"]).default("pynkstudio"), reply_to: z.string().email().optional() },
    async handler(args) { if (!args.confirm) return { text: `Anteprima invio a ${args.to}\nOggetto: ${args.subject}\n\n${args.body_text}`, data: { to: args.to, subject: args.subject, brand: args.brand }, preview: true }; const from = args.brand === "menuary" ? "Menuary <amministrazione@menuary.it>" : args.brand === "bizery" ? "Bizery <amministrazione@bizery.it>" : args.brand === "orpheo" ? "Orpheo <amministrazione@weuseorpheo.com>" : "PynkStudio <hello@pynkstudio.eu>"; const result = await sendEmail({ to: args.to, subject: args.subject, html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17111f">${escape(args.body_text).replaceAll("\n", "<br>")}</div>`, fromOverride: from, replyTo: args.reply_to }); if (!result.ok) throw new PynkMcpToolError("send_failed", result.error); return { text: `Email inviata a ${args.to}.`, data: { sent: true, message_id: result.messageId, to: args.to }, targetId: result.messageId }; },
  });
}
