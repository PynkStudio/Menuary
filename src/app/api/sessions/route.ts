import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { DbTableSession } from "@/lib/api/orders";

function randomSessionCode(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function dbRowToSession(row: DbTableSession) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tableId: row.table_id,
    code: row.code,
    status: row.status,
    openedAt: row.opened_at,
    closedAt: row.closed_at ?? undefined,
    declaredCovers: row.declared_covers ?? undefined,
  };
}

// ─── POST /api/sessions — apri sessione tavolo (o restituisci quella aperta) ─

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const {
    tenantId,
    tableId,
    declaredCovers,
  }: { tenantId: string; tableId: string; declaredCovers?: number } = await req.json();

  if (!tenantId || !tableId) {
    return NextResponse.json({ error: "tenantId and tableId required" }, { status: 400 });
  }

  // Restituisce sessione aperta esistente per questo tavolo
  const { data: existing } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("table_id", tableId)
    .eq("status", "aperta")
    .maybeSingle();

  if (existing) return NextResponse.json(dbRowToSession(existing as DbTableSession));

  // Crea nuova sessione con codice univoco (retry su conflitto)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomSessionCode();
    const { data, error } = await supabase
      .from("table_sessions")
      .insert({ tenant_id: tenantId, table_id: tableId, code, declared_covers: declaredCovers ?? null })
      .select("*")
      .single();

    if (!error && data) return NextResponse.json(dbRowToSession(data as DbTableSession), { status: 201 });
    // Se conflitto codice, riprova; altrimenti errore
    if (error && !error.message.includes("unique")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "could not generate unique session code" }, { status: 500 });
}

// ─── GET /api/sessions?code=XXXX&tenantId=… — trova sessione per codice QR ──

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tenantId = url.searchParams.get("tenantId");

  if (!code || !tenantId) {
    return NextResponse.json({ error: "code and tenantId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("table_sessions")
    .select("*, session_diners(*)")
    .eq("tenant_id", tenantId)
    .eq("code", code.toUpperCase())
    .eq("status", "aperta")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "session not found" }, { status: 404 });

  return NextResponse.json({
    ...dbRowToSession(data as DbTableSession),
    diners: (data as { session_diners: unknown[] }).session_diners ?? [],
  });
}
