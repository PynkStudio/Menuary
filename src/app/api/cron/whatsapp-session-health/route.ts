import { NextResponse } from "next/server";
import { alertStaleWhatsappSessions } from "@/lib/whatsapp/session-status";

export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alerted = await alertStaleWhatsappSessions();
    return NextResponse.json({ ok: true, alerted });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "whatsapp_session_health_failed" },
      { status: 500 },
    );
  }
}
