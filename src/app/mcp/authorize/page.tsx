import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMcpServiceClient } from "@/server/mcp/db";
import { isPynkMcpScope, type PynkMcpScope } from "@/lib/mcp-scopes";
import { McpConsent } from "@/components/admin-pynkstudio/mcp-consent";
import "@/styles/mcp-consent.css";

export const metadata: Metadata = { title: "Autorizza Claude Cowork · PynkStudio", robots: { index: false, follow: false } };

export default async function Authorize({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const query = await searchParams; const session = await createSupabaseServerClient(); const { data: { user } } = await session.auth.getUser();
  const current = `/mcp/authorize?${new URLSearchParams(Object.entries(query).flatMap(([key,value])=>typeof value==="string"?[[key,value]]:[])).toString()}`;
  if (!user) redirect(`/admin-pynkstudio/login?next=${encodeURIComponent(current)}`);
  const clientId = typeof query.client_id === "string" ? query.client_id : ""; const redirectUri = typeof query.redirect_uri === "string" ? query.redirect_uri : ""; const challenge = typeof query.code_challenge === "string" ? query.code_challenge : ""; const state = typeof query.state === "string" ? query.state : ""; const resource = typeof query.resource === "string" ? query.resource : "";
  if (query.response_type !== "code" || query.code_challenge_method !== "S256" || !clientId || !redirectUri || !challenge || !resource) return <main className="mcp-consent-page"><div className="mcp-consent-card"><h1>Richiesta non valida</h1><p>Mancano i parametri OAuth o PKCE richiesti.</p></div></main>;
  const service = createMcpServiceClient(); const { data: client } = service ? await service.from("pynkstudio_mcp_clients").select("client_name,redirect_uris,disabled_at").eq("client_id",clientId).maybeSingle() : { data:null };
  if (!client || client.disabled_at || !client.redirect_uris.includes(redirectUri)) return <main className="mcp-consent-page"><div className="mcp-consent-card"><h1>Client non riconosciuto</h1><p>Claude deve registrare nuovamente il connettore.</p></div></main>;
  const requested = (typeof query.scope === "string" ? query.scope.split(" ") : []).filter(isPynkMcpScope) as PynkMcpScope[];
  return <McpConsent clientName={client.client_name} clientId={clientId} redirectUri={redirectUri} codeChallenge={challenge} state={state} resource={resource} scopes={requested}/>;
}
