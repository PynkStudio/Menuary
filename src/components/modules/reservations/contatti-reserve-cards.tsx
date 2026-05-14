"use client";

import { MessageCircle, Phone } from "lucide-react";
import { useVenueContactPhone } from "@/components/modules/reservations/venue-display";

export function ContattiReserveCards() {
  const { display, telHref, waHref } = useVenueContactPhone();

  return (
    <>
      <a
        href={waHref()}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col gap-3 rounded-3xl bg-pork-red p-8 text-white shadow-xl transition-transform hover:-translate-y-1"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-pork-red">
          <MessageCircle size={24} />
        </div>
        <p className="impact-title text-3xl">Prenota su WhatsApp</p>
        <p className="text-white/85">
          Risposta veloce, messaggio già pronto da modificare con giorno, orario e
          numero di persone.
        </p>
        <span className="mt-auto font-bold">{display}</span>
      </a>

      <a
        href={telHref}
        className="group flex flex-col gap-3 rounded-3xl bg-pork-mustard p-8 text-pork-ink shadow-xl transition-transform hover:-translate-y-1"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pork-ink text-pork-mustard">
          <Phone size={24} />
        </div>
        <p className="impact-title text-3xl">Chiamaci</p>
        <p className="text-pork-ink/80">
          Preferisci sentire una voce? Siamo qui negli orari di apertura.
        </p>
        <span className="mt-auto font-bold">{display}</span>
      </a>
    </>
  );
}
