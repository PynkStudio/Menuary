import { agendaHttp, PYNK_AGENDA_SCOPE } from "@/lib/agenda-runtime";

export const dynamic = "force-dynamic";

// GET ?connectionId: calendari in cui una persona può far inserire le call.
export function GET(request: Request) {
  return agendaHttp.calendarsManage(request, { scope: PYNK_AGENDA_SCOPE });
}

// Collega (iCloud/CalDAV, link ICS) o scollega un calendario.
export function POST(request: Request) {
  return agendaHttp.calendarsManage(request, { scope: PYNK_AGENDA_SCOPE });
}

export function DELETE(request: Request) {
  return agendaHttp.calendarsManage(request, { scope: PYNK_AGENDA_SCOPE });
}
