import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireSiteadmin } from "@/lib/pynkstudio/crm-admin";
import { betaOrigin, notifyBetaTesters } from "@/lib/pynkstudio/beta";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** { dryRun: true } conta i destinatari senza inviare; altrimenti invia e registra. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const { id } = await params;

  let dryRun = false;
  try {
    dryRun = ((await request.json()) as { dryRun?: unknown }).dryRun === true;
  } catch {
    // body vuoto = invio reale
  }

  const { data: beta } = await svc.from("pynkstudio_betas").select("*").eq("id", id).maybeSingle();
  if (!beta) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (beta.status !== "open") return NextResponse.json({ error: "beta_not_open" }, { status: 409 });

  const result = await notifyBetaTesters(svc, beta, betaOrigin(request), dryRun);
  return NextResponse.json(result);
}
