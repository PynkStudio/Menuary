import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { outreachDb } from "@/lib/menuary-outreach/server";
import "@/styles/menuary-outreach.css";

export const metadata: Metadata = { title: "Preferenze email · Menuary", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = outreachDb();
  if (!db) notFound();
  const { data: lead } = await db.from("menuary_outreach_leads").select("*").eq("public_token", token).maybeSingle();
  if (!lead) notFound();
  const leadId = lead.id;
  async function unsubscribe() {
    "use server";
    const innerDb = outreachDb();
    if (!innerDb) return;
    const now = new Date().toISOString();
    await innerDb.from("menuary_outreach_leads").update({ status: "unsubscribed", unsubscribed_at: now, next_send_at: null, updated_at: now }).eq("public_token", token);
    await innerDb.from("menuary_outreach_events").insert({ lead_id: leadId, event_type: "unsubscribed", metadata: {} });
  }
  return <main className="mol-unsubscribe"><a href="https://menuary.it" className="mol-logo">menuary<span>.</span></a><div><p className="mol-section-label">Preferenze email</p><h1>Vuoi interrompere i messaggi?</h1><p>Non invieremo altre email a <strong>{lead.email}</strong>. La modifica è immediata.</p>{lead.status === "unsubscribed" ? <p className="mol-unsubscribe-done">Indirizzo già disiscritto.</p> : <form action={unsubscribe}><button className="mol-call-button" type="submit">Conferma disiscrizione</button></form>}</div></main>;
}
