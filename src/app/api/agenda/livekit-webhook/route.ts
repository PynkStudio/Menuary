import { agendaHttp } from "@/lib/agenda-runtime";

export const dynamic = "force-dynamic";

// Webhook del server LiveKit (chi entra, stanza chiusa). Firma verificata nel pacchetto.
export function POST(request: Request) {
  return agendaHttp.livekitWebhook(request);
}
