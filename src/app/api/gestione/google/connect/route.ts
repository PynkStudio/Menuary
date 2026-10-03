import { NextResponse } from "next/server";
import { buildOAuthUrl } from "@/lib/google/my-business";
import { requireGestione } from "@/lib/gestione-auth";

// GET /api/gestione/google/connect?tenantId=bepork
// Restituisce l'URL OAuth da cui il gestore deve essere reindirizzato.
export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const auth = await requireGestione(tenantId, "admin");
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  if (auth.isDemo) return NextResponse.json({ error: "Collegamento Google non disponibile in demo." }, { status: 409 });

  try {
    const url = buildOAuthUrl(tenantId);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
