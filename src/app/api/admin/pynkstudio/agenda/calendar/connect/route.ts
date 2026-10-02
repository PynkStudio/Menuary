import { agendaHttp, PYNK_AGENDA_SCOPE } from "@/lib/agenda-runtime";

export const dynamic = "force-dynamic";

// Avvia il collegamento OAuth (Google, Microsoft) per una persona dello staff.
export function GET(request: Request) {
  return agendaHttp.calendarOAuthStart(request, { scope: PYNK_AGENDA_SCOPE });
}
