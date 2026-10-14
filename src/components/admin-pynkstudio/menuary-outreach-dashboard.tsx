"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, ExternalLink, Mail, Plus, RefreshCw, Save, Send, Settings2, Users } from "lucide-react";
import type { OutreachCampaign, OutreachDashboard, OutreachLead, OutreachLeadStatus, OutreachStep } from "@/lib/menuary-outreach/types";

const API = "/api/admin/pynkstudio/menuary-outreach";
type Tab = "overview" | "leads" | "sequence" | "settings";

const STATUS_LABEL: Record<OutreachLeadStatus, string> = {
  ready: "Pronto", active: "In sequenza", replied: "Ha risposto", booked: "Call prenotata",
  won: "Cliente", lost: "Perso", unsubscribed: "Disiscritto", bounced: "Non consegnata", paused: "In pausa",
};

async function action(body: Record<string, unknown>) {
  const response = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Operazione non riuscita");
  return data;
}

export function MenuaryOutreachDashboard() {
  const [data, setData] = useState<OutreachDashboard | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(API, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error === "migration_required" ? "Applica la migrazione menuary_outreach prima di usare il funnel." : result.error);
      setData(result);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Errore di caricamento"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const tabs: Array<[Tab, string, React.ElementType]> = [
    ["overview", "Panoramica", BarChart3], ["leads", "Prospect", Users], ["sequence", "Sequenza", Mail], ["settings", "Impostazioni", Settings2],
  ];
  return (
    <div className="pynk-outreach">
      <header className="pynk-outreach-head">
        <div><p className="pynk-admin-page-subtitle">Menuary · acquisizione</p><h1 className="pynk-admin-page-title">Customer journey</h1><p className="pynk-outreach-intro">Dalla prima email alla call: personalizzazione, segnali e avanzamento in un solo posto.</p></div>
        <div className="pynk-outreach-head-actions"><button type="button" className="pynk-outreach-secondary" onClick={() => void load()}><RefreshCw size={15} /> Aggiorna</button><button type="button" className="pynk-admin-action-btn" onClick={() => setShowAdd(true)} disabled={!data?.campaign}><Plus size={16} /> Nuovo prospect</button></div>
      </header>
      <nav className="pynk-outreach-tabs" aria-label="Sezioni marketing">
        {tabs.map(([key, label, Icon]) => <button key={key} type="button" aria-current={tab === key ? "page" : undefined} data-active={tab === key} onClick={() => setTab(key)}><Icon size={15} />{label}</button>)}
      </nav>
      {error && <div className="pynk-outreach-alert" role="alert">{error}</div>}
      {loading && !data ? <p className="pynk-outreach-empty">Caricamento…</p> : !data?.campaign ? <p className="pynk-outreach-empty">Nessuna campagna. Applica la migrazione per creare il pilot iniziale.</p> : (
        <>
          {tab === "overview" && <Overview data={data} />}
          {tab === "leads" && <LeadTable leads={data.leads} onRefresh={load} />}
          {tab === "sequence" && <Sequence steps={data.steps} onRefresh={load} />}
          {tab === "settings" && <CampaignSettings campaign={data.campaign} onRefresh={load} />}
        </>
      )}
      {showAdd && data?.campaign && <AddLead campaign={data.campaign} onClose={() => setShowAdd(false)} onCreated={async () => { setShowAdd(false); await load(); setTab("leads"); }} />}
    </div>
  );
}

function Overview({ data }: { data: OutreachDashboard }) {
  const s = data.stats;
  const cards = [["Prospect", s.total], ["Email inviate", s.sent], ["Landing visitate", s.landingViews], ["Video avviati", s.videoClicks], ["Click call", s.bookingClicks], ["Risposte", s.replies], ["Call prenotate", s.booked], ["Clienti", s.won]];
  const pct = (value: number) => s.sent ? `${Math.round(value / s.sent * 100)}%` : "—";
  return <><section className="pynk-outreach-kpis" aria-label="Metriche funnel">{cards.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong>{["Landing visitate", "Video avviati", "Click call", "Risposte", "Call prenotate"].includes(String(label)) && <small>{pct(Number(value))} degli inviati</small>}</article>)}</section><section className="pynk-admin-card pynk-outreach-funnel"><h2>Funnel corrente</h2><div>{[["Prospect",s.total],["Raggiunti",s.sent],["Interessati",s.landingViews],["Call",s.booked],["Clienti",s.won]].map(([label,value], index) => <div key={label}><span>{index+1}</span><p>{label}</p><strong>{value}</strong></div>)}</div></section></>;
}

function LeadTable({ leads, onRefresh }: { leads: OutreachLead[]; onRefresh: () => Promise<void> }) {
  const [busy, setBusy] = useState("");
  const update = async (leadId: string, status: OutreachLeadStatus) => { setBusy(leadId); try { await action({ action: "update_status", lead_id: leadId, status }); await onRefresh(); } finally { setBusy(""); } };
  const send = async (leadId: string) => { setBusy(leadId); try { await action({ action: "send_next", lead_id: leadId }); await onRefresh(); } catch (reason) { alert(reason instanceof Error ? reason.message : "Invio fallito"); } finally { setBusy(""); } };
  if (!leads.length) return <p className="pynk-outreach-empty">Aggiungi il primo ristorante per preparare la sua landing.</p>;
  return <div className="pynk-outreach-table-wrap"><table className="pynk-outreach-table"><caption>Prospect nella campagna Menuary</caption><thead><tr><th scope="col">Ristorante</th><th scope="col">Contatto</th><th scope="col">Stato</th><th scope="col">Segnali</th><th scope="col">Step</th><th scope="col">Azioni</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><th scope="row"><strong>{lead.restaurant_name}</strong><small>{lead.city || "Città non indicata"}</small></th><td><span>{lead.contact_name}</span><small>{lead.email}</small></td><td><select aria-label={`Stato di ${lead.restaurant_name}`} value={lead.status} disabled={busy === lead.id || lead.status === "unsubscribed"} onChange={(event) => void update(lead.id, event.target.value as OutreachLeadStatus)}>{Object.entries(STATUS_LABEL).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></td><td><div className="pynk-outreach-signals"><span data-on={Boolean(lead.landing_viewed_at)}>Landing</span><span data-on={Boolean(lead.video_clicked_at)}>Video</span><span data-on={Boolean(lead.booked_at)}>Call</span></div></td><td>{lead.current_step}/4<small>{lead.sent_count} email</small></td><td><div className="pynk-outreach-row-actions"><a href={`/presentazione/${lead.public_token}`} target="_blank" aria-label={`Apri landing di ${lead.restaurant_name}`}><ExternalLink size={15} /></a><button type="button" disabled={busy === lead.id || ["replied","booked","won","lost","unsubscribed","bounced"].includes(lead.status)} onClick={() => void send(lead.id)} aria-label={`Invia prossimo step a ${lead.restaurant_name}`}><Send size={15} /></button></div></td></tr>)}</tbody></table></div>;
}

function Sequence({ steps, onRefresh }: { steps: OutreachStep[]; onRefresh: () => Promise<void> }) {
  return <div className="pynk-outreach-step-list">{steps.map((step) => <StepEditor key={step.id} step={step} onRefresh={onRefresh} />)}</div>;
}
function StepEditor({ step, onRefresh }: { step: OutreachStep; onRefresh: () => Promise<void> }) {
  const [form,setForm] = useState(step); const [saving,setSaving] = useState(false);
  const save = async () => { setSaving(true); try { await action({ action:"save_step", ...form }); await onRefresh(); } finally { setSaving(false); } };
  return <article className="pynk-admin-card pynk-outreach-step"><header><span>TP{step.position}</span><div><h2>{step.name}</h2><p>{step.position === 1 ? "Invio iniziale" : `${step.delay_days} giorni dopo lo step precedente`}</p></div><label><input type="checkbox" checked={form.active} onChange={(e)=>setForm({...form,active:e.target.checked})}/> Attivo</label></header><div className="pynk-outreach-form-grid"><label>Nome interno<input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></label><label>Attesa in giorni<input type="number" min="0" max="60" value={form.delay_days} onChange={(e)=>setForm({...form,delay_days:Number(e.target.value)})}/></label></div><label>Oggetto<input value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})}/></label><label>Testo email<textarea rows={10} value={form.body_text} onChange={(e)=>setForm({...form,body_text:e.target.value})}/></label><footer><small>Variabili: {"{{contact_name}} {{restaurant_name}} {{observation}} {{landing_url}} {{booking_url}} {{sender_name}}"}</small><button className="pynk-outreach-secondary" type="button" onClick={() => void save()} disabled={saving}><Save size={14}/>{saving?"Salvataggio…":"Salva step"}</button></footer></article>;
}

function CampaignSettings({ campaign, onRefresh }: { campaign: OutreachCampaign; onRefresh: () => Promise<void> }) {
  const [form,setForm]=useState(campaign); const [saving,setSaving]=useState(false);
  const save=async()=>{setSaving(true);try{await action({action:"save_campaign",...form});await onRefresh();}finally{setSaving(false);}};
  return <section className="pynk-admin-card pynk-outreach-settings"><h2>Impostazioni campagna</h2><p>L’automazione invia solo quando lo stato è “Attiva”.</p><div className="pynk-outreach-form-grid"><label>Nome<input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></label><label>Stato<select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value as OutreachCampaign["status"]})}><option value="draft">Bozza</option><option value="active">Attiva</option><option value="paused">In pausa</option><option value="completed">Conclusa</option></select></label><label>Nome mittente<input value={form.sender_name} onChange={(e)=>setForm({...form,sender_name:e.target.value})}/></label><label>Reply-to<input type="email" value={form.reply_to} onChange={(e)=>setForm({...form,reply_to:e.target.value})}/></label><label>URL video<input type="url" value={form.video_url??""} onChange={(e)=>setForm({...form,video_url:e.target.value})}/></label><label>URL prenotazione<input type="url" value={form.booking_url} onChange={(e)=>setForm({...form,booking_url:e.target.value})}/></label><label>Limite giornaliero<input type="number" min="1" max="200" value={form.daily_limit} onChange={(e)=>setForm({...form,daily_limit:Number(e.target.value)})}/></label></div><button className="pynk-admin-action-btn" type="button" onClick={() => void save()} disabled={saving}><Save size={15}/>{saving?"Salvataggio…":"Salva impostazioni"}</button></section>;
}

function AddLead({ campaign, onClose, onCreated }: { campaign: OutreachCampaign; onClose:()=>void; onCreated:()=>Promise<void> }) {
  const [form,setForm]=useState({contact_name:"",restaurant_name:"",email:"",phone:"",city:"",website_url:"",image_url:"",observation:"",headline:"",primary_pain:""}); const [error,setError]=useState(""); const [saving,setSaving]=useState(false);
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);setError("");try{await action({action:"create_lead",campaign_id:campaign.id,...form});await onCreated();}catch(reason){setError(reason instanceof Error?reason.message:"Errore");}finally{setSaving(false);}};
  return <div className="pynk-outreach-modal-backdrop" onMouseDown={onClose}><form className="pynk-outreach-modal" onMouseDown={(e)=>e.stopPropagation()} onSubmit={submit}><header><div><p className="pynk-admin-page-subtitle">Nuovo prospect</p><h2>Prepara la landing</h2></div><button type="button" onClick={onClose} aria-label="Chiudi">×</button></header><div className="pynk-outreach-form-grid"><label>Referente *<input required value={form.contact_name} onChange={(e)=>setForm({...form,contact_name:e.target.value})}/></label><label>Ristorante *<input required value={form.restaurant_name} onChange={(e)=>setForm({...form,restaurant_name:e.target.value})}/></label><label>Email *<input required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></label><label>Telefono<input type="tel" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></label><label>Città<input value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/></label><label>Sito attuale<input type="url" value={form.website_url} onChange={(e)=>setForm({...form,website_url:e.target.value})}/></label><label>URL foto hero<input type="url" value={form.image_url} onChange={(e)=>setForm({...form,image_url:e.target.value})}/></label><label>Titolo personalizzato<input value={form.headline} onChange={(e)=>setForm({...form,headline:e.target.value})}/></label></div><label>Osservazione specifica<textarea rows={3} required value={form.observation} onChange={(e)=>setForm({...form,observation:e.target.value})} placeholder="Es. il menu è disponibile solo come PDF e su mobile richiede diversi passaggi"/></label><label>Problema principale mostrato in landing<textarea rows={2} value={form.primary_pain} onChange={(e)=>setForm({...form,primary_pain:e.target.value})}/></label>{error&&<p className="pynk-outreach-error" role="alert">{error}</p>}<footer><button type="button" className="pynk-outreach-secondary" onClick={onClose}>Annulla</button><button className="pynk-admin-action-btn" disabled={saving}>{saving?"Creazione…":"Crea prospect"}</button></footer></form></div>;
}
