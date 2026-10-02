import { agendaHttp, PYNK_AGENDA_SCOPE } from "@/lib/agenda-runtime";

export const dynamic = "force-dynamic";

// Collega (iCloud/CalDAV, link ICS) o scollega un calendario.
export function POST(request: Request) {
  return agendaHttp.calendarsManage(request, { scope: PYNK_AGENDA_SCOPE });
}

export function DELETE(request: Request) {
  return agendaHttp.calendarsManage(request, { scope: PYNK_AGENDA_SCOPE });
}
