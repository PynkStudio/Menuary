import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  FidelityEarnRule,
  FidelityLedgerEntry,
  FidelityMember,
  FidelityProgram,
  FidelityReward,
} from "./types";

const TABLE_PROGRAMS = "tenant_fidelity_programs";
const TABLE_RULES = "tenant_fidelity_earn_rules";
const TABLE_REWARDS = "tenant_fidelity_rewards";
const TABLE_MEMBERS = "tenant_fidelity_members";
const TABLE_LEDGER = "tenant_fidelity_ledger";

// Le tabelle fidelity non sono ancora nei tipi generati di Supabase: rigenera
// con `supabase gen types` dopo aver applicato la migration per perdere questo `as any`.
type AnyClient = ReturnType<typeof createSupabaseAdminClient>;
type SupabaseResponse = { data?: unknown; error?: unknown };
type SupabaseTable = PromiseLike<SupabaseResponse> & {
  select: (columns: string) => SupabaseTable;
  eq: (column: string, value: unknown) => SupabaseTable;
  maybeSingle: () => PromiseLike<SupabaseResponse>;
  single: () => PromiseLike<SupabaseResponse>;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseTable;
  limit: (count: number) => SupabaseTable;
  upsert: (values: unknown, options?: unknown) => SupabaseTable;
  delete: () => SupabaseTable;
  insert: (values: unknown) => SupabaseTable;
};

function tbl(c: AnyClient, name: string) {
  return (c as unknown as { from: (t: string) => SupabaseTable }).from(name);
}

export async function getProgram(tenantId: string): Promise<FidelityProgram | null> {
  const c = createSupabaseAdminClient();
  const { data, error } = await tbl(c, TABLE_PROGRAMS).select("*").eq("tenant_id", tenantId).maybeSingle();
  if (error) throw error;
  return (data ?? null) as FidelityProgram | null;
}

export async function upsertProgram(input: Partial<FidelityProgram> & { tenant_id: string }) {
  const c = createSupabaseAdminClient();
  const { error } = await tbl(c, TABLE_PROGRAMS).upsert(input, { onConflict: "tenant_id" });
  if (error) throw error;
}

export async function listEarnRules(tenantId: string): Promise<FidelityEarnRule[]> {
  const c = createSupabaseAdminClient();
  const { data, error } = await tbl(c, TABLE_RULES)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FidelityEarnRule[];
}

export async function upsertEarnRule(input: Partial<FidelityEarnRule> & { tenant_id: string }) {
  const c = createSupabaseAdminClient();
  const { error } = await tbl(c, TABLE_RULES).upsert(input);
  if (error) throw error;
}

export async function deleteEarnRule(id: string, tenantId: string) {
  const c = createSupabaseAdminClient();
  const { error } = await tbl(c, TABLE_RULES).delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) throw error;
}

export async function listRewards(tenantId: string): Promise<FidelityReward[]> {
  const c = createSupabaseAdminClient();
  const { data, error } = await tbl(c, TABLE_REWARDS)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FidelityReward[];
}

export async function upsertReward(input: Partial<FidelityReward> & { tenant_id: string }) {
  const c = createSupabaseAdminClient();
  const { error } = await tbl(c, TABLE_REWARDS).upsert(input);
  if (error) throw error;
}

export async function deleteReward(id: string, tenantId: string) {
  const c = createSupabaseAdminClient();
  const { error } = await tbl(c, TABLE_REWARDS).delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) throw error;
}

export async function listMembers(tenantId: string, limit = 200): Promise<FidelityMember[]> {
  const c = createSupabaseAdminClient();
  const { data, error } = await tbl(c, TABLE_MEMBERS)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("enrolled_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as FidelityMember[];
}

export async function getMemberLedger(memberId: string, limit = 200): Promise<FidelityLedgerEntry[]> {
  const c = createSupabaseAdminClient();
  const { data, error } = await tbl(c, TABLE_LEDGER)
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as FidelityLedgerEntry[];
}

export async function adjustMemberPoints(args: {
  tenantId: string;
  memberId: string;
  points: number;
  note: string;
}) {
  const c = createSupabaseAdminClient();
  const { error } = await tbl(c, TABLE_LEDGER).insert({
    tenant_id: args.tenantId,
    member_id: args.memberId,
    points: args.points,
    source: "manual_adjustment",
    note: args.note,
  });
  if (error) throw error;
}
