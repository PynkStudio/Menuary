"use client";

import Link from "next/link";
import { Car, Clock, Mail, MapPin, Phone, Train } from "lucide-react";
import {
  VenueAddressBlock,
  VenueGoogleMapsLink,
  VenueHoursList,
  VenueMapFrame,
  VenuePhoneDisplay,
  VenueWhatsappLink,
  useVenueContactEmail,
} from "@/components/modules/reservations/venue-display";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

export function CascinaErranteContactsPage() {
  const email = useVenueContactEmail();
  const href = useTenantLocalizedHref();

  return (
    <div className="ce-site">
      <section className="ce-page-hero ce-page-hero-warm">
        <p>Contatti</p>
        <h1>Vieni a trovarci nella nostra cascina.</h1>
        <blockquote>Contattaci per organizzare visite, esperienze gastronomiche, eventi, catering e forniture dei nostri prodotti coltivati in Lombardia.</blockquote>
      </section>

      <section className="ce-contact-cards">
        <article><MapPin size={27} /><h2>Indirizzo</h2><VenueAddressBlock /></article>
        <article><Phone size={27} /><h2>Telefono</h2><VenuePhoneDisplay /><VenueWhatsappLink>Scrivici su WhatsApp</VenueWhatsappLink></article>
        <article><Mail size={27} /><h2>Email</h2>{email ? <a href={`mailto:${email}`}>{email}</a> : <span>info@cascinaerrante.it</span>}</article>
        <article><Clock size={27} /><h2>Orari</h2><VenueHoursList variant="footer" /></article>
      </section>

      <section className="ce-contact-main">
        <div className="ce-contact-map"><VenueMapFrame title="Cascina Errante" /></div>
        <div className="ce-directions">
          <p className="ce-eyebrow">Come Raggiungerci</p>
          <h2>Immersa nel verde, vicina a Milano.</h2>
          <div><Car size={23} /><span><strong>In auto</strong>Uscita A4 Milano-Bergamo, poi segui le indicazioni per la cascina.</span></div>
          <div><Train size={23} /><span><strong>Treno + transfer</strong>Da Milano Centrale o Garibaldi, transfer privato su prenotazione.</span></div>
          <VenueGoogleMapsLink className="ce-button ce-button-forest"><MapPin size={18} />Apri in Google Maps</VenueGoogleMapsLink>
        </div>
      </section>

      <section className="ce-faq">
        <div className="ce-heading"><p>Informazioni utili</p><h2>Domande Frequenti</h2></div>
        <div>
          <article><h3>È necessario prenotare per visitare la cascina?</h3><p>Sì, la prenotazione è sempre consigliata, soprattutto per i pasti e le visite guidate.</p></article>
          <article><h3>Avete opzioni per intolleranze alimentari?</h3><p>Possiamo adattare i piatti per diverse esigenze. Comunicale al momento della prenotazione.</p></article>
          <article><h3>Posso acquistare i vostri prodotti online?</h3><p>Sì. Liofilizzati, conserve e prodotti disponibili sono consultabili nel menu e nella bottega online.</p></article>
          <article><h3>Organizzate eventi privati?</h3><p>Organizziamo matrimoni, eventi aziendali e cene private sia in cascina sia in esterna.</p></article>
        </div>
        <Link href={href("/prenota")} className="ce-button ce-button-forest">Prenota o richiedi un evento</Link>
      </section>
    </div>
  );
}
