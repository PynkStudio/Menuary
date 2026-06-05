import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { dbLinesToOrderLines, dbRowToOrder, type DbOrder, type DbOrderLine } from "@/lib/api/orders";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/orders/[id] — leggi singolo ordine ─────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const { id } = await params;

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_lines(*)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });

  const { order_lines: dbLines, ...orderRow } =
  data as unknown as DbOrder & { order_lines: DbOrderLine[] };
  const lines = dbLinesToOrderLines(
    (dbLines ?? []).sort((a, b) => a.position - b.position),
  );

  return NextResponse.json(dbRowToOrder(orderRow, lines));
}

// ─── DELETE /api/orders/[id] ──────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const { id } = await params;

  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
