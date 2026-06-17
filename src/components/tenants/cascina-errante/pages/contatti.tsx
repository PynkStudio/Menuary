"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import {
  VenueGoogleMapsLink,
  VenueMapFrame,
  VenueWhatsappLink,
} from "@/components/modules/reservations/venue-display";

export function CascinaErranteContactsPage() {
  return (
    <div className="cascina-page cascina-static">
      <section className="cascina-contact-grid">
        <div>
          <p className="cascina-kicker">Contatti</p>
          <h1>Organizza una visita, una cena o un test completo.</h1>
          <p>
            Cascina Errante e configurata come ristorante demo attivo: puoi
            usarla per provare prenotazioni, ordini, messaggi e pagamenti in
            sandbox senza toccare tenant reali.
          </p>
          <div className="cascina-contact-actions">
            <VenueWhatsappLink className="cascina-btn cascina-btn-primary">
              <Phone size={19} />
              Scrivici
            </VenueWhatsappLink>
            <a href="mailto:demo@cascinaerrante.it" className="cascina-btn cascina-btn-secondary">
              <Mail size={19} />
              Email
            </a>
          </div>
          <VenueGoogleMapsLink className="cascina-address-link">
            <MapPin size={18} />
            Apri la mappa
          </VenueGoogleMapsLink>
        </div>
        <div className="cascina-map-wrap">
          <VenueMapFrame title="Mappa Cascina Errante" />
        </div>
      </section>
    </div>
  );
}
