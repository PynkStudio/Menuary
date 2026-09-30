import { agendaHttp, PYNK_AGENDA_SCOPE } from "@/lib/agenda-runtime";

export const dynamic = "force-dynamic";

// Agenda admin PynkStudio: solo siteadmin abilitati (controllo in agenda-runtime).
export function GET(request: Request) {
  return agendaHttp.hostList(request, { scope: PYNK_AGENDA_SCOPE });
}

// { id, action: "cancel" | "complete" | "no_show" }. Il CRM si aggiorna nell'hook di annullamento.
export function PATCH(request: Request) {
  return agendaHttp.hostUpdate(request, { scope: PYNK_AGENDA_SCOPE });
}
