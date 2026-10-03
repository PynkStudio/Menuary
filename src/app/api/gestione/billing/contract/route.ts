import { NextRequest, NextResponse } from "next/server";
import { requireGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getCountersignedContractByTenant } from "@/lib/contracts/contract-queries";

export const dynamic = "force-dynamic";

async function canAccessTenant(tenantId: string) {
  const auth = await requireGestione(tenantId, "can_view_financials");
  // La demo backend live non ha un utente: contratti e fatture restano esclusi.
  return auth.ok && !auth.isDemo && auth.userId !== "demo";
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenant");
  if (!tenantId) return NextResponse.json({ error: "tenant obbligatorio" }, { status: 400 });
  if (!(await canAccessTenant(tenantId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contract = await getCountersignedContractByTenant(tenantId);
  if (!contract?.signed_document_path) {
    return NextResponse.json({ error: "Contratto firmato non disponibile" }, { status: 404 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "Storage non configurato" }, { status: 503 });
  const { data, error } = await db.storage.from("platform-documents").download(contract.signed_document_path);
  if (error || !data) return NextResponse.json({ error: "File non trovato" }, { status: 404 });

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Contratto-${contract.numero}.pdf"`,
    },
  });
}
