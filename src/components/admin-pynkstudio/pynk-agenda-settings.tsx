"use client";

import "@pynkstudio/agendaapp/settings/styles.css";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AgendaSettingsPanel } from "@pynkstudio/agendaapp/settings/react";

export function PynkAgendaSettings({ returnTo }: { returnTo: string }) {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin-pynkstudio/agenda" className="pynk-admin-page-subtitle">
          <ChevronLeft size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Agenda
        </Link>
        <h1 className="pynk-admin-page-title">Impostazioni agenda</h1>
        <p className="pynk-admin-page-subtitle">
          Orari e giorni prenotabili, appuntamenti contemporanei, festività, staff e calendari collegati.
        </p>
      </div>
      <AgendaSettingsPanel
        className="pynk-ags"
        locale="it"
        returnTo={returnTo}
        endpoints={{
          settings: "/api/admin/pynkstudio/agenda/settings",
          host: "/api/admin/pynkstudio/agenda/settings/host",
          calendars: "/api/admin/pynkstudio/agenda/calendars",
          oauthStart: "/api/admin/pynkstudio/agenda/calendar/connect",
        }}
      />
    </div>
  );
}
