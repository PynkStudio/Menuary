import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";

export const dynamic = "force-dynamic";

// POST /api/checkout/[code]/delivered
// Body: { tenantId, token }
// Conferma pubblica di ricezione: il cliente marca come "consegnato" un ordine
// che il locale ha già messo "in_consegna". Vincolato a token corretto e stato.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  let body: { tenantId?: string; token?: string } = {};
  try {
    body = (await req.json()) as { tenantId?: string; token?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.tenantId || !body.token) {
    return NextResponse.json({ error: "tenantId_and_token_required" }, { status: 400 });
  }

  const order = await getPublicCheckoutOrder({
    tenantId: body.tenantId,
    code,
    token: body.token,
  });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });

  // Solo da "in_consegna": prima è prematuro, dopo è già concluso o annullato.
  if (order.status !== "in_consegna") {
    return NextResponse.json({ error: `not_in_delivery` }, { status: 409 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { error } = await (db as unknown as {
    from: (t: "orders") => {
      update: (row: Record<string, unknown>) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
  })
    .from("orders")
    .update({
      status: "consegnato",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("tenant_id", order.tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
