import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isAysPresenterAuthorized, isAysPresenterRateLimited } from "@/lib/ays-presenter/auth";
import { AYS_PACK_FORMAT } from "@/lib/ays-presenter/pack";

export const runtime = "nodejs";

/**
 * Manifest del pack per una lingua. L'host manda il `format` più alto che sa
 * leggere e l'ETag della revisione che ha già: con `If-None-Match` uguale
 * riceve 304 e non riscarica nulla.
 */
export async function GET(req: NextRequest) {
  if (!isAysPresenterAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isAysPresenterRateLimited(req, "pack", 20)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const params = req.nextUrl.searchParams;
  const locale = /^(en|it|fr|es|pt|de)$/.test(params.get("locale") ?? "") ? params.get("locale")! : "en";
  const clientFormat = Number.parseInt(params.get("format") ?? "", 10);
  const format = Number.isFinite(clientFormat) ? Math.min(clientFormat, AYS_PACK_FORMAT) : AYS_PACK_FORMAT;

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("ays_presenter_packs")
    .select("revision, manifest")
    .eq("locale", locale)
    .lte("format", format)
    .order("format", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "pack_query_failed" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "pack_not_published" }, { status: 404 });

  const etag = `"${locale}-f${format}-r${data.revision}"`;
  const headers = { ETag: etag, "Cache-Control": "private, no-cache" };
  if (req.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers });
  return NextResponse.json(data.manifest, { headers });
}
