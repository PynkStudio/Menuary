import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { computeExpiresAt } from "./expiry";
import type { FidelityMember, FidelityProgram, FidelityRedemption, FidelityReward } from "./types";

function randomCode(prefix: string, length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < length; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${s}`;
}

type AnyClient = ReturnType<typeof createSupabaseAdminClient>;
type SupabaseResponse = { data?: unknown; error?: unknown };
type SupabaseTable = PromiseLike<SupabaseResponse> & {
  select: (columns: string) => SupabaseTable;
  eq: (column: string, value: unknown) => SupabaseTable;
  single: () => PromiseLike<SupabaseResponse>;
  insert: (values: unknown) => SupabaseTable;
  update: (values: unknown) => SupabaseTable;
};

function tbl(c: AnyClient, name: string) {
  return (c as unknown as { from: (t: string) => SupabaseTable }).from(name);
}

export async function redeemReward(args: {
  tenantId: string;
  memberId: string;
  rewardId: string;
}): Promise<FidelityRedemption> {
  const c = createSupabaseAdminClient();

  const { data: member, error: mErr } = await tbl(c, "tenant_fidelity_members")
    .select("*")
    .eq("id", args.memberId)
    .eq("tenant_id", args.tenantId)
    .single();
  if (mErr || !member) throw new Error("Iscrizione fedeltà non trovata");
  const fidelityMember = member as FidelityMember;

  const { data: reward, error: rErr } = await tbl(c, "tenant_fidelity_rewards")
    .select("*")
    .eq("id", args.rewardId)
    .eq("tenant_id", args.tenantId)
    .single();
  if (rErr || !reward) throw new Error("Premio non trovato");
  const r = reward as FidelityReward;

  if (!r.is_active) throw new Error("Premio non disponibile");
  if (r.stock !== null && r.stock <= 0) throw new Error("Premio esaurito");
  if (fidelityMember.points_balance < r.points_cost) throw new Error("Punti insufficienti");

  const { data: program } = await tbl(c, "tenant_fidelity_programs")
    .select("*")
    .eq("tenant_id", args.tenantId)
    .single();
  const p = program as FidelityProgram | null;

  let couponCode: string | null = null;
  if (r.kind === "external_coupon_code") {
    const prefix = (r.payload?.code_prefix as string) ?? "FID";
    const length = (r.payload?.code_length as number) ?? 8;
    couponCode = randomCode(prefix, length);
  }

  // Redemption expires after 90gg by default — il coupon va usato.
  const redemptionExpiry = new Date();
  redemptionExpiry.setUTCDate(redemptionExpiry.getUTCDate() + 90);

  const { data: redemption, error: insErr } = await tbl(c, "tenant_fidelity_redemptions")
    .insert({
      tenant_id: args.tenantId,
      member_id: args.memberId,
      reward_id: r.id,
      points_spent: r.points_cost,
      coupon_code: couponCode,
      reward_kind: r.kind,
      reward_payload: r.payload,
      expires_at: redemptionExpiry.toISOString(),
    })
    .select("*")
    .single();
  if (insErr || !redemption) throw insErr ?? new Error("Errore creazione redemption");
  const createdRedemption = redemption as FidelityRedemption;

  const { error: ledgerErr } = await tbl(c, "tenant_fidelity_ledger").insert({
    tenant_id: args.tenantId,
    member_id: args.memberId,
    points: -r.points_cost,
    source: "redemption",
    redemption_id: createdRedemption.id,
    note: `Riscatto: ${r.name}`,
  });
  if (ledgerErr) throw ledgerErr;

  if (r.stock !== null) {
    await tbl(c, "tenant_fidelity_rewards")
      .update({ stock: r.stock - 1 })
      .eq("id", r.id);
  }

  void p; // riservato a futura logica
  void computeExpiresAt;
  return createdRedemption;
}
