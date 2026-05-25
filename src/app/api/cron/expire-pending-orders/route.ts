import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const maxDuration = 60;

// Vercel chiama i cron con header Authorization: Bearer {CRON_SECRET}.
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

/**
 * Marca come `expired` tutti gli ordini in `pending_confirmation` la cui
 * finestra di conferma è già scaduta. Idempotente: gira ogni minuto.
 *
 * Realtime già publication-ato → la pagina /ordina/attesa del cliente vede
 * il cambio di stato istantaneamente e mostra "tempo scaduto".
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "service unavailable" }, { status: 503 });
  }

  const nowIso = new Date().toISOString();

  // Solo righe che sono ancora pending e con expires < now.
  // .select() per ricevere il count e l'elenco aggiornato.
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "expired", updated_at: nowIso })
    .eq("status", "pending_confirmation")
    .lt("confirmation_expires_at", nowIso)
    .select("id, tenant_id, code");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    expiredCount: data?.length ?? 0,
    expired: data ?? [],
  });
}
