import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";

export const dynamic = "force-dynamic";

// POST /api/checkout/[code]/cancel
// Body: { tenantId, token }
// Annullamento pubblico vincolato a:
//   - token corretto
//   - finestra di 2 minuti da created_at
//   - ordine non già pagato né già confermato
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

  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "already_paid" }, { status: 409 });
  }
  // L'ordine non deve essere già annullato, accettato/in lavorazione o scaduto.
  const blockedStatuses = ["nuovo", "annullato", "in_preparazione", "pronto", "consegnato", "expired"];
  if (blockedStatuses.includes(order.status)) {
    return NextResponse.json({ error: `already_${order.status}` }, { status: 409 });
  }

  const createdAt = new Date(order.createdAt).getTime();
  const elapsedSec = (Date.now() - createdAt) / 1000;
  if (elapsedSec > 120) {
    return NextResponse.json({ error: "cancel_window_expired" }, { status: 409 });
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
      status: "annullato",
      payment_status: "not_required",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("tenant_id", order.tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
