import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isAysPresenterAuthorized, isAysPresenterRateLimited } from "@/lib/ays-presenter/auth";
import { AYS_PACK_BUCKET } from "@/lib/ays-presenter/pack";

export const runtime = "nodejs";

/**
 * Clip del pack, indirizzata dallo SHA-256 del contenuto: immutabile. Una
 * battuta sostituita ha un hash nuovo, quindi l'host non può mai tenere una
 * versione vecchia sotto lo stesso nome.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ sha256: string }> }) {
  if (!isAysPresenterAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isAysPresenterRateLimited(req, "clip", 400)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const { sha256 } = await params;
  if (!/^[0-9a-f]{64}$/.test(sha256)) return NextResponse.json({ error: "invalid_clip" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const { data } = await supabase.storage.from(AYS_PACK_BUCKET).download(`clips/${sha256}.mp3`);
  if (!data) return NextResponse.json({ error: "clip_not_found" }, { status: 404 });
  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
