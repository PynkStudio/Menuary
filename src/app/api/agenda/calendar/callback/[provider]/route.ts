import { NextResponse } from "next/server";
import { agendaHttp } from "@/lib/agenda-runtime";

export const dynamic = "force-dynamic";

// Ritorno OAuth di Google/Microsoft. Nessuna sessione richiesta: lo state è firmato dal pacchetto.
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "microsoft") return NextResponse.json({ error: "not_found" }, { status: 404 });
  return agendaHttp.calendarOAuthCallback(request, provider);
}
