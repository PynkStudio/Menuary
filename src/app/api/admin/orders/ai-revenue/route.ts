import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  AI_ORDER_SOURCES,
  AI_COMMISSION_RATE,
  AI_CONFIRMED_ORDER_STATUSES,
  AI_NON_CONCLUDED_ORDER_STATUSES,
  type PlatformAIOrder,
  type PlatformNonAIOrderStat,
  type AIOrderBillingStatus,
  type AIOrderCategory,
  type AIOrderSource,
} from "@/lib/platform-crm-types";

export const dynamic = "force-dynamic";

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(sa?.role) && hasAdminPermission(sa.role, "crm:view")
    ? user
    : null;
}

function orderCategory(status: string): AIOrderCategory {
  if ((AI_CONFIRMED_ORDER_STATUSES as readonly string[]).includes(status)) return "confirmed";
  if ((AI_NON_CONCLUDED_ORDER_STATUSES as readonly string[]).includes(status)) return "non_concluded";
  return "pending";
}

function billingStatus(row: {
  payment_provider: string | null;
  application_fee_amount_cents: number | null;
}): AIOrderBillingStatus {
  if (row.payment_provider === "stripe") return "stripe";
  if (row.application_fee_amount_cents !== null) return "cash_billed";
  return "cash_pending";
}

type OrderRow = {
  id: string;
  tenant_id: string;
  code: string;
  source: string;
  status: string;
  customer_name: string | null;
  total: number;
  payment_provider: string | null;
  payment_status: string;
  application_fee_amount_cents: number | null;
  created_at: string;
};

type TenantRow = {
  id: string;
  name: string;
  label: string;
};

// ─── GET /api/admin/orders/ai-revenue ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const from = searchParams.get("from") ?? ninetyDaysAgo;
  const to = searchParams.get("to") ?? new Date().toISOString();

  const db = createSupabaseServiceClient();
  if (!db) {
    return NextResponse.json({ aiOrders: [], nonAiStats: [] });
  }

  const SELECT_FIELDS =
    "id, tenant_id, code, source, status, customer_name, total, payment_provider, payment_status, application_fee_amount_cents, created_at";

  const [aiResult, nonAiResult] = await Promise.all([
    db
      .from("orders")
      .select(SELECT_FIELDS)
      .in("source", [...AI_ORDER_SOURCES])
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("orders")
      .select("tenant_id, source, total, payment_status")
      .not("source", "in", `(${AI_ORDER_SOURCES.join(",")})`)
      .gte("created_at", from)
      .lte("created_at", to)
      .limit(2000),
  ]);

  const aiRows = (aiResult.data ?? []) as OrderRow[];
  const nonAiRows = (nonAiResult.data ?? []) as Pick<
    OrderRow,
    "tenant_id" | "source" | "total" | "payment_status"
  >[];

  // Fetch tenant names for all referenced tenant IDs
  const tenantIds = [
    ...new Set([
      ...aiRows.map((r) => r.tenant_id),
      ...nonAiRows.map((r) => r.tenant_id),
    ]),
  ].filter(Boolean);

  const { data: tenantRows } = tenantIds.length
    ? await db.from("tenants").select("id, name, label").in("id", tenantIds)
    : { data: [] as TenantRow[] };

  const tenantById = new Map<string, TenantRow>(
    ((tenantRows ?? []) as TenantRow[]).map((t) => [t.id, t]),
  );

  function tenantName(tenantId: string): string {
    const t = tenantById.get(tenantId);
    return t?.label ?? t?.name ?? tenantId;
  }

  // Build AI orders
  const aiOrders: PlatformAIOrder[] = aiRows.map((row) => {
    const total = Number(row.total);
    const category = orderCategory(row.status);
    const bStatus = billingStatus(row);

    // Commissione: applicata solo ai confermati, 0 per pending
    // Per non conclusi l'importo è positivo ma la categoria indica lo storno
    const feeFromStripe =
      row.application_fee_amount_cents !== null
        ? row.application_fee_amount_cents / 100
        : null;
    const commissionAmount = feeFromStripe ?? Math.round(total * AI_COMMISSION_RATE * 100) / 100;

    return {
      id: row.id,
      tenant_id: row.tenant_id,
      tenant_name: tenantName(row.tenant_id),
      code: row.code,
      source: row.source as AIOrderSource,
      status: row.status,
      category,
      customer_name: row.customer_name,
      total,
      commission_rate: AI_COMMISSION_RATE,
      commission_amount: commissionAmount,
      payment_provider: row.payment_provider,
      payment_status: row.payment_status,
      application_fee_amount_cents: row.application_fee_amount_cents,
      billing_status: bStatus,
      created_at: row.created_at,
    };
  });

  // Aggregate non-AI stats by tenant+source
  const nonAiMap = new Map<string, PlatformNonAIOrderStat>();
  for (const row of nonAiRows) {
    const key = `${row.tenant_id}::${row.source}`;
    const existing = nonAiMap.get(key);
    if (existing) {
      existing.order_count += 1;
      existing.total_volume += Number(row.total);
    } else {
      nonAiMap.set(key, {
        tenant_id: row.tenant_id,
        tenant_name: tenantName(row.tenant_id),
        source: row.source,
        order_count: 1,
        total_volume: Number(row.total),
      });
    }
  }

  const nonAiStats = [...nonAiMap.values()].sort(
    (a, b) => b.total_volume - a.total_volume,
  );

  return NextResponse.json({ aiOrders, nonAiStats });
}

// ─── POST /api/admin/orders/ai-revenue — segna commissione cash come addebitata ──
// Solo per ordini confermati.

export async function POST(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { orderId?: string };
  if (!body.orderId) {
    return NextResponse.json({ error: "orderId obbligatorio" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "db unavailable" }, { status: 503 });

  const { data: order, error: fetchErr } = await db
    .from("orders")
    .select("id, total, source, status, payment_provider, application_fee_amount_cents")
    .eq("id", body.orderId)
    .in("source", [...AI_ORDER_SOURCES])
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Ordine non trovato" }, { status: 404 });
  }
  if (orderCategory(order.status) !== "confirmed") {
    return NextResponse.json(
      { error: "Commissione applicabile solo agli ordini confermati" },
      { status: 400 },
    );
  }
  if (order.payment_provider === "stripe") {
    return NextResponse.json(
      { error: "Ordine Stripe: commissione già tracciata automaticamente" },
      { status: 400 },
    );
  }
  if (order.application_fee_amount_cents !== null) {
    return NextResponse.json({ error: "Commissione già segnata" }, { status: 400 });
  }

  const feeAmountCents = Math.round(Number(order.total) * 100 * AI_COMMISSION_RATE);

  const { error: updateErr } = await db
    .from("orders")
    .update({ application_fee_amount_cents: feeAmountCents })
    .eq("id", body.orderId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, feeAmountCents });
}
