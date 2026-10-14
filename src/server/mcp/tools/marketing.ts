import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { outreachLandingUrl } from "@/lib/menuary-outreach/copy";
import { sendOutreachStep } from "@/lib/menuary-outreach/server";
import { confirmShape, paginationShape, registerPynkTool, requestIdShape } from "../registry";
import { PynkMcpToolError, type PynkMcpContext } from "../context";

export function registerMarketingTools(server: McpServer, ctx: PynkMcpContext) {
  registerPynkTool(server, ctx, {
    name: "pynk_marketing_dashboard", title: "Dashboard marketing Menuary", scope: "marketing:read", rate: "read",
    description: "Restituisce campagne outreach Menuary e metriche aggregate del funnel.", inputSchema: {},
    async handler(_, { service }) {
      const { data: campaigns } = await service.from("menuary_outreach_campaigns").select("*").order("created_at", { ascending: false });
      const { data: leads } = await service.from("menuary_outreach_leads").select("status,sent_count,landing_viewed_at,video_clicked_at,booked_at");
      const rows = leads ?? [];
      const stats = { total: rows.length, sent: rows.filter((r) => r.sent_count > 0).length, landing_views: rows.filter((r) => r.landing_viewed_at).length, video_clicks: rows.filter((r) => r.video_clicked_at).length, booked: rows.filter((r) => r.booked_at || r.status === "booked").length, won: rows.filter((r) => r.status === "won").length };
      return { text: `Funnel Menuary: ${stats.total} prospect, ${stats.sent} raggiunti, ${stats.booked} call, ${stats.won} clienti.`, data: { campaigns: campaigns ?? [], stats } };
    },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_marketing_list_prospects", title: "Elenca prospect Menuary", scope: "marketing:read", rate: "read",
    description: "Elenca e filtra i prospect del funnel Menuary con segnali e URL landing.",
    inputSchema: { ...paginationShape, campaign_id: z.string().uuid().optional(), status: z.string().max(30).optional(), query: z.string().max(100).optional() },
    async handler(args, { service }) {
      let query = service.from("menuary_outreach_leads").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(args.offset, args.offset + args.limit - 1);
      if (args.campaign_id) query = query.eq("campaign_id", args.campaign_id);
      if (args.status) query = query.eq("status", args.status);
      if (args.query) query = query.or(`restaurant_name.ilike.%${args.query.replace(/[,()*%]/g, " ")}%,email.ilike.%${args.query.replace(/[,()*%]/g, " ")}%`);
      const { data, count, error } = await query; if (error) throw new Error(error.message);
      const items = (data ?? []).map((lead) => ({ ...lead, landing_url: outreachLandingUrl(lead.public_token) }));
      return { text: `${count ?? 0} prospect trovati; ${items.length} restituiti.`, data: { total: count ?? 0, count: items.length, offset: args.offset, has_more: (count ?? 0) > args.offset + items.length, items } };
    },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_marketing_create_prospect", title: "Crea prospect Menuary", scope: "marketing:write", rate: "write",
    description: "Crea un prospect personalizzato nel funnel Menuary. Non invia email.", annotations: { idempotentHint: true },
    inputSchema: { ...requestIdShape, campaign_id: z.string().uuid(), contact_name: z.string().min(1).max(120), restaurant_name: z.string().min(1).max(160), email: z.string().email(), phone: z.string().max(40).optional(), city: z.string().max(120).optional(), website_url: z.string().url().optional(), image_url: z.string().url().optional(), observation: z.string().min(10).max(1000), headline: z.string().max(240).optional(), primary_pain: z.string().max(500).optional() },
    async handler(args, { service }) {
      const { client_request_id, ...input } = args;
      void client_request_id;
      const { data, error } = await service.from("menuary_outreach_leads").insert({ ...input, email: input.email.toLowerCase() }).select("*").single();
      if (error?.code === "23505") throw new PynkMcpToolError("already_exists", "Il prospect esiste già in questa campagna.");
      if (error) throw new Error(error.message);
      return { text: `Prospect ${data.restaurant_name} creato. Nessuna email inviata.`, data: { lead: data, landing_url: outreachLandingUrl(data.public_token) }, targetId: data.id };
    },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_marketing_update_prospect_status", title: "Aggiorna stato prospect", scope: "marketing:write", rate: "write",
    description: "Aggiorna lo stato commerciale e ferma la sequenza per stati terminali.", annotations: { idempotentHint: true },
    inputSchema: { ...requestIdShape, lead_id: z.string().uuid(), status: z.enum(["ready","active","replied","booked","won","lost","paused","bounced"]) },
    async handler(args, { service }) { const terminal = ["replied","booked","won","lost","bounced"].includes(args.status); const now = new Date().toISOString(); const { error } = await service.from("menuary_outreach_leads").update({ status: args.status, next_send_at: terminal ? null : args.status === "active" ? now : null, ...(args.status === "booked" ? { booked_at: now } : {}), updated_at: now }).eq("id", args.lead_id); if (error) throw new Error(error.message); return { text: `Prospect aggiornato a ${args.status}.`, data: { lead_id: args.lead_id, status: args.status }, targetId: args.lead_id }; },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_marketing_send_next_email", title: "Invia prossimo touchpoint", scope: "marketing:send", rate: "send",
    description: "Mostra l'anteprima o invia realmente il prossimo touchpoint al prospect. Richiede confirm=true.", annotations: { idempotentHint: true, openWorldHint: true },
    inputSchema: { ...requestIdShape, ...confirmShape, lead_id: z.string().uuid() },
    async handler(args, { service }) {
      const { data: lead } = await service.from("menuary_outreach_leads").select("id,email,restaurant_name,current_step,status").eq("id", args.lead_id).maybeSingle();
      if (!lead) throw new PynkMcpToolError("not_found", "Prospect non trovato.");
      if (!args.confirm) return { text: `Anteprima: invierei lo step successivo a ${lead.restaurant_name} <${lead.email}>. Ripeti con confirm=true.`, data: { lead, next_step: lead.current_step + 1 }, preview: true };
      const result = await sendOutreachStep(args.lead_id); if (!result.ok) throw new PynkMcpToolError("send_failed", result.error ?? "Invio fallito");
      return { text: `Email inviata a ${lead.restaurant_name}.`, data: { lead_id: lead.id, sent: true }, targetId: lead.id };
    },
  });
  registerPynkTool(server, ctx, {
    name: "pynk_marketing_get_sequence", title: "Leggi sequenza outreach", scope: "marketing:read", rate: "read",
    description: "Restituisce configurazione della campagna e tutti i touchpoint email.", inputSchema: { campaign_id: z.string().uuid() },
    async handler(args, { service }) { const [{ data: campaign }, { data: steps }] = await Promise.all([service.from("menuary_outreach_campaigns").select("*").eq("id", args.campaign_id).maybeSingle(), service.from("menuary_outreach_steps").select("*").eq("campaign_id", args.campaign_id).order("position")]); if (!campaign) throw new PynkMcpToolError("not_found", "Campagna non trovata."); return { text: `${steps?.length ?? 0} touchpoint nella campagna ${campaign.name}.`, data: { campaign, steps: steps ?? [] } }; },
  });
}
