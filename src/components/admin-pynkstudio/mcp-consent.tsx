"use client";

import { useState } from "react";
import Link from "next/link";
import { PYNK_MCP_SCOPE_LABELS, type PynkMcpScope } from "@/lib/mcp-scopes";

type Props = { clientName: string; clientId: string; redirectUri: string; codeChallenge: string; state: string; resource: string; scopes: PynkMcpScope[] };

export function McpConsent(props: Props) {
  const [selected, setSelected] = useState(props.scopes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/mcp/oauth/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: props.clientId, redirect_uri: props.redirectUri, code_challenge: props.codeChallenge, state: props.state, resource: props.resource, scopes: selected }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Autorizzazione non riuscita");
      window.location.assign(data.redirect_to);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Errore inatteso"); setLoading(false); }
  }
  return <main className="mcp-consent-page"><form className="mcp-consent-card" onSubmit={submit}><p className="mcp-consent-brand">PYNKSTUDIO / MCP</p><h1>Collega {props.clientName}</h1><p className="mcp-consent-intro">Il client potrà operare nel portale PynkStudio con i permessi selezionati. Potrai revocare l’accesso in qualsiasi momento.</p><fieldset><legend>Permessi richiesti</legend>{props.scopes.map((scope)=><label key={scope} htmlFor={`scope-${scope}`}><input id={`scope-${scope}`} name="scope" type="checkbox" checked={selected.includes(scope)} onChange={(event)=>setSelected(current=>event.target.checked?[...current,scope]:current.filter(item=>item!==scope))}/><span><strong>{PYNK_MCP_SCOPE_LABELS[scope]}</strong><small>{scope}</small></span></label>)}</fieldset>{error&&<p className="mcp-consent-error" role="alert" aria-live="polite">{error}</p>}<button type="submit" disabled={loading||selected.length===0}>{loading?"Collegamento…":"Autorizza connessione"}</button><Link href="/admin-pynkstudio">Annulla e torna al portale</Link><p className="mcp-consent-note">Le azioni che inviano email richiedono comunque una conferma esplicita nel prompt.</p></form></main>;
}
