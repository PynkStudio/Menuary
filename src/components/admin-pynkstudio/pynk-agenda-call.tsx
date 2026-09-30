"use client";

import "@livekit/components-styles";

import Link from "next/link";
import { ChevronLeft, Mail, Phone } from "lucide-react";
import { AgendaVideoCall } from "@pynkstudio/agendaapp/video/react";

type Props = {
  bookingId: string;
  guestName: string;
  topic: string | null;
  slotLabel: string;
  email: string;
  phone: string | null;
  isVideo: boolean;
  status: string;
};

export function PynkAgendaCall(props: Props) {
  return (
    <div>
      <div className="pynk-admin-call-head">
        <div>
          <Link href="/admin-pynkstudio/agenda" className="pynk-admin-page-subtitle">
            <ChevronLeft size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Agenda
          </Link>
          <h1 className="pynk-admin-page-title">Videocall con {props.guestName}</h1>
          <p className="pynk-admin-page-subtitle">
            {props.slotLabel}
            {props.topic ? ` · ${props.topic}` : ""}
          </p>
        </div>
        <div className="pynk-agenda-modal-contacts">
          {props.phone && <a href={`tel:${props.phone}`}><Phone size={14} /> {props.phone}</a>}
          <a href={`mailto:${props.email}`}><Mail size={14} /> {props.email}</a>
        </div>
      </div>

      {!props.isVideo || props.status === "cancelled" ? (
        <p className="pynk-admin-page-subtitle">
          {props.status === "cancelled" ? "Questa prenotazione è stata annullata." : "Questa è una call telefonica, non una videocall."}
        </p>
      ) : (
        <div className="pynk-admin-call-stage">
          <AgendaVideoCall
            displayName="PYNK STUDIO"
            labels={{
              join: "Apri la stanza",
              mic: "Microfono",
              camera: "Videocamera",
              name: "Nome",
              connecting: "Mi collego…",
              left: "Sei uscito dalla stanza.",
              rejoin: "Rientra",
              ended: "La stanza è chiusa: la call è terminata da oltre 30 minuti.",
              cancelled: "Prenotazione annullata.",
              forbidden: "Non sei autorizzato a entrare in questa stanza.",
              generic: "Collegamento non riuscito. Verifica la configurazione LiveKit.",
            }}
            getAccess={async () => {
              const res = await fetch("/api/tenant/pynkstudio/bookings/video-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId: props.bookingId }),
              });
              return res.json();
            }}
          />
        </div>
      )}
    </div>
  );
}
