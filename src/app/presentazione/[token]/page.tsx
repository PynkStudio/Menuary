import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { OutreachLandingEvents, OutreachVideoLink } from "@/components/menuary-outreach/outreach-landing-events";
import { loadPublicOutreach } from "@/lib/menuary-outreach/server";
import "@/styles/menuary-outreach.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Una proposta per il tuo locale · Menuary",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OutreachLanding({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await loadPublicOutreach(token);
  if (!data) notFound();
  const { lead, campaign } = data;
  const bookingPath = `/api/menuary/outreach/${token}/click`;
  return (
    <main className="mol-page">
      <OutreachLandingEvents token={token} />
      <nav className="mol-nav" aria-label="Principale">
        <a href="https://menuary.it" className="mol-logo">menuary<span>.</span></a>
        <span>Proposta riservata</span>
      </nav>
      <section className="mol-hero">
        <div className="mol-kicker">Un’idea per {lead.restaurant_name}</div>
        <h1>{lead.headline || `Il vostro locale merita un’esperienza online all’altezza.`}</h1>
        <p className="mol-lead">
          Ciao {lead.contact_name}, abbiamo immaginato come {lead.restaurant_name} potrebbe presentarsi online
          con più carattere e trasformare visite, menu e richieste in un percorso semplice.
        </p>
        <div className="mol-actions">
          {campaign.video_url && <OutreachVideoLink token={token} href={campaign.video_url} />}
          <a href={bookingPath} className="mol-call-button">Parliamone per 15 minuti <span aria-hidden>↗</span></a>
        </div>
      </section>
      <section className="mol-preview" aria-labelledby="mol-preview-title">
        <div className="mol-preview-copy">
          <p className="mol-section-label">Il punto di partenza</p>
          <h2 id="mol-preview-title">Non un sito generico. Una casa digitale per {lead.restaurant_name}.</h2>
          <p>{lead.observation || "Abbiamo osservato la vostra presenza digitale e individuato un’opportunità concreta per raccontare meglio il locale e rendere più dirette le azioni dei clienti."}</p>
          {lead.primary_pain && <blockquote>“{lead.primary_pain}”</blockquote>}
          {lead.website_url && <a href={lead.website_url} target="_blank" rel="noreferrer" className="mol-text-link">Sito attuale ↗</a>}
        </div>
        <div className="mol-phone" aria-label={`Anteprima concettuale per ${lead.restaurant_name}`}>
          <div className="mol-phone-top"><span /><span /></div>
          {lead.image_url ? <Image src={lead.image_url} alt={`Atmosfera di ${lead.restaurant_name}`} width={720} height={540} sizes="(max-width: 760px) 90vw, 360px" unoptimized /> : <div className="mol-placeholder" aria-hidden />}
          <div className="mol-phone-body">
            <small>{lead.city || "Il vostro locale"}</small>
            <strong>{lead.restaurant_name}</strong>
            <p>Menu, storia e prenotazioni in un solo luogo.</p>
            <span className="mol-phone-cta">Scopri il menu</span>
          </div>
        </div>
      </section>
      <section className="mol-benefits" aria-labelledby="mol-benefits-title">
        <p className="mol-section-label">Cosa cambia</p>
        <h2 id="mol-benefits-title">Meno frammentazione. Più controllo.</h2>
        <div className="mol-benefit-grid">
          <article><span>01</span><h3>Immagine coerente</h3><p>Un sito mobile pensato intorno all’identità del locale, non a un template indistinto.</p></article>
          <article><span>02</span><h3>Menu sempre vivo</h3><p>Aggiornamenti autonomi, contenuti leggibili e niente PDF scomodi da consultare.</p></article>
          <article><span>03</span><h3>Contatti diretti</h3><p>Prenotazioni e richieste arrivano al locale, senza perdersi tra canali diversi.</p></article>
        </div>
      </section>
      <section className="mol-closing">
        <p>Possiamo mostrarti il risultato sul tuo caso reale.</p>
        <h2>Quindici minuti, senza impegno.</h2>
        <a href={bookingPath} className="mol-call-button mol-call-button-light">Scegli un orario <span aria-hidden>→</span></a>
      </section>
      <footer className="mol-footer"><span>Menuary · un prodotto PynkStudio</span><a href={`/presentazione/${token}/disiscriviti`}>Non ricevere altri messaggi</a></footer>
    </main>
  );
}
