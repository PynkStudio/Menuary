import { NextResponse } from "next/server";
import { listAccounts, listLocationsWithMeta, linkLocation } from "@/lib/google/my-business";
import { requireGestione } from "@/lib/gestione-auth";

// GET  → lista account + sedi disponibili dopo OAuth
// POST → collega la sede selezionata al tenant

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const auth = await requireGestione(tenantId, "admin");
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  if (auth.isDemo) return NextResponse.json({ accounts: [] });

  try {
    const accounts = (await listAccounts(tenantId)) as Array<{ name: string; accountName: string }>;
    const results = await Promise.all(
      accounts.map(async (acc) => ({
        account: acc,
        locations: await listLocationsWithMeta(tenantId, acc.name),
      })),
    );
    return NextResponse.json({ accounts: results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    tenantId: string;
    locationResourceName: string;
    placeId: string | null;
    locationName: string | null;
  };
  const auth = await requireGestione(body.tenantId, "admin");
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  if (auth.isDemo) return NextResponse.json({ ok: true });

  try {
    await linkLocation(body.tenantId, body.locationResourceName, body.placeId, body.locationName);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
