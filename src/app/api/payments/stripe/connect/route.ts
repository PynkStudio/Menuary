import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/payments/stripe/connect";

export const dynamic = "force-dynamic";

// POST /api/payments/stripe/connect
// Body: { tenantId, email? }
// Restituisce { url } — frontend admin redirige il browser su questo URL.
export async function POST(req: NextRequest) {
  let body: { tenantId?: string; email?: string } = {};
  try {
    body = (await req.json()) as { tenantId?: string; email?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.tenantId) {
    return NextResponse.json({ error: "tenantId_required" }, { status: 400 });
  }
  try {
    const url = buildAuthorizeUrl({ tenantId: body.tenantId, email: body.email });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "stripe_connect_unavailable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
