import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicCheckoutOrder } from "@/lib/orders/public-checkout";

export const dynamic = "force-dynamic";

const EDIT_WINDOW_SEC = 300;

type EditLineBody = {
  tenantId?: string;
  token?: string;
  lineId?: string;
  addedExtras?: Array<{ id: string; name: string; price: number }>;
  removedIngredients?: string[];
  note?: string | null;
};

// PATCH /api/checkout/[code]/edit-line
// Modifica extras, ingredienti rimossi e nota di una riga ordine esistente
// entro la finestra di 5 minuti dalla creazione dell'ordine.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = (await req.json().catch(() => null)) as EditLineBody | null;
  if (!body?.tenantId || !body.token || !body.lineId) {
    return NextResponse.json({ error: "tenant_token_and_lineId_required" }, { status: 400 });
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
  const blockedStatuses = ["annullato", "in_preparazione", "pronto", "consegnato", "expired"];
  if (blockedStatuses.includes(order.status)) {
    return NextResponse.json({ error: `blocked_status_${order.status}` }, { status: 409 });
  }

  const elapsedSec = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
  if (elapsedSec > EDIT_WINDOW_SEC) {
    return NextResponse.json({ error: "edit_window_expired" }, { status: 409 });
  }

  const line = order.lines.find((l) => l.id === body.lineId);
  if (!line) {
    return NextResponse.json({ error: "line_not_found" }, { status: 404 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const newExtras = body.addedExtras ?? line.addedExtras;
  const newRemoved = body.removedIngredients ?? line.removedIngredients;
  const newNote = "note" in body ? (body.note ?? null) : (line.notes ?? null);

  const extrasDelta =
    newExtras.reduce((s, e) => s + e.price, 0) -
    line.addedExtras.reduce((s, e) => s + e.price, 0);
  const newUnitPrice = line.unitPrice + extrasDelta;
  const newLineTotal = newUnitPrice * line.qty;

  const { error: lineError } = await db
    .from("order_lines")
    .update({
      added_extras: newExtras,
      removed_ingredients: newRemoved,
      note: newNote,
      unit_price: newUnitPrice,
      line_total: newLineTotal,
    } as never)
    .eq("id", body.lineId)
    .eq("order_id", order.id);

  if (lineError) return NextResponse.json({ error: lineError.message }, { status: 500 });

  const totalDelta = newLineTotal - line.total;
  const newTotal = order.total + totalDelta;

  // Determina se la modifica e' sostanziale (extras/ingredienti) o solo nota.
  const extrasChanged =
    JSON.stringify(newExtras.map((e: { id: string }) => e.id).sort()) !==
    JSON.stringify(line.addedExtras.map((e) => e.id).sort());
  const ingredientsChanged =
    JSON.stringify([...newRemoved].sort()) !==
    JSON.stringify([...line.removedIngredients].sort());
  const isSubstantialEdit = extrasChanged || ingredientsChanged;

  const CONFIRMATION_WINDOW_SEC = 300;
  const orderPatch: Record<string, unknown> = {
    total: newTotal,
    updated_at: new Date().toISOString(),
  };

  if (isSubstantialEdit) {
    // Modifica sostanziale: richiede (ri-)approvazione dal locale.
    // Se gia' pending_confirmation, resetta solo il timer.
    // Se "nuovo", riporta a pending_confirmation.
    if (order.status === "pending_confirmation" || order.status === "nuovo") {
      orderPatch.status = "pending_confirmation";
      orderPatch.confirmed_at = null;
      orderPatch.confirmation_expires_at = new Date(
        new Date(order.createdAt).getTime() + CONFIRMATION_WINDOW_SEC * 1000,
      ).toISOString();
    }
  }

  const { error: orderError } = await db
    .from("orders")
    .update(orderPatch as never)
    .eq("id", order.id)
    .eq("tenant_id", order.tenantId);

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  const needsApproval = isSubstantialEdit &&
    (order.status === "pending_confirmation" || order.status === "nuovo");

  return NextResponse.json({
    ok: true,
    lineId: body.lineId,
    unitPrice: newUnitPrice,
    lineTotal: newLineTotal,
    total: newTotal,
    needsApproval,
    newStatus: needsApproval ? "pending_confirmation" : order.status,
  });
}
