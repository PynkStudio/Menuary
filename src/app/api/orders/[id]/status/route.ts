import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { OrderStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES: OrderStatus[] = [
  "nuovo",
  "in_preparazione",
  "pronto",
  "consegnato",
  "annullato",
];

// ─── PATCH /api/orders/[id]/status — aggiorna stato ordine ───────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const { id } = await params;
  const { status }: { status: OrderStatus } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
