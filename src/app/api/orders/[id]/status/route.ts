import { after, NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { pushOrderStatusToHubrise } from "@/lib/hubrise/push-status";
import type { OrderStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };
type PersistedOrderStatus = Exclude<OrderStatus, "pending_confirmation" | "expired">;

const VALID_STATUSES: PersistedOrderStatus[] = [
  "nuovo",
  "in_preparazione",
  "pronto",
  "consegnato",
  "annullato",
];

function isPersistedOrderStatus(status: unknown): status is PersistedOrderStatus {
  return typeof status === "string" && VALID_STATUSES.includes(status as PersistedOrderStatus);
}

// ─── PATCH /api/orders/[id]/status — aggiorna stato ordine ───────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const { id } = await params;
  const { status }: { status: unknown } = await req.json();

  if (!isPersistedOrderStatus(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Propaga lo status alla piattaforma HubRise di origine (no-op per ordini diretti).
  after(async () => {
    await pushOrderStatusToHubrise({ orderId: id, newStatus: status });
  });

  return NextResponse.json({ ok: true });
}
