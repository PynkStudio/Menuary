import { agendaHttp, PYNK_AGENDA_SCOPE } from "@/lib/agenda-runtime";

export const dynamic = "force-dynamic";

// Impostazioni agenda (siteadmin): GET dati della pagina, PUT salva un tipo di appuntamento.
export function GET(request: Request) {
  return agendaHttp.settingsGet(request, { scope: PYNK_AGENDA_SCOPE });
}

export function PUT(request: Request) {
  return agendaHttp.settingsSaveEventType(request, { scope: PYNK_AGENDA_SCOPE });
}
