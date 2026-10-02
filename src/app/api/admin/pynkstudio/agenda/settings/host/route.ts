import { agendaHttp, PYNK_AGENDA_SCOPE } from "@/lib/agenda-runtime";

export const dynamic = "force-dynamic";

// Orari personali e disponibilità di una persona dello staff.
export function PATCH(request: Request) {
  return agendaHttp.settingsUpdateHost(request, { scope: PYNK_AGENDA_SCOPE });
}
