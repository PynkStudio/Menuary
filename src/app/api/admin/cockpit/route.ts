import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

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
  return isSiteadminRole(sa?.role) && hasAdminPermission(sa.role, "crm:view") ? user : null;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type PaymentJoin = {
  id: string;
  amount: number;
  due_date: string | null;
  lead_id: string;
  kind: string;
  platform_subscriptions: { status: string } | null;
  platform_leads: { business_name: string | null } | null;
};
type ContractRow = {
  id: string;
  numero: string;
  sent_at: string | null;
  contract_data: { cliente?: { ragioneSociale?: string } } | null;
  lead_id: string | null;
};
type SubJoin = {
  id: string;
  lead_id: string;
  tenant_id: string | null;
  platform_leads: { business_name: string | null } | null;
};

export async function GET() {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "service_unconfigured" }, { status: 503 });

  const today = todayISO();
  const soon = addDays(today, 7);

  const [pendingPaymentsRes, contractsRes, suspendedRes] = await Promise.all([
    db
      .from("platform_payments")
      .select(
        "id, amount, due_date, lead_id, kind, platform_subscriptions(status), platform_leads(business_name)",
      )
      .eq("status", "pending")
      .lte("due_date", soon)
      .order("due_date", { ascending: true }),
    db
      .from("platform_contracts")
      .select("id, numero, sent_at, contract_data, lead_id")
      .eq("status", "sent")
      .order("sent_at", { ascending: true }),
    db
      .from("platform_subscriptions")
      .select("id, lead_id, tenant_id, platform_leads(business_name)")
      .eq("status", "suspended"),
  ]);

  const pending = (pendingPaymentsRes.data ?? []) as unknown as PaymentJoin[];
  const overdue = pending
    .filter((p) => p.due_date && p.due_date < today && p.platform_subscriptions?.status !== "cancelled")
    .map((p) => ({
      paymentId: p.id,
      leadId: p.lead_id,
      businessName: p.platform_leads?.business_name ?? "—",
      amount: p.amount,
      dueDate: p.due_date,
      kind: p.kind,
    }));
  const dueSoon = pending
    .filter((p) => p.due_date && p.due_date >= today && p.platform_subscriptions?.status !== "cancelled")
    .map((p) => ({
      paymentId: p.id,
      leadId: p.lead_id,
      businessName: p.platform_leads?.business_name ?? "—",
      amount: p.amount,
      dueDate: p.due_date,
      kind: p.kind,
    }));

  const awaitingSignature = ((contractsRes.data ?? []) as unknown as ContractRow[]).map((c) => ({
    contractId: c.id,
    numero: c.numero,
    businessName: c.contract_data?.cliente?.ragioneSociale ?? "—",
    sentAt: c.sent_at,
    leadId: c.lead_id,
    daysWaiting: c.sent_at ? Math.round((Date.now() - new Date(c.sent_at).getTime()) / 86_400_000) : null,
  }));

  const suspended = ((suspendedRes.data ?? []) as unknown as SubJoin[]).map((s) => ({
    subscriptionId: s.id,
    leadId: s.lead_id,
    tenantId: s.tenant_id,
    businessName: s.platform_leads?.business_name ?? "—",
  }));

  return NextResponse.json({
    overdue,
    dueSoon,
    awaitingSignature,
    suspended,
    counts: {
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      awaitingSignature: awaitingSignature.length,
      suspended: suspended.length,
    },
  });
}
